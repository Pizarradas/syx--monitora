/**
 * BiasMapper - Narrative frame detector (F1.3).
 * Detects dominant narrative frames using lexical keyword matching.
 * Phase 1: local, no LLM.
 */

const FRAME_LEXICON_ES = {
  CRISIS_AMENAZA: [
    'crisis', 'colapso', 'desbordamiento', 'limite', 'saturacion', 'alarma',
    'emergencia', 'catastrofe', 'desastre', 'riesgo', 'amenaza', 'peligro',
    'irreversible', 'grave', 'sin precedentes', 'dramatico', 'agravamiento',
    'deterioro', 'insostenible', 'critico', 'urgente', 'alarmante', 'devastador',
    'colapsar', 'desbordar', 'saturar', 'agravar',
  ],
  CONFLICTO: [
    'choque', 'enfrentamiento', 'batalla', 'guerra', 'pugna', 'disputa',
    'tension', 'acusacion', 'replica', 'contraataque', 'bloqueo', 'veto',
    'rechazo', 'oposicion', 'rivalidad', 'confrontacion', 'litigio',
    'polemico', 'polemizar', 'enfrentar', 'chocar', 'acusar', 'desafiar',
    'pulso', 'duelo',
  ],
  VICTIMA_RESPONSABLE: [
    'victimas', 'afectados', 'perjudicados', 'sufrimiento', 'consecuencias',
    'responsabilidad', 'culpa', 'negligencia', 'abandono', 'dejadez',
    'mala gestion', 'impunidad', 'denuncia', 'queja', 'reclamacion',
    'discriminacion', 'injusticia', 'desamparo', 'damnificados',
    'pagar el precio', 'sufrir las consecuencias',
  ],
  PROGRESO_LOGRO: [
    'record', 'historico', 'crecimiento', 'avance', 'mejora', 'exito',
    'lider', 'referente', 'superado', 'alcanzado', 'logrado', 'hito',
    'impulso', 'innovacion', 'logro', 'conquista', 'triunfo', 'victoria',
    'destacar', 'liderar', 'superar', 'alcanzar', 'mejorar', 'crecer',
  ],
  ESCANDALO_REVELACION: [
    'documentos', 'filtracion', 'revelacion', 'destapado', 'descubierto',
    'secreto', 'contradiccion', 'mentira', 'ocultacion', 'tapado',
    'escandalo', 'corrupcion', 'fraude', 'irregularidad', 'opacidad',
    'ha tenido acceso', 'documentos internos', 'fuentes internas',
    'revelar', 'destapar', 'descubrir', 'filtrar', 'denunciar',
  ],
  NORMALIZACION: [
    'habitual', 'estacionalidad', 'tendencia esperada', 'en linea con',
    'previsible', 'sin sorpresas', 'comportamiento normal', 'dentro de lo esperado',
    'como cada', 'de costumbre', 'como es habitual', 'tipico', 'rutinario',
    'ordinario', 'normal', 'esperado', 'previsto', 'segun lo previsto',
  ],
};

const FRAME_LEXICON_EN = {
  CRISIS_AMENAZA: [
    'crisis', 'collapse', 'overwhelmed', 'limit', 'saturation', 'alarm',
    'emergency', 'catastrophe', 'disaster', 'risk', 'threat', 'danger',
    'irreversible', 'severe', 'unprecedented', 'dramatic', 'deterioration',
    'unsustainable', 'critical', 'urgent', 'alarming', 'devastating',
    'collapse', 'overwhelm', 'surge',
  ],
  CONFLICTO: [
    'clash', 'confrontation', 'battle', 'war', 'dispute', 'tension',
    'accusation', 'rebuttal', 'counterattack', 'blockade', 'veto',
    'rejection', 'opposition', 'rivalry', 'standoff', 'litigation',
    'controversial', 'confront', 'clash', 'accuse', 'challenge',
    'showdown', 'standoff',
  ],
  VICTIMA_RESPONSABLE: [
    'victims', 'affected', 'harmed', 'suffering', 'consequences',
    'responsibility', 'blame', 'negligence', 'abandonment', 'mismanagement',
    'accountability', 'complaint', 'claim', 'discrimination', 'injustice',
    'vulnerable', 'casualty', 'displaced',
    'bear the cost', 'pay the price', 'suffer the consequences',
  ],
  PROGRESO_LOGRO: [
    'record', 'historic', 'growth', 'advance', 'improvement', 'success',
    'leader', 'benchmark', 'achieved', 'milestone', 'boost',
    'innovation', 'achievement', 'triumph', 'victory', 'breakthrough',
    'lead', 'surpass', 'exceed', 'improve', 'grow',
  ],
  ESCANDALO_REVELACION: [
    'documents', 'leak', 'revelation', 'exposed', 'uncovered',
    'secret', 'contradiction', 'lie', 'concealment', 'cover-up',
    'scandal', 'corruption', 'fraud', 'irregularity', 'opacity',
    'obtained documents', 'internal documents', 'inside sources',
    'reveal', 'expose', 'uncover', 'leak', 'whistleblower',
  ],
  NORMALIZACION: [
    'typical', 'seasonal', 'expected trend', 'in line with',
    'predictable', 'no surprises', 'normal behavior', 'within expectations',
    'as usual', 'as expected', 'routine', 'ordinary', 'standard',
    'normal', 'expected', 'anticipated', 'projected', 'as predicted',
  ],
};

const FRAME_META = {
  CRISIS_AMENAZA:      { icon: '⚠',  label_es: 'Crisis / Amenaza',           label_en: 'Crisis / Threat' },
  CONFLICTO:           { icon: '⚔',  label_es: 'Conflicto / Enfrentamiento', label_en: 'Conflict / Confrontation' },
  VICTIMA_RESPONSABLE: { icon: '🎯', label_es: 'Víctima / Responsable',      label_en: 'Victim / Accountability' },
  PROGRESO_LOGRO:      { icon: '↗',  label_es: 'Progreso / Logro',            label_en: 'Progress / Achievement' },
  ESCANDALO_REVELACION:{ icon: '🔍', label_es: 'Escándalo / Revelación',     label_en: 'Scandal / Revelation' },
  NORMALIZACION:       { icon: '～', label_es: 'Normalización / Rutina',      label_en: 'Normalization / Routine' },
};

function stripDiacriticsLocal(str) {
  return String(str || '').normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}

function scoreFrame(text, keywords) {
  let count = 0;
  const normalizedText = stripDiacriticsLocal(text);
  for (const kw of keywords) {
    const normalizedKw = stripDiacriticsLocal(kw);
    // Use word-boundary-aware search for multi-word phrases
    if (normalizedKw.includes(' ')) {
      if (normalizedText.includes(normalizedKw)) count++;
    } else {
      const re = new RegExp(`\\b${normalizedKw}\\b`, 'g');
      const m = normalizedText.match(re);
      if (m) count += m.length;
    }
  }
  return count;
}

export function detectNarrativeFrames(paragraphs, articleLanguage) {
  if (!paragraphs.length) {
    return { frames: [], dominant: null, secondary: [], totalSignals: 0 };
  }

  const text = paragraphs.join(' ');
  const isEn = articleLanguage === 'en';
  const lexicon = isEn ? FRAME_LEXICON_EN : FRAME_LEXICON_ES;

  const rawScores = {};
  let totalSignals = 0;

  for (const [frameId, keywords] of Object.entries(lexicon)) {
    const count = scoreFrame(text, keywords);
    rawScores[frameId] = count;
    totalSignals += count;
  }

  if (totalSignals === 0) {
    const frames = Object.keys(FRAME_META).map((id) => ({
      id,
      icon: FRAME_META[id].icon,
      label: isEn ? FRAME_META[id].label_en : FRAME_META[id].label_es,
      count: 0,
      score: 0,
    }));
    return { frames, dominant: null, secondary: [], totalSignals: 0 };
  }

  const frames = Object.entries(rawScores)
    .map(([id, count]) => ({
      id,
      icon: FRAME_META[id].icon,
      label: isEn ? FRAME_META[id].label_en : FRAME_META[id].label_es,
      count,
      score: Math.round((count / totalSignals) * 100),
    }))
    .sort((a, b) => b.score - a.score);

  const dominant = frames[0]?.score > 10 ? frames[0].id : null;
  const secondary = frames
    .slice(1)
    .filter((f) => f.score >= 15 && f.score >= frames[0].score * 0.4)
    .map((f) => f.id);

  return { frames, dominant, secondary, totalSignals };
}
