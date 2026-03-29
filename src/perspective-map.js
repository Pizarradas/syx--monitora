/**
 * BiasMapper — F2.1: Perspective map (lexical detection)
 * Detects actor categories and voice presence using regex patterns.
 * No LLM required. Chrome AI enrichment is optional (ai-analyzer.js).
 */

const CATEGORIES = ['government', 'opposition', 'expert', 'civil', 'media', 'anonymous'];

const PATTERNS_ES = {
  government: [
    /\b(ministerio|gobierno|presidente|ministr[ao]|consejería|alcaldía|diputación|secretaría)\b/i,
    /\b(portavoz del|secretario de estado|delegado del|junta de)\b/i,
    /\b(ayuntamiento|comunidad autónoma|delegación|subsecretari[ao])\b/i,
  ],
  opposition: [
    /\b(PP|PSOE|Vox|Podemos|Sumar|Ciudadanos|IU|ERC|Junts|PNV|Bildu|CUP|Más País)\b/,
    /\b(líder de la oposición|grupo parlamentario|partido de la oposición)\b/i,
    /\b(portavoz de|diputad[ao] de|senador[a]? de)\s+(PP|PSOE|Vox|Podemos|Sumar|Ciudadanos|IU|ERC|Junts|PNV|Bildu)/i,
  ],
  expert: [
    /\b(investigador[a]?|profesor[a]?|catedrático[a]?|analista|economista|sociólogo[a]?|doctor[a]?)\s+(de|en|del)\b/i,
    /\b(según (un?|una?) experto|especialistas? en|estudio de)\b/i,
    /\b(universidad|instituto de investigación|think tank|centro de estudios)\b/i,
  ],
  civil: [
    /\b(asociación|colectivo|plataforma|sindicato|ONG|organización no gubernamental)\b/i,
    /\b(vecinos?|afectados?|familiares?|ciudadanos?|activistas?|manifestantes?|damnificados?)\b/i,
  ],
  media: [
    /\b(según (el|la|los|las)?\s*(periódico|diario|medio|agencia|televisión|radio|canal))\b/i,
    /\b(EFE|Reuters|AP|AFP|Europa Press)\b/,
    /\b(publica|informa|recoge|señala)\s+(el|la)\s+\w+/i,
  ],
  anonymous: [
    /\b(fuentes? (anónimas?|cercanas?|del entorno|gubernamentales?|oficiales?))\b/i,
    /\b(según fuentes|fuentes (que|consultadas|de la|del))\b/i,
    /\b(testigos? (que|anónimos?)|personas? cercanas? al)\b/i,
  ],
};

const PATTERNS_EN = {
  government: [
    /\b(government|administration|president|minister|ministry|secretary|department|spokesperson)\b/i,
    /\b(white house|state department|treasury|pentagon|downing street)\b/i,
    /\b(official(s)?|authorities|federal|municipal|city hall|cabinet)\b/i,
  ],
  opposition: [
    /\b(Republican|Democrat|Labour|Conservative|Lib Dem|Green Party|opposition leader)\b/i,
    /\b(opposition|rival party|challenger|minority (leader|party))\b/i,
    /\b(shadow (minister|chancellor|secretary))\b/i,
  ],
  expert: [
    /\b(researcher|professor|analyst|economist|sociologist|expert|academic|scholar)\b/i,
    /\b(according to (an? )?(expert|researcher|study|report))\b/i,
    /\b(university|think tank|institute|research center)\b/i,
  ],
  civil: [
    /\b(association|NGO|nonprofit|union|activists?|citizens?|residents?|victims?|affected)\b/i,
    /\b(civil society|community (group|organization)|advocacy|volunteers?)\b/i,
  ],
  media: [
    /\b(according to (the )?(newspaper|outlet|channel|agency|TV|radio))\b/i,
    /\b(Reuters|AP|AFP|BBC|CNN|reported by)\b/i,
  ],
  anonymous: [
    /\b(anonymous source(s)?|sources? (familiar|close|who|within|said))\b/i,
    /\b(source(s)? (told|said|revealed|confirmed)|unnamed (official|source))\b/i,
    /\b(according to sources?|people familiar with)\b/i,
  ],
};

const CATEGORY_META = {
  es: {
    government: { icon: '🏛', label: 'Gobierno / institución' },
    opposition: { icon: '⚖️', label: 'Oposición' },
    expert:     { icon: '🎓', label: 'Expertos / académicos' },
    civil:      { icon: '👥', label: 'Sociedad civil' },
    media:      { icon: '📰', label: 'Cita medial' },
    anonymous:  { icon: '👤', label: 'Fuentes anónimas' },
  },
  en: {
    government: { icon: '🏛', label: 'Government / official' },
    opposition: { icon: '⚖️', label: 'Opposition' },
    expert:     { icon: '🎓', label: 'Experts / academics' },
    civil:      { icon: '👥', label: 'Civil society' },
    media:      { icon: '📰', label: 'Cited outlet' },
    anonymous:  { icon: '👤', label: 'Anonymous sources' },
  },
};

function countMatches(text, patterns) {
  return patterns.reduce((acc, re) => {
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const matches = text.match(globalRe);
    return acc + (matches ? matches.length : 0);
  }, 0);
}

export function detectPerspectiveMap(paragraphs, articleLanguage) {
  const text = paragraphs.join(' ');
  const isEn = articleLanguage === 'en';
  const patterns = isEn ? PATTERNS_EN : PATTERNS_ES;
  const meta = isEn ? CATEGORY_META.en : CATEGORY_META.es;

  const voices = CATEGORIES.map((cat) => {
    const count = countMatches(text, patterns[cat]);
    return {
      category: cat,
      icon: meta[cat].icon,
      label: meta[cat].label,
      count,
      presence: count >= 3 ? 'high' : count >= 1 ? 'low' : 'none',
    };
  });

  const presentCategories = voices.filter((v) => v.count > 0).length;
  const pluralityScore = Math.round((presentCategories / CATEGORIES.length) * 100);

  const sorted = [...voices].sort((a, b) => b.count - a.count);
  const dominantCategory = sorted[0]?.count > 0 ? sorted[0].category : null;

  return {
    voices,
    pluralityScore,
    dominantCategory,
    method: 'lexical',
  };
}
