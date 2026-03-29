/**
 * BiasMapper - Optional semantic AI layer with pluggable providers.
 */

export const VERSION = '0.5.0-pipeline';

const EMPTY_OVERVIEW = {
  summary: '',
  topicSummary: '',
  readerOrientation: '',
  keyPoints: [],
  mainActors: [],
  mainEvents: [],
  editorialTone: '',
  rhetoricalSignals: [],
  readingNote: '',
  omittedAngles: [],
  unsourcedClaims: [],
};

export async function isChromeAIAvailable() {
  try {
    const ai = (typeof self !== 'undefined' && self.ai) || (typeof window !== 'undefined' && window.ai);
    if (!ai?.languageModel) return false;
    const cap = await ai.languageModel.capabilities();
    return cap?.available !== 'no';
  } catch {
    return false;
  }
}

const SEMANTIC_PROVIDERS = {
  'chrome-ai': {
    validateConfig(options = {}) {
      return {
        ok: true,
        provider: 'chrome-ai',
        outputLanguage: normalizeLang(options.outputLanguage || 'en') || 'en',
        sourceLanguage: normalizeLang(options.sourceLanguage || options.articleLanguage || 'auto') || 'auto',
        model: '',
        endpoint: '',
        reason: '',
      };
    },
    async isAvailable() {
      const available = await isChromeAIAvailable();
      return {
        available,
        reason: available ? '' : 'Chrome AI not available in this browser.',
      };
    },
    async run(extracted, config) {
      const ai = (typeof self !== 'undefined' && self.ai) || (typeof window !== 'undefined' && window.ai);
      const session = await ai.languageModel.create({
        systemPrompt: 'You are a neutral reading analysis engine. Return only valid JSON.',
      });

      try {
        const response = await session.prompt(buildSemanticPrompt(extracted, config));
        return {
          response,
          repaired: await repairJsonIfNeeded(response, async (invalidText) => (
            session.prompt(buildRepairPrompt(invalidText, config.outputLanguage))
          )),
        };
      } finally {
        session.destroy();
      }
    },
    normalizeResult(raw, context) {
      const parsed = parseSemanticPayload(raw?.repaired || raw?.response);
      return buildSemanticResultFromParsed(parsed, context);
    },
    normalizeError(error, context) {
      return normalizeSemanticError(error, context);
    },
  },
  ollama: {
    validateConfig(options = {}) {
      const endpoint = normalizeEndpoint(options.endpoint);
      const model = String(options.model || '').trim();
      return {
        ok: Boolean(endpoint && model),
        provider: 'ollama',
        endpoint,
        model,
        outputLanguage: normalizeLang(options.outputLanguage || 'en') || 'en',
        sourceLanguage: normalizeLang(options.sourceLanguage || options.articleLanguage || 'auto') || 'auto',
        reason: endpoint && model ? '' : 'Missing Ollama endpoint or model.',
      };
    },
    async isAvailable(config) {
      return { available: Boolean(config.endpoint && config.model), reason: config.reason || '' };
    },
    async run(extracted, config) {
      const prompt = buildSemanticPrompt(extracted, config);
      const response = await fetch(`${config.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          stream: false,
          format: 'json',
          prompt,
          options: {
            temperature: 0.1,
            num_predict: 550,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with ${response.status}.`);
      }

      const data = await response.json();
      const firstPass = String(data?.response || '').trim();
      const repaired = await repairJsonIfNeeded(firstPass, async (invalidText) => {
        const repairResponse = await fetch(`${config.endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            stream: false,
            format: 'json',
            prompt: buildRepairPrompt(invalidText, config.outputLanguage),
            options: {
              temperature: 0,
              num_predict: 450,
            },
          }),
        });
        if (!repairResponse.ok) {
          throw new Error(`Ollama repair call responded with ${repairResponse.status}.`);
        }
        const repairData = await repairResponse.json();
        return String(repairData?.response || '').trim();
      });

      return { response: firstPass, repaired };
    },
    normalizeResult(raw, context) {
      const parsed = parseSemanticPayload(raw?.repaired || raw?.response);
      return buildSemanticResultFromParsed(parsed, context);
    },
    normalizeError(error, context) {
      return normalizeSemanticError(error, context);
    },
  },
  remote: {
    validateConfig(options = {}) {
      const endpoint = normalizeEndpoint(options.endpoint);
      return {
        ok: Boolean(endpoint),
        provider: 'remote',
        endpoint,
        model: String(options.model || '').trim(),
        outputLanguage: normalizeLang(options.outputLanguage || 'en') || 'en',
        sourceLanguage: normalizeLang(options.sourceLanguage || options.articleLanguage || 'auto') || 'auto',
        reason: endpoint ? '' : 'Missing remote semantic endpoint.',
      };
    },
    async isAvailable(config) {
      return { available: Boolean(config.endpoint), reason: config.reason || '' };
    },
    async run(extracted, config) {
      const response = await fetch(`${config.endpoint}/semantic-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_language: config.sourceLanguage,
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
        throw new Error(`Remote semantic service responded with ${response.status}.`);
      }

      return await response.json();
    },
    normalizeResult(raw, context) {
      const parsed = raw?.semanticOverview || raw?.semantic_overview || raw || {};
      const semanticOverview = normalizeSemanticOverview(parsed, context.config);
      return buildSemanticResult(context, {
        available: classifySemanticCoverage(semanticOverview) !== 'none',
        executed: true,
        status: raw?.status || inferSemanticStatus(semanticOverview),
        coverage: raw?.coverage || classifySemanticCoverage(semanticOverview),
        semanticOverview,
      });
    },
    normalizeError(error, context) {
      return normalizeSemanticError(error, context);
    },
  },
};

export function getSemanticProvider(provider = 'ollama') {
  return SEMANTIC_PROVIDERS[provider] || null;
}

export function listSemanticProviders() {
  return Object.keys(SEMANTIC_PROVIDERS);
}

export async function aiAnalyze(extracted, options = {}) {
  if (!options?.enabled) {
    return buildSemanticResult({ providerName: null, config: {} }, {
      available: false,
      executed: false,
      status: 'disabled',
      coverage: 'none',
      reason: 'Semantic layer disabled.',
      actionable: 'Enable semantic analysis and configure a provider.',
    });
  }

  let providerName = options.provider || 'auto';
  if (providerName === 'auto') {
    const hasRemote = Boolean(String(options.endpoint || '').trim());
    const chromeAvailable = await isChromeAIAvailable().catch(() => false);
    const hasOllama = Boolean(String(options.endpoint || '').trim() && String(options.model || '').trim());
    providerName = hasRemote ? 'remote' : chromeAvailable ? 'chrome-ai' : hasOllama ? 'ollama' : 'auto';
  }
  if (providerName === 'auto') {
    return buildSemanticResult({ providerName: null, config: {} }, {
      available: false,
      executed: false,
      status: 'failed',
      coverage: 'none',
      reason: 'No automatic semantic provider is ready on this device.',
      actionable: 'Use Chrome AI when available, or configure Ollama or a remote API.',
    });
  }
  const provider = getSemanticProvider(providerName);
  if (!provider) {
    return buildSemanticResult({ providerName, config: {} }, {
      available: false,
      executed: false,
      status: 'failed',
      coverage: 'none',
      reason: `Unsupported provider: ${providerName}`,
      actionable: 'Choose a supported semantic provider.',
    });
  }

  const config = provider.validateConfig(options);
  const context = { providerName, config, options, extracted };

  if (!config.ok) {
    return buildSemanticResult(context, {
      available: false,
      executed: false,
      status: 'failed',
      coverage: 'none',
      reason: config.reason || 'Invalid semantic configuration.',
      actionable: suggestSemanticAction(providerName),
    });
  }

  try {
    const availability = await provider.isAvailable(config, extracted);
    if (availability?.available === false) {
      return buildSemanticResult(context, {
        available: false,
        executed: false,
        status: 'failed',
        coverage: 'none',
        reason: availability.reason || 'Semantic provider not available.',
        actionable: suggestSemanticAction(providerName),
      });
    }

    const rawResult = await provider.run(extracted, config);
    return provider.normalizeResult(rawResult, context);
  } catch (error) {
    return provider.normalizeError(error, context);
  }
}

function buildSemanticResultFromParsed(parsed, context) {
  if (!parsed) {
    return normalizeSemanticError(new Error('Could not parse semantic AI response.'), context);
  }

  const semanticOverview = normalizeSemanticOverview(parsed, context.config);
  return buildSemanticResult(context, {
    available: classifySemanticCoverage(semanticOverview) !== 'none',
    executed: true,
    status: inferSemanticStatus(semanticOverview),
    coverage: classifySemanticCoverage(semanticOverview),
    semanticOverview,
  });
}

function buildSemanticResult(context, overrides = {}) {
  const config = context?.config || {};
  return {
    available: Boolean(overrides.available),
    executed: overrides.executed ?? Boolean(overrides.available),
    status: overrides.status || 'failed',
    coverage: overrides.coverage || 'none',
    provider: overrides.provider || context?.providerName || null,
    model: config.model || null,
    endpoint: config.endpoint || null,
    sourceLanguage: config.sourceLanguage || null,
    outputLanguage: config.outputLanguage || null,
    semanticOverview: overrides.semanticOverview || EMPTY_OVERVIEW,
    reason: overrides.reason || '',
    actionable: overrides.actionable || '',
    diagnostics: {
      provider: context?.providerName || null,
      endpoint: config.endpoint || null,
      model: config.model || null,
    },
  };
}

function normalizeSemanticError(error, context) {
  return buildSemanticResult(context, {
    available: false,
    executed: true,
    status: 'failed',
    coverage: 'none',
    reason: error?.message || 'Semantic analysis failed.',
    actionable: suggestSemanticAction(context?.providerName),
  });
}

function suggestSemanticAction(providerName) {
  if (providerName === 'ollama') {
    return 'Verify the Ollama endpoint, selected model and that the model supports multilingual JSON output.';
  }
  if (providerName === 'chrome-ai') {
    return 'Verify Chrome AI availability on this device and that Gemini Nano is enabled.';
  }
  if (providerName === 'remote') {
    return 'Verify the remote endpoint and its /semantic-summary contract.';
  }
  return 'Review the semantic provider configuration.';
}

function buildSemanticPrompt(extracted, config) {
  const title = String(extracted.meta?.title || '').trim();
  const author = String(extracted.meta?.author || '').trim();
  const date = String(extracted.meta?.date || '').trim();
  const body = buildExcerpt(extracted.paragraphs || []);

  return [
    'You are BiasMapper, a reading-orientation engine.',
    'Describe article construction and narrative shape, not ideology and not fact-checking.',
    'Return JSON only. No markdown. No prose outside JSON.',
    'Use this exact schema:',
    '{',
    '  "summary": string,',
    '  "topic_summary": string,',
    '  "reader_orientation": string,',
    '  "key_points": string[],',
    '  "main_actors": string[],',
    '  "main_events": string[],',
    '  "editorial_tone": string,',
    '  "rhetorical_signals": string[],',
    '  "reading_note": string,',
    '  "omitted_angles": string[],',
    '  "unsourced_claims": string[]',
    '}',
    `Write every field in ${config.outputLanguage}.`,
    `Source article language: ${config.sourceLanguage}.`,
    'Constraints:',
    '- summary: max 40 words.',
    '- topic_summary: one short sentence about the subject.',
    '- reader_orientation: one sentence on how to approach the piece as a reader.',
    '- key_points: 3 to 5 short bullets.',
    '- main_actors: up to 5 short names or actor groups.',
    '- main_events: up to 5 short event phrases.',
    '- editorial_tone: one compact label or short phrase.',
    '- rhetorical_signals: 0 to 4 stylistic observations.',
    '- reading_note: one practical reading tip.',
    '- omitted_angles: 0 to 4 absent perspectives or missing context angles.',
    '- unsourced_claims: 0 to 4 claims that appear without clear attribution in the article text.',
    'Do not invent facts outside the article. If unsure, prefer empty arrays.',
    '',
    'ARTICLE METADATA',
    `Title: ${title}`,
    `Author: ${author}`,
    `Date: ${date}`,
    '',
    'ARTICLE BODY',
    body,
  ].join('\n');
}

function buildRepairPrompt(invalidText, outputLanguage) {
  return [
    'Repair the following model output into valid JSON only.',
    'Keep the same meaning when possible.',
    'Use this exact schema and no extra keys:',
    '{',
    '  "summary": string,',
    '  "topic_summary": string,',
    '  "reader_orientation": string,',
    '  "key_points": string[],',
    '  "main_actors": string[],',
    '  "main_events": string[],',
    '  "editorial_tone": string,',
    '  "rhetorical_signals": string[],',
    '  "reading_note": string,',
    '  "omitted_angles": string[],',
    '  "unsourced_claims": string[]',
    '}',
    `All strings must stay in ${outputLanguage}.`,
    'Malformed output:',
    invalidText,
  ].join('\n');
}

async function repairJsonIfNeeded(text, repairFn) {
  if (parseSemanticPayload(text)) return text;
  return await repairFn(text);
}

function parseSemanticPayload(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeSemanticOverview(payload, config = {}) {
  return {
    summary: String(payload.summary || '').trim(),
    topicSummary: String(payload.topicSummary || payload.topic_summary || '').trim(),
    readerOrientation: String(payload.readerOrientation || payload.reader_orientation || '').trim(),
    keyPoints: sanitizeList(payload.keyPoints || payload.key_points, 5),
    mainActors: sanitizeList(payload.mainActors || payload.main_actors, 5),
    mainEvents: sanitizeList(payload.mainEvents || payload.main_events, 5),
    editorialTone: String(payload.editorialTone || payload.editorial_tone || '').trim(),
    rhetoricalSignals: sanitizeList(payload.rhetoricalSignals || payload.rhetorical_signals, 4),
    readingNote: String(payload.readingNote || payload.reading_note || '').trim(),
    omittedAngles: sanitizeList(payload.omittedAngles || payload.omitted_angles, 4),
    unsourcedClaims: sanitizeList(payload.unsourcedClaims || payload.unsourced_claims, 4),
    sourceLanguage: config.sourceLanguage || 'auto',
    outputLanguage: config.outputLanguage || 'en',
  };
}

function inferSemanticStatus(semanticOverview) {
  const coverage = classifySemanticCoverage(semanticOverview);
  if (coverage === 'high') return 'ready';
  if (coverage === 'medium') return 'partial';
  return 'failed';
}

function classifySemanticCoverage(semanticOverview) {
  let score = 0;
  if (semanticOverview.summary) score += 2;
  if (semanticOverview.topicSummary) score += 2;
  if (semanticOverview.readerOrientation) score += 2;
  score += Math.min(2, semanticOverview.keyPoints.length);
  score += Math.min(2, semanticOverview.mainActors.length);
  score += Math.min(2, semanticOverview.mainEvents.length);
  score += Math.min(1, semanticOverview.rhetoricalSignals.length);
  score += Math.min(1, semanticOverview.omittedAngles.length + semanticOverview.unsourcedClaims.length);

  if (score >= 9) return 'high';
  if (score >= 5) return 'medium';
  return 'none';
}

function buildExcerpt(paragraphs) {
  return paragraphs
    .slice(0, 12)
    .map((paragraph, index) => `[P${index + 1}] ${String(paragraph || '').trim()}`)
    .join('\n\n')
    .slice(0, 14000);
}

function sanitizeList(value, maxItems) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems);
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
