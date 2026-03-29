import { isChromeAIAvailable } from './ai-analyzer.js';

function normalizeEndpoint(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeTranslationConfig(config = {}) {
  return {
    enabled: Boolean(config.enabled),
    provider: String(config.provider || '').trim(),
    endpoint: normalizeEndpoint(config.endpoint),
  };
}

function normalizeSemanticConfig(config = {}) {
  return {
    enabled: Boolean(config.enabled),
    provider: String(config.provider || '').trim(),
    endpoint: normalizeEndpoint(config.endpoint),
    model: String(config.model || '').trim(),
  };
}

export async function resolveSemanticCapability(config = {}) {
  const normalized = normalizeSemanticConfig(config);
  const chromeAvailable = await isChromeAIAvailable().catch(() => false);
  const remoteReady = Boolean(normalized.endpoint);

  return {
    current: normalized.provider || null,
    stable: [
      remoteReady ? { provider: 'remote', label: 'Remote semantic service', source: 'managed', ready: true } : null,
      chromeAvailable ? { provider: 'chrome-ai', label: 'Chrome AI', source: 'browser', ready: true } : null,
    ].filter(Boolean),
    experimental: [
      { provider: 'ollama', label: 'Ollama', source: 'local', ready: Boolean(normalized.provider === 'ollama' && normalized.endpoint && normalized.model) },
    ],
    recommended: remoteReady ? 'remote' : chromeAvailable ? 'chrome-ai' : null,
    remoteReady,
    chromeAvailable,
  };
}

export function resolveTranslationCapability(config = {}) {
  const normalized = normalizeTranslationConfig(config);
  const remoteReady = Boolean(normalized.endpoint);

  return {
    current: normalized.provider || null,
    stable: [
      remoteReady ? { provider: 'remote', label: 'Remote translation service', source: 'managed', ready: true } : null,
    ].filter(Boolean),
    experimental: [
      { provider: 'libretranslate', label: 'LibreTranslate', source: 'local', ready: Boolean(normalized.provider === 'libretranslate' && normalized.endpoint) },
    ],
    recommended: remoteReady ? 'remote' : null,
    remoteReady,
  };
}

