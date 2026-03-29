/**
 * BiasMapper — Service Worker (Manifest V3)
 * Handles: side panel activation, per-URL analysis cache.
 */

// Open side panel when user clicks the action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(err => console.warn('[BiasMapper SW] setPanelBehavior:', err));

// In-memory cache: url → analysisData
// Cleared on service worker restart. Use chrome.storage.session for persistence.
const cache = new Map();
const CACHE_MAX = 20;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {

    case 'CACHE_GET':
      sendResponse({ data: cache.get(msg.url) ?? null });
      return false;

    case 'CACHE_SET':
      cache.set(msg.url, msg.data);
      if (cache.size > CACHE_MAX) {
        cache.delete(cache.keys().next().value);
      }
      sendResponse({ ok: true });
      return false;

    default:
      return false;
  }
});
