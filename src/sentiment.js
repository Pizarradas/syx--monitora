/**
 * BiasMapper — Sentiment Analysis Engine
 * ============================================
 * Local, deterministic — no API calls.
 * Spanish-first lexicon with English fallback.
 * Handles negators and intensifiers within a sliding window.
 *
 * Output per paragraph: score in [-100, +100]
 *   > +20  → positive
 *   < -20  → negative (charged/loaded)
 *   else   → neutral
 */

// ── Sentiment lexicon ──────────────────────────────────────────────────────
// Values: +3 very positive, +2 positive, +1 slightly positive
//         -1 slightly negative, -2 negative, -3 very negative

const LEXICON = {
  // ── Very positive (+3) ──────────────────────────────────────────────────
  extraordinario:3, excelente:3, espléndido:3, magnífico:3, brillante:3,
  excepcional:3, fenomenal:3, maravilloso:3, sobresaliente:3, perfecto:3,
  óptimo:3, impecable:3, notable:3, formidable:3, elogiable:3,

  // ── Positive (+2) ───────────────────────────────────────────────────────
  bueno:2, bien:2, mejor:2, positivo:2, exitoso:2, éxito:2, logro:2,
  avance:2, progreso:2, mejora:2, crecimiento:2, beneficio:2,
  apoyo:2, acuerdo:2, solución:2, transparente:2, justo:2, eficiente:2,
  sostenible:2, sólido:2, estable:2, robusto:2, rentable:2, viable:2,
  seguro:2, confiable:2, innovador:2, productivo:2, favorable:2,
  recuperación:2, superávit:2, ganancia:2, beneficios:2, ingresos:2,
  aceleración:2, expansión:2, fortaleza:2, capacidad:2, respaldo:2,
  cumplimiento:2, transparencia:2, legalidad:2, credibilidad:2,
  // English
  good:2, great:2, excellent:2, success:2, positive:2, benefit:2,
  growth:2, improve:2, strong:2, achieve:2, gain:2, progress:2,

  // ── Slightly positive (+1) ───────────────────────────────────────────────
  adecuado:1, correcto:1, razonable:1, útil:1, válido:1, suficiente:1,
  claro:1, preciso:1, efectivo:1, apropiado:1, conveniente:1,
  esperanzador:1, prometedor:1, optimismo:1, renovación:1, atractivo:1,
  acordaron:1, aprobaron:1, confirmaron:1, reconocieron:1,
  colaboración:1, inversión:1, oportunidad:1, iniciativa:1,
  // English
  adequate:1, clear:1, useful:1, effective:1, opportunity:1,

  // ── Slightly negative (-1) ───────────────────────────────────────────────
  dificultad:-1, dificultades:-1, preocupante:-1, insuficiente:-1,
  lento:-1, débil:-1, complejo:-1, incierto:-1, dudoso:-1,
  cuestionable:-1, irregular:-1, impreciso:-1, tardío:-1, parcial:-1,
  retraso:-1, demora:-1, obstáculo:-1, tensión:-1, incertidumbre:-1,
  presión:-1, polémica:-1, controversia:-1, disputa:-1, fricción:-1,
  // English
  difficult:-1, uncertain:-1, slow:-1, weak:-1, concern:-1,

  // ── Negative (-2) ────────────────────────────────────────────────────────
  malo:-2, mal:-2, peor:-2, problema:-2, fracaso:-2, crisis:-2,
  fallo:-2, error:-2, riesgo:-2, amenaza:-2, daño:-2, pérdida:-2,
  pérdidas:-2, deuda:-2, caída:-2, declive:-2, rechazo:-2, negativo:-2,
  conflicto:-2, crítica:-2, acusación:-2, investigación:-2,
  ilegal:-2, escándalo:-2, fraude:-2, corrupción:-2, manipulación:-2,
  irregularidad:-2, irregularidades:-2, incumplimiento:-2, impago:-2,
  insolvencia:-2, déficit:-2, quiebra:-2, embargado:-2, sanción:-2,
  sanciones:-2, multa:-2, multas:-2, expediente:-2, denuncia:-2,
  denuncias:-2, culpable:-2, responsable:-2, engaño:-2, mentira:-2,
  falta:-2, carencia:-2, ausencia:-2, abandono:-2, ruptura:-2,
  bloqueo:-2, paralización:-2, colapso:-2, deterioro:-2, agravamiento:-2,
  preocupación:-2, alarma:-2, alerta:-2, crítico:-2,
  // Journalistic negative verbs
  denunció:-2, acusó:-2, rechazó:-2, condenó:-2, advirtió:-2,
  alertó:-2, criticó:-2, cuestionó:-2, protestó:-2, exigió:-2,
  denunciaron:-2, acusaron:-2, rechazaron:-2, exigieron:-2,
  // English
  bad:-2, worse:-2, problem:-2, failure:-2, risk:-2, loss:-2,
  debt:-2, scandal:-2, fraud:-2, crisis:-2, illegal:-2, accused:-2,

  // ── Very negative (-3) ────────────────────────────────────────────────────
  terrible:-3, catastrófico:-3, horrible:-3, devastador:-3, fatal:-3,
  nefasto:-3, desastre:-3, catástrofe:-3, ruina:-3, estafa:-3,
  criminalidad:-3, delito:-3, crimen:-3, colusión:-3, malversación:-3,
  prevaricación:-3, corruptor:-3, corrupto:-3, ilegítimo:-3, ilícito:-3,
  // English
  disaster:-3, catastrophic:-3, terrible:-3, fraud:-3, corruption:-3,
};

// ── Intensifiers (multiply score × 1.6) ───────────────────────────────────
const INTENSIFIERS = new Set([
  'muy','bastante','sumamente','extremadamente','totalmente','completamente',
  'absolutamente','profundamente','gravemente','seriamente','enormemente',
  'fuertemente','ampliamente','especialmente','particularmente','altamente',
  'notablemente','marcadamente','significativamente','considerablemente',
  'tremendamente','inmensamente','sobremanera',
  // English
  'very','extremely','highly','severely','deeply','utterly','totally',
]);

// ── Negators (invert score within window) ─────────────────────────────────
const NEGATORS = new Set([
  'no','ni','nunca','jamás','tampoco','sin','nada','nadie','ningún',
  'ninguno','ninguna','nunca','difícilmente','apenas','imposible',
  // English
  'no','not','never','without','nor','neither',
]);

// ── Analysis ───────────────────────────────────────────────────────────────

/**
 * Score a single paragraph on [-100, +100]
 */
function scoreParagraph(text) {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 5) return 0; // too short to be meaningful

  let rawScore = 0;

  for (let i = 0; i < words.length; i++) {
    const baseScore = LEXICON[words[i]];
    if (baseScore === undefined) continue;

    let multiplier = 1;

    // Intensifier window: 2 words before
    for (let j = Math.max(0, i - 2); j < i; j++) {
      if (INTENSIFIERS.has(words[j])) { multiplier *= 1.6; break; }
    }

    // Negator window: 3 words before
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(words[j])) { negated = true; break; }
    }
    if (negated) multiplier *= -1;

    rawScore += baseScore * multiplier;
  }

  // Normalize: divide by √wordCount so long paragraphs don't dominate
  const normalized = rawScore / Math.sqrt(words.length);

  // Scale to [-100, +100] — factor 15 is empirically calibrated for news text
  return Math.max(-100, Math.min(100, Math.round(normalized * 15)));
}

/**
 * Smooth an array of scores with a simple moving average
 */
function smooth(scores, window = 2) {
  return scores.map((_, i) => {
    const lo = Math.max(0, i - window);
    const hi = Math.min(scores.length - 1, i + window);
    const slice = scores.slice(lo, hi + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  });
}

/**
 * Analyze sentiment arc across all paragraphs
 * @param {string[]} paragraphs
 * @returns {{ scores: number[], average: number, arc: 'rising'|'falling'|'flat'|'volatile' }}
 */
export function analyzeSentiment(paragraphs) {
  if (!paragraphs.length) return { scores: [], average: 0, arc: 'flat' };

  const rawScores = paragraphs.map(scoreParagraph);
  const scores    = smooth(rawScores);

  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Detect arc shape
  const first = scores.slice(0, Math.ceil(scores.length / 3));
  const last  = scores.slice(Math.floor(scores.length * 2 / 3));
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const lastAvg  = last.reduce((a, b) => a + b, 0) / last.length;

  const variance = scores.reduce((acc, s) => acc + Math.pow(s - average, 2), 0) / scores.length;
  const stdDev   = Math.sqrt(variance);

  let arc;
  if (stdDev > 35)                    arc = 'volatile';
  else if (lastAvg - firstAvg > 15)   arc = 'rising';
  else if (firstAvg - lastAvg > 15)   arc = 'falling';
  else                                arc = 'flat';

  return { scores, average, arc };
}
