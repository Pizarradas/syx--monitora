/**
 * BiasMapper — Reading history.
 * Stores lightweight analysis snapshots in chrome.storage.local.
 * Max 200 entries, rolling. No external network calls.
 */

const STORAGE_KEY = 'bm_reading_history';
const MAX_ENTRIES = 200;

/**
 * Save or update an entry for the current URL.
 * If the same URL was already saved today, it is overwritten.
 *
 * @param {object} entry
 * @param {string} entry.url
 * @param {string} entry.title
 * @param {string} entry.domain
 * @param {string} entry.language       - article language code
 * @param {string} entry.outputLocale   - output locale selected by user
 * @param {number} entry.wordCount
 * @param {number} entry.readingTimeMin
 * @param {string} entry.tone           - 'positive' | 'neutral' | 'charged'
 * @param {string} entry.structureKind  - 'brief' | 'standard' | 'deep'
 * @param {number|null} entry.trustScore
 * @param {string|null} entry.trustTier
 * @param {number|null} entry.clickbaitScore
 * @param {string|null} entry.clickbaitLevel
 * @param {string} entry.evidenceLevel  - 'rich' | 'mixed' | 'light'
 */
export async function saveEntry(entry) {
  const history = await getHistory();
  const today = new Date().toISOString().slice(0, 10);
  const existingIdx = history.findIndex(
    (e) => e.url === entry.url && e.date.startsWith(today)
  );

  const record = { id: existingIdx >= 0 ? history[existingIdx].id : Date.now(), date: new Date().toISOString(), ...entry };

  if (existingIdx >= 0) {
    history[existingIdx] = record;
  } else {
    history.unshift(record);
  }

  const trimmed = history.slice(0, MAX_ENTRIES);
  await chrome.storage.local.set({ [STORAGE_KEY]: trimmed });
  return record;
}

/**
 * Returns the full history array, newest first.
 * @returns {Promise<object[]>}
 */
export async function getHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? [];
}

/**
 * Returns a stats summary of the reading history.
 * @returns {Promise<object>}
 */
export async function getStats() {
  const history = await getHistory();
  if (!history.length) return null;

  const domainCounts = {};
  const toneCounts = { positive: 0, neutral: 0, charged: 0 };
  let totalTrust = 0;
  let trustCount = 0;
  let totalClickbait = 0;
  let clickbaitCount = 0;
  const langCounts = {};

  history.forEach((e) => {
    if (e.domain) domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
    if (e.tone && toneCounts[e.tone] !== undefined) toneCounts[e.tone]++;
    if (e.trustScore !== null && e.trustScore !== undefined) { totalTrust += e.trustScore; trustCount++; }
    if (e.clickbaitScore !== null && e.clickbaitScore !== undefined) { totalClickbait += e.clickbaitScore; clickbaitCount++; }
    if (e.language) langCounts[e.language] = (langCounts[e.language] || 0) + 1;
  });

  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));

  return {
    total: history.length,
    avgTrust: trustCount > 0 ? Math.round(totalTrust / trustCount) : null,
    avgClickbait: clickbaitCount > 0 ? Math.round(totalClickbait / clickbaitCount) : null,
    toneCounts,
    topDomains,
    langCounts,
  };
}

/**
 * Removes all saved history.
 */
export async function clearHistory() {
  await chrome.storage.local.remove(STORAGE_KEY);
}
