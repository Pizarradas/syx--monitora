/**
 * BiasMapper - Optional translation layer with pluggable providers.
 */

export const VERSION = '0.3.0-pipeline';

const TRANSLATION_PROVIDERS = {
  libretranslate: {
    validateConfig(options = {}) {
      const endpoint = normalizeEndpoint(options.endpoint);
      const outputLanguage = normalizeLang(options.outputLanguage || 'en');
      return {
        ok: Boolean(endpoint && outputLanguage && outputLanguage !== 'auto'),
        endpoint,
        outputLanguage,
        sourceLanguage: normalizeLang(options.sourceLanguage || 'auto') || 'auto',
        reason: endpoint ? '' : 'Missing translation endpoint.',
      };
    },
    async isAvailable(config) {
      return { available: Boolean(config.endpoint), reason: config.reason || '' };
    },
    async run(extracted, config) {
      const snapshot = buildSnapshot(extracted);
      const inputs = [snapshot.title, ...snapshot.headings, ...snapshot.paragraphs].filter(Boolean);
      if (!inputs.length) {
        throw new Error('No translatable content found.');
      }

      const response = await fetch(`${config.endpoint}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: inputs,
          source: config.sourceLanguage || 'auto',
          target: config.outputLanguage,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate responded with ${response.status}.`);
      }

      return {
        payload: await response.json(),
        inputs,
        snapshot,
      };
    },
    normalizeResult(raw, context) {
      const translatedItems = normalizeTranslatedItems(raw.payload, raw.inputs.length);
      if (!translatedItems.length) {
        return normalizeTranslationError(new Error('Could not parse translated response.'), context);
      }

      let cursor = 0;
      const translatedTitle = translatedItems[cursor++] || raw.snapshot.title;
      const translatedHeadings = raw.snapshot.headings.map(() => translatedItems[cursor++] || '');
      const translatedParagraphs = raw.snapshot.paragraphs.map(() => translatedItems[cursor++] || '');
      const translatedExtracted = {
        ...context.extracted,
        meta: {
          ...context.extracted.meta,
          title: translatedTitle,
          language: context.config.outputLanguage,
        },
        headings: translatedHeadings.filter(Boolean),
        paragraphs: translatedParagraphs.filter(Boolean),
        fullText: translatedParagraphs.filter(Boolean).join('\n\n'),
      };

      const translatedCount = translatedParagraphs.filter(Boolean).length + (translatedTitle ? 1 : 0);
      const coverage = translatedCount >= Math.max(4, Math.ceil(raw.inputs.length * 0.6))
        ? 'high'
        : translatedCount >= 2
          ? 'medium'
          : 'none';

      return buildTranslationResult(context, {
        available: coverage !== 'none',
        status: coverage === 'high' ? 'ready' : coverage === 'medium' ? 'partial' : 'failed',
        coverage,
        translatedExtracted,
      });
    },
    normalizeError(error, context) {
      return normalizeTranslationError(error, context);
    },
  },
  remote: {
    validateConfig(options = {}) {
      const endpoint = normalizeEndpoint(options.endpoint);
      const outputLanguage = normalizeLang(options.outputLanguage || 'en');
      return {
        ok: Boolean(endpoint && outputLanguage && outputLanguage !== 'auto'),
        endpoint,
        outputLanguage,
        sourceLanguage: normalizeLang(options.sourceLanguage || 'auto') || 'auto',
        reason: endpoint ? '' : 'Missing remote translation endpoint.',
      };
    },
    async isAvailable(config) {
      return { available: Boolean(config.endpoint), reason: config.reason || '' };
    },
    async run(extracted, config) {
      const response = await fetch(`${config.endpoint}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_language: config.sourceLanguage || 'auto',
          output_language: config.outputLanguage,
          article: {
            url: extracted.url || '',
            meta: extracted.meta || {},
            headings: extracted.headings || [],
            paragraphs: extracted.paragraphs || [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Remote translation service responded with ${response.status}.`);
      }

      return await response.json();
    },
    normalizeResult(payload, context) {
      const translatedExtracted = buildRemoteTranslatedExtracted(payload, context.extracted, context.config.outputLanguage);
      if (!translatedExtracted) {
        return normalizeTranslationError(new Error('Could not parse remote translation response.'), context);
      }

      const translatedParagraphCount = (translatedExtracted.paragraphs || []).filter(Boolean).length;
      const translatedHeadingCount = (translatedExtracted.headings || []).filter(Boolean).length;
      const translatedCount = translatedParagraphCount + translatedHeadingCount + (translatedExtracted.meta?.title ? 1 : 0);
      const coverage = translatedCount >= 6 ? 'high' : translatedCount >= 2 ? 'medium' : 'none';

      return buildTranslationResult(context, {
        available: coverage !== 'none',
        status: payload?.status || (coverage === 'high' ? 'ready' : coverage === 'medium' ? 'partial' : 'failed'),
        coverage: payload?.coverage || coverage,
        translatedExtracted,
      });
    },
    normalizeError(error, context) {
      return normalizeTranslationError(error, context);
    },
  },
  mock: {
    validateConfig(options = {}) {
      return {
        ok: true,
        endpoint: null,
        outputLanguage: normalizeLang(options.outputLanguage || 'en') || 'en',
        sourceLanguage: normalizeLang(options.sourceLanguage || 'auto') || 'auto',
        reason: '',
      };
    },
    async isAvailable() {
      return { available: true, reason: '' };
    },
    async run(extracted, config) {
      const paragraphs = (extracted.paragraphs || []).map((paragraph, index) => (
        `[mock:${config.outputLanguage}:${index + 1}] ${String(paragraph || '').trim()}`
      ));
      return {
        meta: {
          ...(extracted.meta || {}),
          title: `[mock:${config.outputLanguage}] ${String(extracted.meta?.title || '').trim()}`,
          language: config.outputLanguage,
        },
        headings: (extracted.headings || []).map((heading) => `[mock] ${String(heading || '').trim()}`),
        paragraphs,
      };
    },
    normalizeResult(payload, context) {
      const translatedExtracted = {
        ...context.extracted,
        meta: payload.meta,
        headings: payload.headings || [],
        paragraphs: payload.paragraphs || [],
        fullText: (payload.paragraphs || []).join('\n\n'),
      };

      return buildTranslationResult(context, {
        available: true,
        status: 'ready',
        coverage: 'high',
        translatedExtracted,
      });
    },
    normalizeError(error, context) {
      return normalizeTranslationError(error, context);
    },
  },
};

export function getTranslationProvider(provider = 'libretranslate') {
  return TRANSLATION_PROVIDERS[provider] || null;
}

export function listTranslationProviders() {
  return Object.keys(TRANSLATION_PROVIDERS);
}

export async function translateExtracted(extracted, options = {}) {
  if (!options?.enabled) {
    return buildTranslationResult({ extracted, providerName: null, config: {} }, {
      available: false,
      executed: false,
      needed: true,
      status: 'disabled',
      coverage: 'none',
      reason: 'Translation layer disabled.',
      actionable: 'Enable translation to get output in the selected language.',
    });
  }

  let providerName = options.provider || 'auto';
  if (providerName === 'auto') {
    const hasRemote = Boolean(String(options.endpoint || '').trim());
    providerName = hasRemote ? 'remote' : 'auto';
  }
  if (providerName === 'auto') {
    return buildTranslationResult({ extracted, providerName: null, config: {} }, {
      available: false,
      executed: false,
      needed: true,
      status: 'failed',
      coverage: 'none',
      reason: 'No automatic translation provider is ready on this device.',
      actionable: 'Configure a translation API to enable automatic translation.',
    });
  }
  const provider = getTranslationProvider(providerName);
  if (!provider) {
    return buildTranslationResult({ extracted, providerName, config: {} }, {
      available: false,
      executed: false,
      needed: true,
      status: 'failed',
      coverage: 'none',
      reason: `Unsupported translation provider: ${providerName}`,
      actionable: 'Choose a supported translation provider.',
    });
  }

  const config = provider.validateConfig(options);
  const context = { extracted, providerName, config, options };

  if (!config.ok) {
    return buildTranslationResult(context, {
      available: false,
      executed: false,
      needed: true,
      status: 'failed',
      coverage: 'none',
      reason: config.reason || 'Invalid translation configuration.',
      actionable: suggestTranslationAction(providerName),
    });
  }

  if (config.sourceLanguage !== 'auto' && config.sourceLanguage === config.outputLanguage) {
    return buildTranslationResult(context, {
      available: false,
      executed: false,
      needed: false,
      status: 'direct',
      coverage: 'native',
      reason: 'Translation not needed.',
      actionable: '',
    });
  }

  try {
    const availability = await provider.isAvailable(config, extracted);
    if (availability?.available === false) {
      return buildTranslationResult(context, {
        available: false,
        executed: false,
        needed: true,
        status: 'failed',
        coverage: 'none',
        reason: availability.reason || 'Translation provider not available.',
        actionable: suggestTranslationAction(providerName),
      });
    }

    const rawResult = await provider.run(extracted, config);
    return provider.normalizeResult(rawResult, context);
  } catch (error) {
    return provider.normalizeError(error, context);
  }
}

function buildTranslationResult(context, overrides = {}) {
  const config = context?.config || {};
  return {
    available: Boolean(overrides.available),
    executed: overrides.executed ?? Boolean(overrides.available),
    needed: overrides.needed ?? true,
    status: overrides.status || 'failed',
    coverage: overrides.coverage || 'none',
    provider: overrides.provider || context?.providerName || null,
    endpoint: config.endpoint || null,
    sourceLanguage: overrides.sourceLanguage || config.sourceLanguage || null,
    outputLanguage: overrides.outputLanguage || config.outputLanguage || null,
    translatedExtracted: overrides.translatedExtracted || null,
    reason: overrides.reason || '',
    actionable: overrides.actionable || '',
    diagnostics: {
      provider: context?.providerName || null,
      endpoint: config.endpoint || null,
    },
  };
}

function normalizeTranslationError(error, context) {
  return buildTranslationResult(context, {
    available: false,
    executed: true,
    needed: true,
    status: 'failed',
    coverage: 'none',
    reason: error?.message || 'Translation failed.',
    actionable: suggestTranslationAction(context?.providerName),
  });
}

function suggestTranslationAction(providerName) {
  if (providerName === 'libretranslate') {
    return 'Verify the LibreTranslate endpoint and that the server supports the selected language pair.';
  }
  if (providerName === 'remote') {
    return 'Verify the remote endpoint and its /translate contract.';
  }
  return 'Review the translation provider configuration.';
}

function buildSnapshot(extracted) {
  return {
    title: String(extracted.meta?.title || '').trim(),
    headings: (extracted.headings || []).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6),
    paragraphs: (extracted.paragraphs || []).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12),
  };
}

function normalizeTranslatedItems(payload, expectedLength) {
  const value = payload?.translatedText;
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).slice(0, expectedLength);
  }

  if (typeof value === 'string') {
    return [value.trim()];
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => String(item?.translatedText || item || '').trim()).slice(0, expectedLength);
  }

  return [];
}

function buildRemoteTranslatedExtracted(payload, extracted, outputLanguage) {
  const translated =
    payload?.translatedExtracted ||
    payload?.translated_extract ||
    payload?.article ||
    null;

  if (translated) {
    return {
      ...extracted,
      ...translated,
      meta: {
        ...(extracted.meta || {}),
        ...(translated.meta || {}),
        language: outputLanguage,
      },
      headings: Array.isArray(translated.headings) ? translated.headings.filter(Boolean) : (extracted.headings || []),
      paragraphs: Array.isArray(translated.paragraphs) ? translated.paragraphs.filter(Boolean) : (extracted.paragraphs || []),
      fullText: Array.isArray(translated.paragraphs)
        ? translated.paragraphs.filter(Boolean).join('\n\n')
        : (translated.fullText || extracted.fullText || ''),
    };
  }

  const title = String(payload?.title || '').trim();
  const headings = Array.isArray(payload?.headings) ? payload.headings.map((item) => String(item || '').trim()).filter(Boolean) : [];
  const paragraphs = Array.isArray(payload?.paragraphs) ? payload.paragraphs.map((item) => String(item || '').trim()).filter(Boolean) : [];

  if (!title && !headings.length && !paragraphs.length) return null;

  return {
    ...extracted,
    meta: {
      ...(extracted.meta || {}),
      title: title || extracted.meta?.title || '',
      language: outputLanguage,
    },
    headings: headings.length ? headings : (extracted.headings || []),
    paragraphs: paragraphs.length ? paragraphs : (extracted.paragraphs || []),
    fullText: paragraphs.length ? paragraphs.join('\n\n') : (extracted.fullText || ''),
  };
}

function normalizeLang(raw) {
  if (!raw) return null;
  const base = String(raw).toLowerCase().replace('_', '-').split('-')[0];
  return base || null;
}

function normalizeEndpoint(endpoint) {
  const raw = String(endpoint || '').trim().replace(/\/+$/, '');
  return raw || null;
}
