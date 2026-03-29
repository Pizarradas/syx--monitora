/**
 * BiasMapper - Source anatomy classifier (F1.1).
 * Classifies attribution signals in the article text into five categories:
 * primary, expert, anonymous, medial, unattributed.
 */

// --- Regex patterns (Spanish) ---

const PATTERNS_ES = {
  primary: [
    /seg[uú]n\s+(el\s+)?(informe|estudio|documento|datos?|an[aá]lisis|registro|estad[ií]sticas?|reporte)\b/gi,
    /\b(informe|estudio|documento|datos?)\s+(de|del|publicado|elaborado)\b/gi,
    /\b(BOE|boletin oficial|registro oficial|estadistica oficial)\b/gi,
    /\b(segun|de acuerdo con)\s+(el|la|los|las)\s+(ministerio|gobierno|comision|agencia|instituto)\b/gi,
    /el\s+documento\s+(recoge|muestra|señala|indica|revela)/gi,
    /seg[uú]n\s+(datos|cifras)\s+(del?|publicados?)\b/gi,
  ],
  expert: [
    /\b(director[a]?|ministr[ao]|president[ae]|portavoz|investigador[a]?|profesor[a]?|catedr[aá]tic[ao]|cient[ií]fic[ao]|especialista|analista|expert[ao])\s+\b/gi,
    /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s*(quien|que)\s+(afirm[oó]|señal[oó]|explic[oó]|declar[oó]|asegur[oó])/g,
    /seg[uú]n\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s*(investigador|profesor|experto|director|analista)/gi,
    /en\s+declaraciones\s+a\s+este\s+(medio|peri[oó]dico|diario)/gi,
  ],
  anonymous: [
    /fuentes?\s+(cercanas?|del?\s+entorno|del?\s+gobierno|parlamentarias?|de\s+la\s+investigaci[oó]n|que\s+pid[ie]|conocedoras?)\b/gi,
    /seg[uú]n\s+testigos?\b/gi,
    /desde\s+el\s+entorno\s+de\b/gi,
    /(inform[oó]|aseguró)\s+a\s+este\s+(peri[oó]dico|medio|diario)\s+una?\s+fuente\b/gi,
    /fuentes?\s+anonimas?\b/gi,
    /seg[uú]n\s+(fuentes?|informantes?)\s+(que|quien|quienes)\s+\b/gi,
    /\buna?\s+fuente\s+(que|del|del?\s+entorno|cercana|parlamentaria|de\s+la)\b/gi,
  ],
  medial: [
    /seg[uú]n\s+(inform[oó]|public[oó]|adelant[oó]|report[oó])\s+[A-ZÁÉÍÓÚÑ]/g,
    /como\s+(recog[eió]|adelant[oó]|report[oó])\s+[A-ZÁÉÍÓÚÑ]/gi,
    /de\s+acuerdo\s+con\s+(el\s+medio|la\s+publicaci[oó]n|el\s+diario|el\s+peri[oó]dico)\b/gi,
    /seg[uú]n\s+(public[oó]|informo)\s+(el\s+)?(peri[oó]dico|diario|agencia|medio)\b/gi,
    /\b(Reuters|AFP|EFE|AP|Europa Press|El Pais|El Mundo|ABC|La Vanguardia|El Confidencial|elDiario|infoLibre)\b/g,
  ],
};

const PATTERNS_EN = {
  primary: [
    /according\s+to\s+(the\s+)?(report|study|document|data|analysis|record|statistics|survey)\b/gi,
    /\b(report|study|document|data)\s+(from|by|published|released)\b/gi,
    /\b(official\s+data|government\s+figures|census\s+data|federal\s+report)\b/gi,
    /the\s+document\s+(shows|states|reveals|indicates|records)/gi,
    /according\s+to\s+(data|figures)\s+(from|released\s+by)\b/gi,
  ],
  expert: [
    /\b(director|minister|president|spokesperson|researcher|professor|scientist|analyst|expert|official)\s+\b/gi,
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s*(who|that)\s+(said|stated|explained|declared|confirmed)/g,
    /according\s+to\s+[A-Z][a-z]+\s+[A-Z][a-z]+,\s*(researcher|professor|expert|director|analyst)\b/gi,
    /in\s+(comments?|statements?|remarks?)\s+to\s+(this\s+)?(newspaper|outlet|publication|reporter)\b/gi,
  ],
  anonymous: [
    /sources?\s+(close\s+to|familiar\s+with|who\s+requested|inside|within)\b/gi,
    /according\s+to\s+(anonymous|unnamed|unidentified)\s+(sources?|officials?)\b/gi,
    /sources?\s+who\s+(spoke|asked)\s+(to|on)\s+(the\s+)?(condition|behalf)\b/gi,
    /\ba\s+(source|person|official)\s+(familiar|close|who|that)\b/gi,
    /anonymous\s+source(s)?\b/gi,
  ],
  medial: [
    /according\s+to\s+(reports?\s+by|a\s+report\s+in)\s+[A-Z]/gi,
    /as\s+(reported|published|first\s+reported)\s+by\s+[A-Z]/gi,
    /\b(Reuters|AP|AFP|Bloomberg|BBC|CNN|NYT|New\s+York\s+Times|Washington\s+Post|Guardian|Politico)\b/g,
    /citing\s+(a\s+)?(report|article)\s+(in|by|from)\b/gi,
  ],
};

function countMatches(text, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    const matches = text.match(new RegExp(pattern.source, pattern.flags));
    count += matches ? matches.length : 0;
  }
  return count;
}

function detectUnattributedClaims(sentences) {
  // Factual declarative sentences without attribution markers
  const ATTRIBUTION_MARKERS = /seg[uú]n|de acuerdo|according to|fuentes?|sources?|afirm[oó]|said|stated|declared|inform[oó]|aseguró|señal[oó]|explic[oó]|declar[oó]|dijo|told|citando|quoting/i;
  const FACTUAL_VERBS = /\b(es|son|fue|fueron|ser[aá]|ha\s+sido|han\s+sido|is|are|was|were|will\s+be|has\s+been|have\s+been)\b/i;
  const QUOTE_MARKERS = /["""«»]/;

  let count = 0;
  for (const sentence of sentences) {
    // Skip short sentences, questions, and sentences with quotes
    if (sentence.length < 30 || /[?¿]/.test(sentence) || QUOTE_MARKERS.test(sentence)) continue;
    // Count factual declaratives without attribution
    if (FACTUAL_VERBS.test(sentence) && !ATTRIBUTION_MARKERS.test(sentence)) {
      count++;
    }
  }
  return count;
}

export function classifySourceAnatomy(quotes, externalLinks, paragraphs, sentences, articleLanguage) {
  const text = paragraphs.join(' ');
  const isEn = articleLanguage === 'en';
  const patterns = isEn ? PATTERNS_EN : PATTERNS_ES;

  const primary = countMatches(text, patterns.primary);
  const expert = countMatches(text, patterns.expert);
  const anonymous = countMatches(text, patterns.anonymous);
  const medial = countMatches(text, patterns.medial);
  const unattributed = detectUnattributedClaims(sentences);

  const totals = { primary, expert, anonymous, medial, unattributed };
  const total = primary + expert + anonymous + medial || 1;

  // Dominant type (excluding unattributed from dominance calc)
  const namedTotal = primary + expert + anonymous + medial;
  let dominantType = 'mixed';
  if (namedTotal > 0) {
    const named = { primary, expert, anonymous, medial };
    dominantType = Object.entries(named).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Transparency score: primary+expert contribute positively, anonymous+unattributed negatively
  const transparencyScore = Math.max(0, Math.min(100,
    Math.round(
      ((primary * 30 + expert * 20) - (anonymous * 15 + unattributed * 5)) / Math.max(1, total) * 10 + 50
    )
  ));

  return {
    primary,
    expert,
    anonymous,
    medial,
    unattributed,
    total: namedTotal,
    dominantType,
    transparencyScore,
  };
}
