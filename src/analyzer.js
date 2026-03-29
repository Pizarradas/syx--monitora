/**
 * BiasMapper - Local analysis engine.
 */

import { analyzeSentiment } from './sentiment.js';
import { getDomainReputation } from './domain-reputation.js';
import { classifySourceAnatomy } from './source-anatomy.js';
import { detectNarrativeFrames } from './narrative-frames.js';
import { detectPerspectiveMap } from './perspective-map.js';

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'a', 'al',
  'y', 'e', 'o', 'u', 'que', 'es', 'se', 'no', 'con', 'por', 'para', 'su', 'sus', 'lo',
  'le', 'les', 'mas', 'pero', 'si', 'me', 'te', 'he', 'ha', 'han', 'hay', 'ser', 'estar',
  'fue', 'son', 'era', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'ellos', 'ellas', 'mi', 'tu', 'como', 'ya',
  'cuando', 'donde', 'quien', 'cual', 'cuales', 'todo', 'toda', 'todos', 'todas',
  'tambien', 'bien', 'muy', 'asi', 'aqui', 'ahi', 'alli', 'entre', 'sobre', 'bajo',
  'ante', 'tras', 'sin', 'desde', 'hasta', 'hacia', 'segun', 'durante', 'mediante',
  'the', 'a', 'an', 'and', 'of', 'to', 'in', 'is', 'it', 'for', 'on', 'are', 'as', 'at',
  'be', 'this', 'that', 'with', 'by', 'from', 'or', 'but', 'not', 'was', 'were', 'have',
  'has', 'had', 'its', 'they', 'their', 'than', 'been', 'he', 'she', 'we', 'you', 'i',
  'do', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall',
  'his', 'her', 'our', 'your', 'which', 'who', 'what', 'when', 'where', 'how', 'if',
  'about', 'after', 'before', 'between', 'into', 'through', 'during', 'while',
  'although', 'because', 'since', 'though', 'unless', 'until', 'whether',
]);

const ADJ_PATTERN = /[oa]s?$|ble$|ivo[as]?$|ado[as]?$|ido[as]?$|al$|oso[as]?$|ous$|ive$|ful$|less$|ish$|able$|ible$/i;

export function analyze(extracted, options = {}) {
  const { meta, url, paragraphs = [], quotes = [], links = [], fullText = '', headings = [] } = extracted;
  const detectedArticleLanguage = detectLanguage(fullText, meta?.language);
  const requestedSourceLanguage = normalizeLangTag(options.sourceLanguage);
  const articleLanguage = requestedSourceLanguage || detectedArticleLanguage;
  const isCJK = /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\u3400-\u4dbf]/.test(fullText);

  const words = isCJK
    ? (fullText.match(/[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\u3400-\u4dbf]/gu) ?? [])
        .concat(fullText.match(/[a-zA-Z][a-zA-Z'-]*/g) ?? [])
    : (fullText.match(/\p{L}[\p{L}\p{M}'-]*/gu) ?? []);
  const wordCount = words.length;
  const charCount = fullText.length;

  const sentences = fullText
    .split(/(?<=[.!?。！？])\s*/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10);

  const sentenceCount = Math.max(1, sentences.length);
  const avgSentenceWords = wordCount / sentenceCount;
  const avgParagraphWords = paragraphs.length ? wordCount / paragraphs.length : wordCount;
  const avgParagraphChars = paragraphs.length
    ? paragraphs.reduce((total, paragraph) => total + paragraph.length, 0) / paragraphs.length
    : charCount;
  const paragraphDensity = paragraphs.length ? Math.round(wordCount / paragraphs.length) : wordCount;

  const freq = {};
  words.forEach((word) => {
    const lc = word.toLowerCase();
    if ((isCJK ? lc.length >= 1 : lc.length > 3) && !STOP_WORDS.has(stripDiacritics(lc))) {
      freq[lc] = (freq[lc] || 0) + 1;
    }
  });

  const topTerms = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  const contentWordCount = Object.values(freq).reduce((sum, count) => sum + count, 0);
  const uniqueTerms = Object.keys(freq).length;
  const repetitionScore = contentWordCount > 0
    ? Math.min(100, Math.round((1 - uniqueTerms / contentWordCount) * 200))
    : 0;

  const adjectiveCount = words.filter((word) => word.length > 4 && ADJ_PATTERN.test(word)).length;
  const adjectiveDensity = wordCount > 0
    ? Math.min(100, Math.round((adjectiveCount / wordCount) * 500))
    : 0;

  const sentenceLengthScore = Math.min(100, Math.round((avgSentenceWords / 35) * 100));
  const entities = detectEntities(sentences);

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = '';
  }

  const externalLinks = links.filter((link) => {
    try {
      return new URL(link.href).hostname !== hostname;
    } catch {
      return false;
    }
  });

  const quoteRatio = paragraphs.length ? Math.round((quotes.length / paragraphs.length) * 100) : 0;
  const linkRatio = wordCount ? Math.round((links.length / wordCount) * 1000) / 10 : 0;
  const extractionConfidence = classifyExtractionConfidence(paragraphs.length, charCount, headings.length);
  const domainReputation = getDomainReputation(hostname);
  const clickbaitScore = classifyClickbait(meta?.title, wordCount, adjectiveDensity);
  const sentimiento = analyzeSentiment(paragraphs);
  const eioProfile = classifyEIOProfile(paragraphs, articleLanguage);
  const lexicalDevices = analyzeLexicalDevices(words, paragraphs, articleLanguage, isCJK);
  const sourceAnatomy = classifySourceAnatomy(quotes, externalLinks, paragraphs, sentences, articleLanguage);
  const narrativeFrames = detectNarrativeFrames(paragraphs, articleLanguage);
  const perspectiveMap = detectPerspectiveMap(paragraphs, articleLanguage);
  const paragraphDiagnostics = buildParagraphDiagnostics(paragraphs, topTerms, articleLanguage);
  const actorAttribution = buildActorAttribution(entities, paragraphs, articleLanguage);
  const localConfidence = scoreLocalConfidence({
    articleLanguage,
    wordCount,
    charCount,
    paragraphs,
    externalLinks,
    quotes,
    entities,
    headings,
  });

  return {
    meta,
    url,
    estructura: {
      charCount,
      wordCount,
      readingTimeMin: Math.max(1, isCJK ? Math.round(charCount / 500) : Math.round(wordCount / 200)),
      paragraphCount: paragraphs.length,
      quoteCount: quotes.length,
      linkCount: links.length,
      sentenceCount,
      headingCount: headings.length,
      avgSentenceWords: round1(avgSentenceWords),
      avgParagraphWords: round1(avgParagraphWords),
      avgParagraphChars: Math.round(avgParagraphChars),
      paragraphDensity,
      quoteRatio,
      linkRatio,
    },
    analisis_lexico: {
      topTerms,
      repetitionScore,
      adjectiveDensity,
      sentenceLengthScore,
      uniqueTerms,
      readabilityScore: scoreReadability(wordCount, sentenceCount, words, isCJK),
      weaselWordCount: countWeaselWords(paragraphs, articleLanguage),
      eioProfile,
      lexicalDevices,
    },
    capa_semantica: {
      articleLanguage,
      detectedArticleLanguage,
      requestedSourceLanguage,
      titleTopic: meta?.title || null,
      structureKind: classifyStructure(wordCount, paragraphs.length, Math.max(1, Math.round(wordCount / 200))),
      evidenceLevel: classifyEvidence(externalLinks.length, quotes.length),
      sourceProfile: classifySourceProfile(externalLinks.length),
      quoteProfile: classifyQuoteProfile(quotes.length),
      focusTerms: topTerms.slice(0, 3).map(({ term }) => term),
      primaryEntities: entities.slice(0, 3),
      sentimentMotion: sentimiento.arc,
      tonePolarity: classifyTone(sentimiento.average),
      provenance: 'local',
      extractionConfidence,
      localConfidence,
      extractionWarning: extractionConfidence === 'low' || wordCount < 120,
      clickbaitScore,
      domainReputation,
      titleCongruence: scoreTitleCongruence(meta?.title, topTerms),
    },
    fuentes: {
      total: links.length,
      external: externalLinks.length,
      items: externalLinks.slice(0, 12),
      diversityScore: scoreSourceDiversity(externalLinks),
    },
    entidades_detectadas: entities,
    sentimiento,
    diagnostico_parrafos: paragraphDiagnostics,
    atribucion_actores: actorAttribution,
    anatomia_fuentes: sourceAnatomy,
    marcos_narrativos: narrativeFrames,
    mapa_perspectivas: perspectiveMap,
    perfil_estilo: {
      adjectiveDensity,
      repetitionScore,
      sentenceLengthScore,
      sourceRichness: Math.min(100, externalLinks.length * 10),
      quoteRichness: Math.min(100, quotes.length * 20),
      paragraphDensityScore: Math.min(100, Math.round((paragraphDensity / 120) * 100)),
    },
  };
}

function classifyClickbait(title, wordCount, adjectiveDensity) {
  let score = 0;
  const t = String(title || '');
  if (/[!?]{2,}/.test(t)) score += 30;
  else if (/[!?]/.test(t)) score += 15;
  if (/\b\d+\s+(razones?|formas?|cosas?|maneras?|tips?|ways?|reasons?|things?|errores?|secrets?|tricks?|facts?|signs?)\b/i.test(t)) score += 25;
  if (/^(Por qué|Why|How to|Cómo|Así que|This is|What happens|Esto es|Lo que|Here's|Nunca|Never|Always|Siempre|Todo lo que|Everything you)/i.test(t)) score += 20;
  if (wordCount < 400 && adjectiveDensity > 45) score += 20;
  if (adjectiveDensity > 65) score += 10;
  return Math.min(100, score);
}

function normalizeLangTag(raw) {
  if (!raw) return null;
  const base = String(raw).toLowerCase().replace('_', '-').split('-')[0];
  return base || null;
}

function detectLanguage(text, hintedLanguage) {
  const hinted = normalizeLangTag(hintedLanguage);
  if (hinted) return hinted;
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\u4e00-\u9fff]/u.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/u.test(text)) return 'ar';
  if (/[\u0400-\u04ff]/u.test(text)) return 'ru';

  const lowered = ` ${stripDiacritics(text.toLowerCase())} `;
  const samples = {
    es: [' el ', ' la ', ' de ', ' que ', ' los ', ' para ', ' una '],
    en: [' the ', ' and ', ' of ', ' to ', ' in ', ' that ', ' with '],
    fr: [' le ', ' la ', ' de ', ' les ', ' des ', ' pour ', ' une '],
    pt: [' o ', ' a ', ' de ', ' que ', ' os ', ' para ', ' uma '],
    it: [' il ', ' la ', ' di ', ' che ', ' per ', ' una ', ' gli '],
    de: [' der ', ' die ', ' und ', ' das ', ' mit ', ' eine ', ' nicht '],
  };

  let bestLanguage = 'unknown';
  let bestScore = 0;

  Object.entries(samples).forEach(([lang, markers]) => {
    const score = markers.reduce((total, marker) => total + (lowered.split(marker).length - 1), 0);
    if (score > bestScore) {
      bestScore = score;
      bestLanguage = lang;
    }
  });

  return bestScore >= 2 ? bestLanguage : 'unknown';
}

function classifyStructure(wordCount, paragraphCount, readingTimeMin) {
  if (readingTimeMin <= 2 || paragraphCount <= 4 || wordCount < 450) return 'brief';
  if (readingTimeMin >= 8 || paragraphCount >= 12 || wordCount >= 1400) return 'deep';
  return 'standard';
}

function classifyEvidence(externalLinkCount, quoteCount) {
  if (externalLinkCount >= 4 || quoteCount >= 3) return 'rich';
  if (externalLinkCount >= 1 || quoteCount >= 1) return 'mixed';
  return 'light';
}

function classifySourceProfile(externalLinkCount) {
  if (externalLinkCount >= 4) return 'external-rich';
  if (externalLinkCount >= 1) return 'mixed';
  return 'internal-only';
}

function classifyQuoteProfile(quoteCount) {
  if (quoteCount >= 3) return 'heavy';
  if (quoteCount >= 1) return 'light';
  return 'none';
}

function classifyTone(average) {
  if (average > 20) return 'positive';
  if (average < -20) return 'charged';
  return 'neutral';
}

function classifyExtractionConfidence(paragraphCount, charCount, headingCount) {
  if (paragraphCount >= 4 && charCount > 1200 && headingCount >= 1) return 'high';
  if (paragraphCount >= 2 && charCount > 500) return 'medium';
  return 'low';
}

function scoreLocalConfidence({ articleLanguage, wordCount, charCount, paragraphs, externalLinks, quotes, entities, headings }) {
  let score = 35;
  score += Math.min(15, Math.round(wordCount / 120));
  score += Math.min(10, Math.round(charCount / 500));
  score += Math.min(20, paragraphs.length * 3);
  score += Math.min(15, externalLinks.length * 2);
  score += Math.min(10, quotes.length * 4);
  score += Math.min(10, entities.length * 2);
  score += Math.min(10, headings.length * 3);

  if (articleLanguage === 'unknown') score -= 10;
  if (articleLanguage === 'ja' || articleLanguage === 'ko' || articleLanguage === 'ar') score -= 8;
  if (paragraphs.length <= 1) score -= 25;
  if (wordCount < 120) score -= 25;
  if (charCount < 600) score -= 15;

  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function detectEntities(sentences) {
  const entityFreq = {};

  sentences.forEach((sentence) => {
    const tokens = sentence.trim().split(/\s+/);
    tokens.slice(1).forEach((token) => {
      const clean = token.replace(/[^\p{L}\p{M}]/gu, '');
      if (
        clean.length > 2 &&
        /^\p{Lu}/u.test(clean) &&
        !STOP_WORDS.has(stripDiacritics(clean.toLowerCase()))
      ) {
        entityFreq[clean] = (entityFreq[clean] || 0) + 1;
      }
    });
  });

  return Object.entries(entityFreq)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, mentions]) => ({ name, mentions }));
}

function buildParagraphDiagnostics(paragraphs, topTerms, articleLanguage) {
  if (!Array.isArray(paragraphs) || !paragraphs.length) return [];
  const focusTerms = (topTerms || []).slice(0, 5).map((item) => ({
    term: String(item.term || ''),
    normalized: stripDiacritics(String(item.term || '').toLowerCase()),
  })).filter((item) => item.normalized);
  const attrPattern = articleLanguage === 'en'
    ? /\b(according to|sources?|said|stated|declared|confirmed|reported|told|quoted|explained|announced)\b/gi
    : /\b(seg[uú]n|fuentes?|dijo|afirm[oó]|señal[oó]|explic[oó]|declar[oó]|confirm[oó]|anunci[oó]|cit[oó])\b/gi;
  const modalPattern = articleLanguage === 'en'
    ? /\b(may|might|could|would|should|appears?|seems?|likely|unlikely|perhaps|reportedly)\b/gi
    : /\b(puede|podria|deberia|parece|aparenta|probablemente|posiblemente|quiza|tal vez|seguramente)\b/gi;
  const cohesionPattern = articleLanguage === 'en'
    ? /\b(and|but|however|therefore|meanwhile|moreover|instead|because|although|while|then|also|in addition|by contrast)\b/gi
    : /\b(y|pero|sin embargo|por tanto|mientras|ademas|en cambio|porque|aunque|mientras que|entonces|tambien|por otra parte)\b/gi;

  return paragraphs.map((paragraph, index) => {
    const normalizedParagraph = stripDiacritics(String(paragraph || '').toLowerCase());
    const termHits = focusTerms.map((item) => ({
      term: item.term,
      count: countNormalizedOccurrences(normalizedParagraph, item.normalized),
    }));
    const dominant = termHits.sort((a, b) => b.count - a.count)[0];
    const focusScore = Math.min(100, termHits.reduce((sum, item) => sum + item.count, 0) * 18);
    const attributionHits = (String(paragraph || '').match(attrPattern) || []).length;
    const modalHits = (String(paragraph || '').match(modalPattern) || []).length;
    const cohesionHits = (String(paragraph || '').match(cohesionPattern) || []).length;
    const currentTokens = extractContentTokens(paragraph);
    const previousTokens = index > 0 ? extractContentTokens(paragraphs[index - 1]) : [];
    const overlap = previousTokens.length ? lexicalOverlapScore(currentTokens, previousTokens) : 0;
    return {
      id: index + 1,
      focusTerm: dominant?.count ? dominant.term : '',
      focusScore,
      attributionScore: Math.min(100, attributionHits * 24),
      modalScore: Math.min(100, modalHits * 20),
      cohesionScore: Math.min(100, cohesionHits * 16 + overlap),
    };
  });
}

function buildActorAttribution(entities, paragraphs, articleLanguage) {
  if (!Array.isArray(entities) || !entities.length || !Array.isArray(paragraphs) || !paragraphs.length) return [];
  const attrPattern = articleLanguage === 'en'
    ? /\b(according to|sources?|said|stated|declared|confirmed|reported|told|quoted|explained|announced)\b/i
    : /\b(seg[uú]n|fuentes?|dijo|afirm[oó]|señal[oó]|explic[oó]|declar[oó]|confirm[oó]|anunci[oó]|cit[oó])\b/i;

  return entities.slice(0, 6).map((entity) => {
    const normalizedName = stripDiacritics(String(entity.name || '').toLowerCase());
    let attributed = 0;
    let plain = 0;
    paragraphs.forEach((paragraph) => {
      const normalizedParagraph = stripDiacritics(String(paragraph || '').toLowerCase());
      const hits = countNormalizedOccurrences(normalizedParagraph, normalizedName);
      if (!hits) return;
      if (attrPattern.test(String(paragraph || ''))) attributed += hits;
      else plain += hits;
    });
    return {
      name: entity.name,
      mentions: entity.mentions || attributed + plain,
      attributed,
      unattributed: plain,
    };
  }).filter((item) => item.mentions > 0);
}

function stripDiacritics(value) {
  return String(value || '').normalize('NFD').replace(/\p{M}+/gu, '');
}

function countNormalizedOccurrences(haystack, needle) {
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = haystack.match(new RegExp(`\\b${escaped}\\b`, 'g'));
  return matches ? matches.length : 0;
}

function extractContentTokens(text) {
  return (String(text || '').toLowerCase().match(/\p{L}[\p{L}\p{M}'-]*/gu) || [])
    .map((token) => stripDiacritics(token))
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

function lexicalOverlapScore(currentTokens, previousTokens) {
  if (!currentTokens.length || !previousTokens.length) return 0;
  const currentSet = new Set(currentTokens);
  const previousSet = new Set(previousTokens);
  let overlap = 0;
  currentSet.forEach((token) => {
    if (previousSet.has(token)) overlap += 1;
  });
  return Math.min(100, Math.round((overlap / Math.max(1, currentSet.size)) * 100));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function countVowelGroups(word) {
  const m = word.match(/[aeiouáéíóúàèìòùâêîôûäëïöüy]+/gi);
  return Math.max(1, m ? m.length : 1);
}

function scoreReadability(wordCount, sentenceCount, words, isCJK) {
  if (isCJK || wordCount < 15) return null;
  const syllables = words.reduce((sum, w) => sum + countVowelGroups(w), 0);
  const avgSentenceLen = wordCount / Math.max(1, sentenceCount);
  const avgSyllables = syllables / Math.max(1, wordCount);
  const score = 206.835 - 1.015 * avgSentenceLen - 84.6 * avgSyllables;
  return Math.max(0, Math.min(100, Math.round(score)));
}

const WEASEL_PATTERN_ES = 'algunas? fuentes?|algunos? expertos?|se (dice|cree|afirma|rumorea)|según (fuentes?|algunos?|expertos?)|es (probable|posible)|aparentemente|supuestamente|presuntamente|al parecer|podría (ser|tratarse)|se estima que';
const WEASEL_PATTERN_EN = 'some (experts?|sources?|people|analysts?)|it (is|was) (said|believed|reported|claimed|alleged)|according to some|apparently|supposedly|allegedly|could (be|have been)|might (be|have been)|is (thought|believed|said) to|many (believe|think|say)';

function countWeaselWords(paragraphs, articleLanguage) {
  if (!paragraphs.length) return 0;
  const text = paragraphs.join(' ');
  const source = articleLanguage === 'en' ? WEASEL_PATTERN_EN : WEASEL_PATTERN_ES;
  const matches = text.match(new RegExp(source, 'gi'));
  return matches ? matches.length : 0;
}

function scoreTitleCongruence(title, topTerms) {
  if (!title || !topTerms.length) return null;
  const titleWords = [...new Set(
    String(title).toLowerCase().match(/\p{L}[\p{L}\p{M}'-]*/gu) ?? []
  )].filter((w) => w.length > 3 && !STOP_WORDS.has(stripDiacritics(w)));
  if (!titleWords.length) return null;
  const bodyTerms = new Set(topTerms.map((t) => stripDiacritics(t.term.toLowerCase())));
  const overlap = titleWords.filter((w) => bodyTerms.has(stripDiacritics(w)));
  return Math.round((overlap.length / titleWords.length) * 100);
}

function classifyEIOProfile(paragraphs, articleLanguage) {
  const text = paragraphs.join(' ');
  const isEn = articleLanguage === 'en';

  const EVIDENCE_ES = /\b(seg[uú]n|de acuerdo con|datos de|informe de|estudio de|cifras de|reporte de|declaró|afirmó|señaló|explicó|anunció|firmó|aprobó|presentó|publicó)\b/gi;
  const EVIDENCE_EN = /\b(according to|data from|report by|study by|figures from|declared|stated|said|announced|signed|approved|published|confirmed)\b/gi;
  const INTERPRET_ES = /\b(lo que significa|esto indica|esto sugiere|lo que implica|en este contexto|lo que revela|lo que demuestra|lo que apunta|podría significar|parece indicar|todo apunta a|sugiere que|implica que)\b/gi;
  const INTERPRET_EN = /\b(which suggests|this implies|what this means|this indicates|in this context|which reveals|which demonstrates|points to|could mean|seems to indicate|all signs point|suggests that|implies that)\b/gi;
  const OPINION_ES = /\b(en mi opinión|creo que|considero que|es evidente|obviamente|claramente|sin duda|evidentemente|a todas luces|indudablemente|lamentablemente|afortunadamente|desgraciadamente|preocupante|inaceptable|incomprensible)\b/gi;
  const OPINION_EN = /\b(i believe|in my view|clearly|obviously|it is clear|undeniably|inevitably|unfortunately|fortunately|worryingly|unacceptably|incomprehensibly|regrettably|thankfully)\b/gi;

  const evidenceCount = (text.match(isEn ? EVIDENCE_EN : EVIDENCE_ES) || []).length;
  const interpretCount = (text.match(isEn ? INTERPRET_EN : INTERPRET_ES) || []).length;
  const opinionCount = (text.match(isEn ? OPINION_EN : OPINION_ES) || []).length;
  const total = evidenceCount + interpretCount + opinionCount || 1;

  return {
    evidence: Math.round((evidenceCount / total) * 100),
    interpretation: Math.round((interpretCount / total) * 100),
    opinion: Math.round((opinionCount / total) * 100),
    evidenceCount,
    interpretCount,
    opinionCount,
    dominant: evidenceCount >= interpretCount && evidenceCount >= opinionCount
      ? 'evidence'
      : opinionCount >= interpretCount ? 'opinion' : 'interpretation',
  };
}

function analyzeLexicalDevices(words, paragraphs, articleLanguage, isCJK) {
  if (isCJK) return [];

  const text = paragraphs.join(' ');
  const wordCount = Math.max(1, words.length);
  const isEn = articleLanguage === 'en';

  const adverbCount = words.filter((word) => (
    isEn ? /ly$/i.test(word) : /mente$/i.test(word)
  )).length;

  const idiomSource = isEn
    ? /\b(at the end of the day|in other words|needless to say|without a doubt|for the most part|on the other hand|as a matter of fact|in the wake of|last but not least)\b/gi
    : /\b(al fin y al cabo|por otra parte|en otras palabras|sin duda|a todas luces|de alguna manera|en este sentido|cabe recordar|no es casualidad|por asi decirlo)\b/gi;

  const modalSource = isEn
    ? /\b(may|might|could|would|should|seems to|appears to|likely|unlikely|arguably|perhaps|reportedly)\b/gi
    : /\b(puede|podria|deberia|debe|parece|aparenta|probablemente|posiblemente|quiza|tal vez|seguramente|habria)\b/gi;

  const passiveSource = isEn
    ? /\b(?:was|were|is|are|been|being|be)\s+\w+(?:ed|en)\b/gi
    : /\b(?:fue|fueron|es|son|era|eran|ha sido|han sido|habia sido|habian sido|sera|seran)\s+\w+(?:ado|ada|ados|adas|ido|ida|idos|idas|to|ta|tos|tas)\b/gi;

  const idiomCount = (text.match(idiomSource) || []).length;
  const modalCount = (text.match(modalSource) || []).length;
  const passiveCount = (text.match(passiveSource) || []).length;
  const toScore = (count, weight) => Math.min(100, Math.round((count / wordCount) * 1000 * weight));

  return [
    { id: 'adverbs', count: adverbCount, score: toScore(adverbCount, 4) },
    { id: 'idioms', count: idiomCount, score: toScore(idiomCount, 18) },
    { id: 'modalizers', count: modalCount, score: toScore(modalCount, 9) },
    { id: 'passive', count: passiveCount, score: toScore(passiveCount, 14) },
  ];
}

function scoreSourceDiversity(externalLinks) {
  if (!externalLinks.length) return null;
  const roots = new Set();
  externalLinks.forEach((link) => {
    try {
      const parts = new URL(link.href).hostname.split('.');
      roots.add(parts.slice(-2).join('.'));
    } catch {}
  });
  return Math.round((roots.size / externalLinks.length) * 100);
}
