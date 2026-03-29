/**
 * BiasMapper - Domain reputation bundle.
 * Curated, offline, deterministic. No data leaves the browser.
 *
 * type:      'wire' | 'public-broadcaster' | 'newspaper' | 'digital-native' | 'tabloid' | 'partisan' | 'broadcast'
 * factCheck: 'high' | 'medium' | 'low'
 * region:    ISO 3166-1 alpha-2
 * trustScore: 0–100
 */

export const VERSION = '1.0.0';

const DB = {
  // ── Wire services ──────────────────────────────────────────────────────────
  'reuters.com':          { type: 'wire',             factCheck: 'high',   region: 'gb', trustScore: 95 },
  'apnews.com':           { type: 'wire',             factCheck: 'high',   region: 'us', trustScore: 95 },
  'afp.com':              { type: 'wire',             factCheck: 'high',   region: 'fr', trustScore: 93 },

  // ── Public broadcasters ────────────────────────────────────────────────────
  'bbc.com':              { type: 'public-broadcaster', factCheck: 'high', region: 'gb', trustScore: 90 },
  'bbc.co.uk':            { type: 'public-broadcaster', factCheck: 'high', region: 'gb', trustScore: 90 },
  'nhk.or.jp':            { type: 'public-broadcaster', factCheck: 'high', region: 'jp', trustScore: 90 },
  'nhk.jp':               { type: 'public-broadcaster', factCheck: 'high', region: 'jp', trustScore: 89 },
  'dw.com':               { type: 'public-broadcaster', factCheck: 'high', region: 'de', trustScore: 88 },
  'rfi.fr':               { type: 'public-broadcaster', factCheck: 'high', region: 'fr', trustScore: 87 },
  'abc.net.au':           { type: 'public-broadcaster', factCheck: 'high', region: 'au', trustScore: 88 },
  'cbc.ca':               { type: 'public-broadcaster', factCheck: 'high', region: 'ca', trustScore: 88 },
  'ard.de':               { type: 'public-broadcaster', factCheck: 'high', region: 'de', trustScore: 88 },
  'zdf.de':               { type: 'public-broadcaster', factCheck: 'high', region: 'de', trustScore: 87 },
  'rne.es':               { type: 'public-broadcaster', factCheck: 'high', region: 'es', trustScore: 82 },
  'rtve.es':              { type: 'public-broadcaster', factCheck: 'high', region: 'es', trustScore: 82 },
  'yle.fi':               { type: 'public-broadcaster', factCheck: 'high', region: 'fi', trustScore: 88 },
  'svt.se':               { type: 'public-broadcaster', factCheck: 'high', region: 'se', trustScore: 88 },
  'nrk.no':               { type: 'public-broadcaster', factCheck: 'high', region: 'no', trustScore: 88 },
  'dr.dk':                { type: 'public-broadcaster', factCheck: 'high', region: 'dk', trustScore: 87 },
  'abc.go.com':           { type: 'broadcast',          factCheck: 'high', region: 'us', trustScore: 80 },

  // ── Major international newspapers ────────────────────────────────────────
  'nytimes.com':          { type: 'newspaper', factCheck: 'high',   region: 'us', trustScore: 88 },
  'washingtonpost.com':   { type: 'newspaper', factCheck: 'high',   region: 'us', trustScore: 87 },
  'wsj.com':              { type: 'newspaper', factCheck: 'high',   region: 'us', trustScore: 85 },
  'theguardian.com':      { type: 'newspaper', factCheck: 'high',   region: 'gb', trustScore: 85 },
  'ft.com':               { type: 'newspaper', factCheck: 'high',   region: 'gb', trustScore: 88 },
  'economist.com':        { type: 'newspaper', factCheck: 'high',   region: 'gb', trustScore: 88 },
  'independent.co.uk':    { type: 'newspaper', factCheck: 'medium', region: 'gb', trustScore: 72 },

  // FR
  'lemonde.fr':           { type: 'newspaper', factCheck: 'high',   region: 'fr', trustScore: 87 },
  'lefigaro.fr':          { type: 'newspaper', factCheck: 'medium', region: 'fr', trustScore: 78 },
  'liberation.fr':        { type: 'newspaper', factCheck: 'medium', region: 'fr', trustScore: 78 },
  'lepoint.fr':           { type: 'newspaper', factCheck: 'medium', region: 'fr', trustScore: 74 },
  'leparisien.fr':        { type: 'newspaper', factCheck: 'medium', region: 'fr', trustScore: 70 },

  // DE
  'faz.net':              { type: 'newspaper', factCheck: 'high',   region: 'de', trustScore: 86 },
  'sueddeutsche.de':      { type: 'newspaper', factCheck: 'high',   region: 'de', trustScore: 85 },
  'spiegel.de':           { type: 'newspaper', factCheck: 'high',   region: 'de', trustScore: 85 },
  'zeit.de':              { type: 'newspaper', factCheck: 'high',   region: 'de', trustScore: 86 },
  'tagesspiegel.de':      { type: 'newspaper', factCheck: 'high',   region: 'de', trustScore: 83 },
  'bild.de':              { type: 'tabloid',   factCheck: 'low',    region: 'de', trustScore: 42 },

  // ES
  'elpais.com':           { type: 'newspaper',      factCheck: 'high',   region: 'es', trustScore: 84 },
  'elmundo.es':           { type: 'newspaper',      factCheck: 'medium', region: 'es', trustScore: 74 },
  'abc.es':               { type: 'newspaper',      factCheck: 'medium', region: 'es', trustScore: 72 },
  'eldiario.es':          { type: 'digital-native', factCheck: 'medium', region: 'es', trustScore: 74 },
  'elconfidencial.com':   { type: 'digital-native', factCheck: 'medium', region: 'es', trustScore: 70 },
  'lavanguardia.com':     { type: 'newspaper',      factCheck: 'medium', region: 'es', trustScore: 74 },
  'elperiodico.com':      { type: 'newspaper',      factCheck: 'medium', region: 'es', trustScore: 72 },

  // IT
  'corriere.it':          { type: 'newspaper', factCheck: 'high',   region: 'it', trustScore: 84 },
  'repubblica.it':        { type: 'newspaper', factCheck: 'high',   region: 'it', trustScore: 83 },
  'ilsole24ore.com':      { type: 'newspaper', factCheck: 'high',   region: 'it', trustScore: 85 },
  'lastampa.it':          { type: 'newspaper', factCheck: 'medium', region: 'it', trustScore: 78 },

  // PT
  'publico.pt':           { type: 'newspaper',      factCheck: 'medium', region: 'pt', trustScore: 76 },
  'observador.pt':        { type: 'digital-native', factCheck: 'medium', region: 'pt', trustScore: 74 },
  'expresso.pt':          { type: 'newspaper',      factCheck: 'high',   region: 'pt', trustScore: 80 },

  // JP
  'asahi.com':            { type: 'newspaper',      factCheck: 'high',   region: 'jp', trustScore: 88 },
  'mainichi.jp':          { type: 'newspaper',      factCheck: 'high',   region: 'jp', trustScore: 87 },
  'yomiuri.co.jp':        { type: 'newspaper',      factCheck: 'medium', region: 'jp', trustScore: 80 },
  'nikkei.com':           { type: 'newspaper',      factCheck: 'high',   region: 'jp', trustScore: 85 },
  'toyokeizai.net':       { type: 'digital-native', factCheck: 'medium', region: 'jp', trustScore: 76 },

  // US digital-native
  'propublica.org':       { type: 'digital-native', factCheck: 'high',   region: 'us', trustScore: 90 },
  'axios.com':            { type: 'digital-native', factCheck: 'high',   region: 'us', trustScore: 82 },
  'theatlantic.com':      { type: 'digital-native', factCheck: 'high',   region: 'us', trustScore: 84 },
  'politico.com':         { type: 'digital-native', factCheck: 'high',   region: 'us', trustScore: 82 },
  'vox.com':              { type: 'digital-native', factCheck: 'medium', region: 'us', trustScore: 74 },
  'buzzfeednews.com':     { type: 'digital-native', factCheck: 'medium', region: 'us', trustScore: 70 },
  'motherjones.com':      { type: 'digital-native', factCheck: 'medium', region: 'us', trustScore: 72 },

  // US broadcast
  'cnn.com':              { type: 'broadcast', factCheck: 'medium', region: 'us', trustScore: 72 },
  'nbcnews.com':          { type: 'broadcast', factCheck: 'high',   region: 'us', trustScore: 80 },
  'cbsnews.com':          { type: 'broadcast', factCheck: 'high',   region: 'us', trustScore: 80 },
  'abcnews.go.com':       { type: 'broadcast', factCheck: 'high',   region: 'us', trustScore: 80 },
  'msnbc.com':            { type: 'broadcast', factCheck: 'medium', region: 'us', trustScore: 68 },

  // ── Low-trust / tabloid / partisan ────────────────────────────────────────
  'foxnews.com':          { type: 'partisan', factCheck: 'low',  region: 'us', trustScore: 38 },
  'nypost.com':           { type: 'tabloid',  factCheck: 'low',  region: 'us', trustScore: 45 },
  'dailymail.co.uk':      { type: 'tabloid',  factCheck: 'low',  region: 'gb', trustScore: 38 },
  'thesun.co.uk':         { type: 'tabloid',  factCheck: 'low',  region: 'gb', trustScore: 32 },
  'breitbart.com':        { type: 'partisan', factCheck: 'low',  region: 'us', trustScore: 22 },
  'infowars.com':         { type: 'partisan', factCheck: 'low',  region: 'us', trustScore: 10 },
  'larazon.es':           { type: 'partisan', factCheck: 'low',  region: 'es', trustScore: 44 },
};

/**
 * Returns reputation data for the given hostname, or null if unknown.
 */
export function getDomainReputation(hostname) {
  const clean = String(hostname || '').toLowerCase().replace(/^www\./, '');
  const record = DB[clean];
  if (!record) return null;
  return { domain: clean, ...record };
}

/**
 * Maps a trust score (0–100) to a tier label.
 */
export function classifyTrustTier(score) {
  if (score >= 82) return 'high';
  if (score >= 62) return 'medium';
  if (score >= 40) return 'low';
  return 'very-low';
}
