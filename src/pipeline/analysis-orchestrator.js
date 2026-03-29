import { analyze } from '../analyzer.js';
import { translateExtracted } from '../translator.js';
import { aiAnalyze } from '../ai-analyzer.js';
import { fetchComparativeCoverage } from '../comparative-coverage.js';

export async function runAnalysisPipeline({
  extracted,
  sourceLanguage = 'auto',
  outputLanguage = 'auto',
  semanticConfig = {},
  translationConfig = {},
  comparativeConfig = {},
  onStage = () => {},
} = {}) {
  onStage({ layer: 'extraction', state: 'running' });

  const baseAnalysis = analyze(extracted, {
    sourceLanguage: sourceLanguage === 'auto' ? null : sourceLanguage,
  });

  const articleLanguage =
    baseAnalysis.capa_semantica?.articleLanguage ||
    baseAnalysis.capa_semantica?.detectedArticleLanguage ||
    'unknown';

  const extractionLayer = buildExtractionLayer(extracted, baseAnalysis, articleLanguage);
  onStage({ layer: 'extraction', state: extractionLayer.status, detail: extractionLayer });

  const localLayer = buildLocalLayer(baseAnalysis);
  onStage({ layer: 'local', state: localLayer.status, detail: localLayer });

  const needsTranslation = shouldTranslateContent(articleLanguage, outputLanguage);
  let translationLayer = buildTranslationSkippedLayer({
    articleLanguage,
    outputLanguage,
    enabled: translationConfig?.enabled,
    needed: needsTranslation,
  });
  let translatedExtracted = null;
  let translatedAnalysis = null;

  if (needsTranslation && translationConfig?.enabled) {
    onStage({ layer: 'translation', state: 'running' });
    translationLayer = await translateExtracted(extracted, {
      ...translationConfig,
      enabled: true,
      sourceLanguage: articleLanguage,
      outputLanguage,
    });

    if (translationLayer.available && translationLayer.translatedExtracted) {
      translatedExtracted = translationLayer.translatedExtracted;
      translatedAnalysis = analyze(translatedExtracted, {
        sourceLanguage: outputLanguage,
      });
    }

    onStage({ layer: 'translation', state: translationLayer.status, detail: translationLayer });
  } else {
    onStage({ layer: 'translation', state: translationLayer.status, detail: translationLayer });
  }

  let semanticLayer = buildSemanticSkippedLayer({
    enabled: semanticConfig?.enabled,
    articleLanguage,
    outputLanguage,
    translationLayer,
  });

  if (semanticConfig?.enabled) {
    onStage({ layer: 'semantic', state: 'running' });
    const semanticInput = translatedExtracted || extracted;
    semanticLayer = await aiAnalyze(semanticInput, {
      ...semanticConfig,
      enabled: true,
      sourceLanguage: translatedExtracted ? outputLanguage : articleLanguage,
      outputLanguage,
      articleLanguage,
      translationLayer,
      extractionLayer,
    });
    onStage({ layer: 'semantic', state: semanticLayer.status, detail: semanticLayer });
  } else {
    onStage({ layer: 'semantic', state: semanticLayer.status, detail: semanticLayer });
  }

  const comparativeCoverage = await fetchComparativeCoverage(
    { ...baseAnalysis, url: extracted.url || '' },
    comparativeConfig
  );

  const finalLayer = buildFinalLayer({
    extractionLayer,
    localLayer,
    translationLayer,
    semanticLayer,
    articleLanguage,
    outputLanguage,
  });

  onStage({ layer: 'final', state: finalLayer.status, detail: finalLayer });

  return {
    ...baseAnalysis,
    capa_extraccion: extractionLayer,
    capa_local: localLayer,
    capa_traduccion: buildTranslationSnapshot(translationLayer, translatedAnalysis),
    capa_semantica_ai: semanticLayer,
    cobertura_comparativa: comparativeCoverage,
    pipeline: {
      articleLanguage,
      outputLanguage,
      layers: {
        extraction: extractionLayer,
        local: localLayer,
        translation: translationLayer,
        semantic: semanticLayer,
        final: finalLayer,
      },
    },
  };
}

export function shouldTranslateContent(sourceLanguage, targetLanguage) {
  const source = normalizeLang(sourceLanguage);
  const target = normalizeLang(targetLanguage);
  if (!target || target === 'auto') return false;
  if (!source || source === 'unknown' || source === 'auto') return true;
  return source !== target;
}

function buildExtractionLayer(extracted, baseAnalysis, articleLanguage) {
  const paragraphCount = extracted?.paragraphs?.length || 0;
  const headingCount = extracted?.headings?.length || 0;
  const quoteCount = extracted?.quotes?.length || 0;
  const linkCount = extracted?.links?.length || 0;
  const extractionConfidence = baseAnalysis?.capa_semantica?.extractionConfidence || 'low';
  const partial = extractionConfidence !== 'high';
  const fragile = paragraphCount < 3 || !extracted?.meta?.title;

  return {
    available: true,
    status: partial ? 'partial' : 'ready',
    coverage: extractionConfidence,
    confidence: extractionConfidence,
    partial,
    fragile,
    articleLanguage,
    signals: {
      title: Boolean(extracted?.meta?.title),
      author: Boolean(extracted?.meta?.author),
      date: Boolean(extracted?.meta?.date),
      headings: headingCount,
      paragraphs: paragraphCount,
      quotes: quoteCount,
      links: linkCount,
    },
    reason: partial
      ? 'Extraction is usable but incomplete.'
      : 'Extraction captured enough structure for layered analysis.',
    actionable: partial
      ? 'Retry on fully loaded pages or pages with delayed content.'
      : '',
  };
}

function buildLocalLayer(baseAnalysis) {
  const extractionConfidence = baseAnalysis?.capa_semantica?.extractionConfidence || 'low';
  const localConfidence = baseAnalysis?.capa_semantica?.localConfidence || 'low';
  const eio = baseAnalysis?.analisis_lexico?.eioProfile || {};

  return {
    available: true,
    status: extractionConfidence === 'low' ? 'partial' : 'ready',
    coverage: localConfidence,
    confidence: localConfidence,
    reason: extractionConfidence === 'low'
      ? 'Local signals are available with limited extraction confidence.'
      : 'Local structural analysis completed without network dependencies.',
    metrics: {
      evidenceRatio: eio.evidence ?? null,
      interpretationRatio: eio.interpretation ?? null,
      opinionRatio: eio.opinion ?? null,
      quoteDensity: baseAnalysis?.estructura?.quoteRatio ?? null,
      attributionPresence: baseAnalysis?.anatomia_fuentes?.named ?? 0,
      outgoingLinks: baseAnalysis?.fuentes?.external ?? 0,
      sentenceComplexity: baseAnalysis?.analisis_lexico?.sentenceLengthScore ?? null,
      lexicalRepetition: baseAnalysis?.analisis_lexico?.repetitionScore ?? null,
      rhetoricalSignals: baseAnalysis?.marcos_narrativos?.frames?.slice(0, 3) || [],
    },
  };
}

function buildTranslationSkippedLayer({ articleLanguage, outputLanguage, enabled, needed }) {
  if (!needed) {
    return {
      available: false,
      executed: false,
      needed: false,
      status: 'direct',
      coverage: 'native',
      sourceLanguage: articleLanguage,
      outputLanguage,
      reason: 'Translation not needed.',
      actionable: '',
    };
  }

  if (!enabled) {
    return {
      available: false,
      executed: false,
      needed: true,
      status: 'disabled',
      coverage: 'none',
      sourceLanguage: articleLanguage,
      outputLanguage,
      reason: 'Translation layer disabled.',
      actionable: 'Enable translation to generate output in the selected language.',
    };
  }

  return {
    available: false,
    executed: false,
    needed: true,
    status: 'pending',
    coverage: 'none',
    sourceLanguage: articleLanguage,
    outputLanguage,
    reason: '',
    actionable: '',
  };
}

function buildSemanticSkippedLayer({ enabled, articleLanguage, outputLanguage, translationLayer }) {
  if (!enabled) {
    return {
      available: false,
      executed: false,
      status: 'disabled',
      coverage: 'none',
      reason: 'Semantic layer disabled.',
      actionable: 'Enable semantic analysis and configure a provider.',
      sourceLanguage: articleLanguage,
      outputLanguage,
    };
  }

  return {
    available: false,
    executed: false,
    status: 'pending',
    coverage: 'none',
    reason: translationLayer?.status === 'failed'
      ? 'Semantic layer will continue without translated input.'
      : '',
    actionable: '',
    sourceLanguage: articleLanguage,
    outputLanguage,
  };
}

function buildTranslationSnapshot(translationLayer, translatedAnalysis) {
  if (!translationLayer) {
    return {
      available: false,
      status: 'disabled',
      coverage: 'none',
    };
  }

  return {
    available: Boolean(translationLayer.available),
    executed: Boolean(translationLayer.executed),
    needed: Boolean(translationLayer.needed),
    status: translationLayer.status || 'disabled',
    coverage: translationLayer.coverage || 'none',
    provider: translationLayer.provider || null,
    sourceLanguage: translationLayer.sourceLanguage || null,
    outputLanguage: translationLayer.outputLanguage || null,
    reason: translationLayer.reason || '',
    actionable: translationLayer.actionable || '',
    translatedTitle: translationLayer.translatedExtracted?.meta?.title || '',
    translatedFocusTerms: translatedAnalysis?.capa_semantica?.focusTerms || [],
    translatedEntities: translatedAnalysis?.entidades_detectadas || [],
  };
}

function buildFinalLayer({ extractionLayer, localLayer, translationLayer, semanticLayer, articleLanguage, outputLanguage }) {
  const translated = Boolean(translationLayer?.available);
  const semantic = Boolean(semanticLayer?.available);
  const extractionWeak = extractionLayer?.status === 'partial';

  let mode = 'local';
  if (semantic && translated) mode = 'hybrid';
  else if (semantic) mode = 'semantic';
  else if (translated) mode = 'translated';

  let status = 'ready';
  if (semanticLayer?.status === 'partial' || translationLayer?.status === 'partial' || extractionWeak) {
    status = 'partial';
  }
  if (!semantic && !translated && articleLanguage !== 'unknown' && outputLanguage !== 'auto' && articleLanguage !== outputLanguage) {
    status = 'limited';
  }

  return {
    available: true,
    status,
    mode,
    translated,
    semantic,
    local: Boolean(localLayer?.available),
    limited: status === 'limited',
    partial: status === 'partial',
    reason: describeFinalReason(mode, status),
  };
}

function describeFinalReason(mode, status) {
  if (status === 'limited') return 'Final reading map relies on local signals only and stays limited across languages.';
  if (status === 'partial') return 'Final reading map combines available layers with partial coverage.';
  if (mode === 'hybrid') return 'Final reading map combines local, translated and semantic layers.';
  if (mode === 'semantic') return 'Final reading map combines local and semantic layers.';
  if (mode === 'translated') return 'Final reading map combines local and translated layers.';
  return 'Final reading map is local-first.';
}

function normalizeLang(value) {
  if (!value) return null;
  return String(value).toLowerCase().replace('_', '-').split('-')[0] || null;
}
