/**
 * BiasMapper - F3.1 Comparative Coverage.
 * Fetches related articles from other sources using Brave Search API.
 * The user's API key is sent directly from the extension to Brave — no intermediary.
 */

import { detectNarrativeFrames } from './narrative-frames.js';

export async function fetchComparativeCoverage(analysisData, config) {
  if (!config?.enabled) {
    return { available: false, status: 'disabled', reason: 'Comparative coverage disabled.' };
  }

  const apiKey = String(config.apiKey || '').trim();
  if (!apiKey) {
    return { available: false, status: 'failed', reason: 'No Brave Search API key configured.' };
  }

  const query = buildSearchQuery(analysisData);
  if (!query) {
    return { available: false, status: 'failed', reason: 'Could not build search query from article.' };
  }

  const originalDomain = extractDomain(analysisData.url || '');

  try {
    const searchUrl = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=8`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      return {
        available: false,
        status: 'failed',
        reason: `Brave Search responded with ${response.status}.`,
      };
    }

    const data = await response.json();
    const rawResults = data.results || [];
    const articleLanguage = analysisData.capa_semantica?.articleLanguage || 'es';
    const originalFrameId = analysisData.marcos_narrativos?.dominant?.id || null;

    const results = rawResults
      .filter((r) => r.url && extractDomain(r.url) !== originalDomain)
      .slice(0, 5)
      .map((r) => {
        const snippetText = [r.title || '', r.description || ''].join(' ');
        const frameResult = detectNarrativeFrames([snippetText], articleLanguage);
        const frameId = frameResult?.dominant?.id || null;
        const dominant = frameResult?.dominant || null;
        return {
          url: r.url,
          source: r.meta_url?.hostname || extractDomain(r.url),
          title: r.title || '',
          snippet: r.description || '',
          frameId,
          frameIcon: dominant?.icon || '',
          frameLabel: dominant ? (dominant.label || dominant.id) : '',
          frameDiff: frameId !== null && originalFrameId !== null && frameId !== originalFrameId,
          age: r.age || '',
        };
      })
      .filter((r) => r.title);

    if (!results.length) {
      return { available: false, status: 'failed', reason: 'No comparable articles found.' };
    }

    const frameIds = results.map((r) => r.frameId).filter(Boolean);
    const uniqueFrameCount = new Set(frameIds).size;
    const frameDiversity = uniqueFrameCount >= 3 ? 'high' : uniqueFrameCount >= 2 ? 'medium' : 'low';

    return {
      available: true,
      status: 'ready',
      query,
      results,
      frameDiversity,
      hasDivergence: results.some((r) => r.frameDiff),
      originalFrameId,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      available: false,
      status: 'failed',
      reason: error?.message || 'Could not connect to Brave Search.',
    };
  }
}

function buildSearchQuery(analysisData) {
  const entities = (analysisData.entidades_detectadas || []).slice(0, 3).map((e) => e.name);
  const title = analysisData.meta?.title || '';

  if (entities.length >= 2) {
    return entities.join(' ');
  }

  const titleWords = title
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{M}'-]/gu, ''))
    .filter((w) => w.length > 4)
    .slice(0, 5);

  if (entities.length === 1) {
    return [entities[0], ...titleWords.slice(0, 3)].join(' ').trim() || null;
  }

  return titleWords.join(' ') || null;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
