/**
 * BiasMapper — Content Script
 * Runs in the page context. Self-contained IIFE — no ES module imports.
 * Listens for EXTRACT messages and returns structured article content.
 */

(function () {
  'use strict';

  // Guard against multiple injections
  if (window.__biasmapper_injected__) return;
  window.__biasmapper_injected__ = true;

  // ── Noise selectors removed before extraction ──────────────────────────────
  const NOISE = [
    'script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'iframe',
    '[class*="ad-"]', '[class*="-ad"]', '[id*="-ad"]',
    '[class*="advertisement"]', '[class*="sponsor"]',
    '[class*="comment"]', '[id*="comment"]',
    '[class*="sidebar"]', '[class*="related"]',
    '[class*="share"]', '[class*="social"]',
    '[class*="newsletter"]', '[class*="popup"]', '[class*="modal"]',
  ];

  // ── Article container candidates (most-specific first) ────────────────────
  const ARTICLE_CANDIDATES = [
    'article[class]', 'article',
    '[role="article"]', '[role="main"] article',
    '[class*="article"]', '[class*="story"]', '[class*="entry"]',
    '[class*="article-body"]', '[class*="article-content"]',
    '[class*="post-content"]', '[class*="post-body"]',
    '[class*="entry-content"]', '[class*="story-body"]',
    '[class*="content-body"]', '[class*="main-content"]',
    '[class*="article-main"]', '[itemprop="articleBody"]',
    'main', '[role="main"]',
  ];

  const HOST_CANDIDATES = {
    'asahi.com': [
      'article',
      'main article',
      '[role="main"]',
      'main',
      '[class*="Article"]',
      '[class*="Body"]',
      '[class*="Text"]',
      '[class*="content"]',
    ],
    'toyokeizai.net': [
      'article',
      'main article',
      '[role="main"] article',
      '[class*="article"]',
      '[class*="Article"]',
      '[class*="body"]',
      '[class*="Body"]',
      '[class*="detail"]',
      '[class*="Detail"]',
      '[class*="content"]',
      '[class*="Content"]',
      'main',
    ],
  };

  const BLOCK_SELECTOR = 'p, div, li';
  const BLOCKISH_CHILDREN = 'p, div, section, article, aside, nav, ul, ol, header, footer';

  function scoreContainer(el) {
    if (!el) return -1;

    const paragraphs = collectParagraphs(el);

    if (paragraphs.length === 0) return -1;

    const headingCount = el.querySelectorAll('h1, h2, h3').length;
    const quoteCount = el.querySelectorAll('blockquote').length;
    const textLength = paragraphs.reduce((total, text) => total + text.length, 0);
    const articleBonus = el.matches('article, [role="article"], [itemprop="articleBody"]') ? 80 : 0;

    return textLength + (paragraphs.length * 35) + (headingCount * 25) + (quoteCount * 20) + articleBonus;
  }

  function findContainer() {
    const seen = new Set();
    const candidates = [];
    const host = location.hostname.replace(/^www\./, '');

    ARTICLE_CANDIDATES.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          candidates.push(el);
        }
      });
    });

    (HOST_CANDIDATES[host] || []).forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          candidates.push(el);
        }
      });
    });

    collectAnchorCandidates().forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        candidates.push(el);
      }
    });

    let best = document.body;
    let bestScore = scoreContainer(document.body);

    candidates.forEach((candidate) => {
      const score = scoreContainer(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    });

    return best;
  }

  function collectAnchorCandidates() {
    const anchors = [];
    const title = document.querySelector('h1');
    const time = document.querySelector('time');
    const seeds = [title, time].filter(Boolean);

    seeds.forEach((seed) => {
      let node = seed;
      let depth = 0;
      while (node && depth < 6) {
        anchors.push(node);
        node = node.parentElement;
        depth += 1;
      }
    });

    return anchors;
  }

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function isLikelyReadableBlock(el) {
    if (!el) return false;
    if (el.closest('header, footer, nav, aside')) return false;
    const text = normalizeText(el.textContent);
    if (text.length < 60) return false;
    if (el.querySelector(BLOCKISH_CHILDREN)) return false;
    const linkTextLength = Array.from(el.querySelectorAll('a')).reduce((sum, link) => sum + normalizeText(link.textContent).length, 0);
    if (linkTextLength > text.length * 0.6) return false;
    return /[.!?:;,\u3002\uff01\uff1f]/u.test(text) || text.length > 120;
  }

  function uniqueTexts(items) {
    const seen = new Set();
    return items.filter((text) => {
      const key = normalizeText(text);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function collectParagraphs(root) {
    const fromParagraphs = Array.from(root.querySelectorAll('p'))
      .map((p) => normalizeText(p.textContent))
      .filter((text) => text.length > 30);

    if (fromParagraphs.length >= 3) return uniqueTexts(fromParagraphs);

    const fallbackBlocks = Array.from(root.querySelectorAll(BLOCK_SELECTOR))
      .filter(isLikelyReadableBlock)
      .map((el) => normalizeText(el.textContent))
      .filter((text) => text.length > 60);

    if (fallbackBlocks.length >= 3) return uniqueTexts([...fromParagraphs, ...fallbackBlocks]);

    const anchorBlocks = collectAnchorBlockTexts()
      .concat(collectTitleDescendantTexts())
      .filter((text) => text.length > 60);

    const merged = uniqueTexts([...fromParagraphs, ...fallbackBlocks, ...anchorBlocks]);
    return merged;
  }

  function collectAnchorBlockTexts() {
    const results = [];
    const title = document.querySelector('h1');
    if (!title) return results;

    const seeds = [title, title.parentElement, title.parentElement?.parentElement].filter(Boolean);

    seeds.forEach((seed) => {
      let sibling = seed.nextElementSibling;
      let scanned = 0;

      while (sibling && scanned < 16) {
        scanned += 1;
        if (!sibling.matches?.('script, style, aside, nav, header, footer')) {
          Array.from(sibling.querySelectorAll?.(BLOCK_SELECTOR) || [])
            .filter(isLikelyReadableBlock)
            .forEach((el) => results.push(normalizeText(el.textContent)));

          if (isLikelyReadableBlock(sibling)) {
            results.push(normalizeText(sibling.textContent));
          }
        }
        sibling = sibling.nextElementSibling;
      }
    });

    return uniqueTexts(results);
  }

  function collectTitleDescendantTexts() {
    const title = document.querySelector('h1');
    if (!title) return [];

    const container = title.closest('article, main, section, div');
    if (!container) return [];

    return uniqueTexts(
      Array.from(container.querySelectorAll(BLOCK_SELECTOR))
        .filter((el) => !title.contains(el) && isLikelyReadableBlock(el))
        .map((el) => normalizeText(el.textContent))
        .filter((text) => text.length > 60)
    );
  }

  function extractMeta() {
    const docLang =
      document.documentElement.getAttribute('lang') ||
      document.documentElement.lang ||
      document.querySelector('meta[property="og:locale"]')?.content ||
      document.querySelector('meta[http-equiv="content-language"]')?.content ||
      null;

    const title =
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title;

    const author =
      document.querySelector('[rel="author"]')?.textContent?.trim() ||
      document.querySelector('[itemprop="author"]')?.textContent?.trim() ||
      document.querySelector('.author-name, .byline__name, .byline, .author')?.textContent?.trim() ||
      document.querySelector('meta[name="author"]')?.content ||
      null;

    const date =
      document.querySelector('time[datetime]')?.getAttribute('datetime') ||
      document.querySelector('time')?.textContent?.trim() ||
      document.querySelector('meta[property="article:published_time"]')?.content ||
      null;

    const description =
      document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="description"]')?.content ||
      null;

    return {
      title: title?.trim() || null,
      author: author?.trim() || null,
      date: date?.trim() || null,
      language: docLang?.trim() || null,
      description: description?.trim() || null,
    };
  }

  function collectDocumentFallbackTexts(root, meta) {
    const readableBlocks = uniqueTexts(
      Array.from(root.querySelectorAll(BLOCK_SELECTOR))
        .filter(isLikelyReadableBlock)
        .map((el) => normalizeText(el.textContent))
        .filter((text) => text.length > 60)
    ).slice(0, 12);

    if (readableBlocks.length > 0) return readableBlocks;

    return uniqueTexts([
      normalizeText(meta?.description),
      normalizeText(meta?.title),
    ]).filter((text) => text.length > 20);
  }

  function extractContent() {
    const container = findContainer();
    const clone = container.cloneNode(true);

    NOISE.forEach(sel => {
      try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch (_) {}
    });

    const meta = extractMeta();
    const paragraphs = collectParagraphs(clone);

    const headings = Array.from(clone.querySelectorAll('h2, h3'))
      .map(h => h.textContent.replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 8 && t.length < 140);

    const quotes = Array.from(clone.querySelectorAll('blockquote'))
      .map(q => q.textContent.replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 0);

    const links = Array.from(clone.querySelectorAll('a[href]'))
      .map(a => ({ text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.href }))
      .filter(l => l.text.length > 0 && /^https?:\/\//.test(l.href));

    const finalParagraphs = paragraphs.length > 0
      ? paragraphs
      : collectDocumentFallbackTexts(clone, meta);

    if (finalParagraphs.length === 0) {
      return { error: 'No se encontró contenido de artículo legible en esta página.' };
    }

    return {
      url: location.href,
      meta,
      paragraphs: finalParagraphs,
      headings,
      quotes,
      links,
      fullText: finalParagraphs.join(' '),
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type !== 'EXTRACT') return false;
    try {
      const data = extractContent();
      sendResponse({ ok: !data.error, data, error: data.error || null });
    } catch (err) {
      sendResponse({ ok: false, data: null, error: err.message });
    }
    return true; // keep message channel open for async sendResponse
  });
})();
