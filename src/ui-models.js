/**
 * BiasMapper - UI model transformer.
 */

const SUPPORTED_LOCALES = ['es', 'en', 'ja', 'fr', 'de', 'pt', 'it'];

const COPY = {
  es: {
    untitled: '(sin titulo)',
    by: 'Por',
    join: ' · ',
    chartTermsDataset: 'Frecuencia',
    chartTermsMentions: 'apariciones',
    chartProfileDataset: 'Perfil',
    lexicalResourcesTitle: 'Recursos de escritura',
    lexicalResourcesNote: 'Señales de cómo se construye el texto. La barra combina presencia e intensidad relativa.',
    lexicalResourceLabels: {
      adverbs: 'Adverbios',
      idioms: 'Frases hechas',
      modalizers: 'Modalizadores',
      passive: 'Pasiva',
    },
    chartSentimentAverage: 'Media',
    chartSentimentSeries: 'Cadencia',
    chartSentimentParagraph: 'Párrafo',
    chartSentimentPositive: 'baja',
    chartSentimentNeutral: 'media',
    chartSentimentCharged: 'alta',
    chartSentimentStart: 'Inicio',
    chartSentimentPeak: 'Pico',
    chartSentimentEnd: 'Cierre',
    radarLabels: ['Adj.', 'Repeticion', 'Complejidad', 'Fuentes', 'Citas'],
    sentimentStable: 'estable',
    sentimentRising: 'más intensa al cierre',
    sentimentFalling: 'más intensa al inicio',
    sentimentVolatile: 'irregular',
    tonePositive: 'baja',
    toneNeutral: 'media',
    toneCharged: 'alta',
    noEntities: 'No se detectaron entidades con mas de una mencion.',
    noSources: 'No se detectaron fuentes externas.',
    unknownLanguage: 'desconocido',
    semanticAiReady: 'Resumen semantico asistido disponible',
    semanticAiPartial: 'Resumen semantico parcial',
    semanticAiUnavailable: 'Sin capa semantica asistida',
    semanticNeedTranslation: '',
    semanticHeuristicLabel: 'Mapa local basado en señales estructurales',
    extractionWeak: 'La extraccion parece incompleta: interpreta este mapa con cautela y reintenta si el medio carga contenido de forma diferida.',
    topicUnknown: 'Todavía no puedo identificar con fiabilidad el foco principal del artículo.',
    sourceLanguageMismatch: 'El idioma forzado no coincide con el idioma detectado del articulo.',
    limitedMode: 'Resumen limitado por las señales estructurales disponibles.',
    summaryModeLocal: 'local',
    summaryModeSemantic: 'semantico',
    summaryModeHybrid: 'hibrido',
    summaryTranslationDirect: 'directo',
    summaryTranslationReady: 'traducido',
    summaryTranslationPartial: 'parcial',
    summaryTranslationUnavailable: 'no traducido',
    provenanceLocal: 'local',
    provenanceSemantic: 'semantica',
    provenanceHybrid: 'hibrido',
    confidenceLow: 'confianza baja',
    confidenceMedium: 'confianza media',
    confidenceHigh: 'confianza alta',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `Vas a entrar en un texto ${articleType} sobre ${focus}. Reserva unos ${readingTimeMin} min para recorrerlo con contexto.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount} parrafos y ${formatNumber(wordCount, 'es')} palabras.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `El foco tematico gira en torno a ${focus}, con presencia visible de ${entities}.`
        : `El foco tematico gira en torno a ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: ${external} fuentes externas y ${quotes} citas detectadas.`,
    readingMapTone: ({ tone, motion }) =>
      `La cadencia general se mantiene ${motion}, con una intensidad media ${tone}.`,
    articleLanguageLabel: ({ language }) => `Idioma detectado del artículo: ${language}`,
    structureBrief: 'breve',
    structureStandard: 'de longitud media',
    structureDeep: 'profundo',
    evidenceLight: 'Base de apoyo ligera',
    evidenceMixed: 'Base de apoyo mixta',
    evidenceRich: 'Base de apoyo amplia',
  },
  en: {
    untitled: '(untitled)',
    by: 'By',
    join: ' · ',
    chartTermsDataset: 'Frequency',
    chartTermsMentions: 'mentions',
    chartProfileDataset: 'Profile',
    lexicalResourcesTitle: 'Writing devices',
    lexicalResourcesNote: 'Signals showing how the text is written. The bar combines presence and relative intensity.',
    lexicalResourceLabels: {
      adverbs: 'Adverbs',
      idioms: 'Set phrases',
      modalizers: 'Modalizers',
      passive: 'Passive voice',
    },
    chartSentimentAverage: 'Average',
    chartSentimentSeries: 'Sentiment',
    chartSentimentParagraph: 'Paragraph',
    chartSentimentPositive: 'positive',
    chartSentimentNeutral: 'neutral',
    chartSentimentCharged: 'charged',
    chartSentimentStart: 'Start',
    chartSentimentPeak: 'Peak',
    chartSentimentEnd: 'End',
    radarLabels: ['Adj.', 'Repetition', 'Complexity', 'Sources', 'Quotes'],
    sentimentStable: 'steady',
    sentimentRising: 'rising',
    sentimentFalling: 'falling',
    sentimentVolatile: 'volatile',
    tonePositive: 'positive',
    toneNeutral: 'neutral',
    toneCharged: 'charged',
    noEntities: 'No entities with more than one mention were detected.',
    noSources: 'No external sources were detected.',
    unknownLanguage: 'unknown',
    semanticAiReady: 'AI semantic overview available',
    semanticAiPartial: 'Partial semantic overview',
    semanticAiUnavailable: 'No assisted semantic layer',
    semanticNeedTranslation: 'To know what the article is actually about in your language, enable the semantic layer and configure a multilingual model.',
    semanticHeuristicLabel: 'Provisional map based on local signals',
    extractionWeak: 'Extraction looks incomplete: treat this map cautiously and retry if the site loads content lazily.',
    topicUnknown: 'I still cannot say what it is about reliably in your language.',
    sourceLanguageMismatch: 'The forced source language does not match the detected article language.',
    limitedMode: 'Summary unavailable without assisted translation.',
    summaryModeLocal: 'local',
    summaryModeSemantic: 'semantic',
    summaryModeHybrid: 'hybrid',
    summaryTranslationDirect: 'direct',
    summaryTranslationReady: 'translated',
    summaryTranslationPartial: 'partial',
    summaryTranslationUnavailable: 'not translated',
    provenanceLocal: 'local',
    provenanceSemantic: 'semantic',
    provenanceHybrid: 'hybrid',
    confidenceLow: 'low confidence',
    confidenceMedium: 'medium confidence',
    confidenceHigh: 'high confidence',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `You are about to read a ${articleType} piece about ${focus}. Set aside roughly ${readingTimeMin} min to take it in with context.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount} paragraphs and ${formatNumber(wordCount, 'en')} words.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `The thematic center stays on ${focus}, with visible attention on ${entities}.`
        : `The thematic center stays on ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: ${external} external sources and ${quotes} quoted passages detected.`,
    readingMapTone: ({ tone, motion }) =>
      `The emotional path stays ${motion}, with an overall ${tone} tone.`,
    articleLanguageLabel: ({ language }) => `Detected article language: ${language}`,
    structureBrief: 'short',
    structureStandard: 'mid-length',
    structureDeep: 'deep',
    evidenceLight: 'Light support base',
    evidenceMixed: 'Mixed support base',
    evidenceRich: 'Rich support base',
  },
  ja: {
    untitled: '(ç„¡é¡Œ)',
    by: 'è‘—è€…',
    join: ' ãƒ» ',
    chartTermsDataset: 'é »åº¦',
    chartTermsMentions: 'å›ž',
    chartProfileDataset: 'ãƒ—ãƒ­ãƒ•ã‚¡ã‚¤ãƒ«',
    chartSentimentAverage: 'å¹³å‡',
    chartSentimentSeries: 'æ„Ÿæƒ…',
    chartSentimentParagraph: 'æ®µè½',
    chartSentimentPositive: 'å‰å‘ã',
    chartSentimentNeutral: 'ä¸­ç«‹',
    chartSentimentCharged: 'å¼·ã‚',
    chartSentimentStart: 'å†’é ­',
    chartSentimentPeak: 'ãƒ”ãƒ¼ã‚¯',
    chartSentimentEnd: 'çµã³',
    radarLabels: ['å½¢å®¹', 'åå¾©', 'è¤‡é›‘ã•', 'æƒ…å ±æº', 'å¼•ç”¨'],
    sentimentStable: 'å®‰å®š',
    sentimentRising: 'ä¸Šå‘ã',
    sentimentFalling: 'ä¸‹å‘ã',
    sentimentVolatile: 'å¤‰å‹•å¤§',
    tonePositive: 'å‰å‘ã',
    toneNeutral: 'ä¸­ç«‹',
    toneCharged: 'å¼·ã‚',
    noEntities: 'è¤‡æ•°å›žç™»å ´ã™ã‚‹å›ºæœ‰åè©žã¯è¦‹ã¤ã‹ã‚Šã¾ã›ã‚“ã§ã—ãŸã€‚',
    noSources: 'å¤–éƒ¨ã‚½ãƒ¼ã‚¹ã¯æ¤œå‡ºã•ã‚Œã¾ã›ã‚“ã§ã—ãŸã€‚',
    unknownLanguage: 'ä¸æ˜Ž',
    semanticAiReady: 'AIè¦ç´„ã‚ã‚Š',
    semanticAiUnavailable: 'æ„å‘³ãƒ¬ã‚¤ãƒ¤ãƒ¼ãªã—',
    semanticNeedTranslation: 'å†…å®¹ã‚’ã‚ãªãŸã®è¨€èªžã§æœ¬å½“ã«æŠŠæ¡ã—ãŸã„å ´åˆã¯ã€æ„å‘³ãƒ¬ã‚¤ãƒ¤ãƒ¼ã‚’æœ‰åŠ¹ã«ã—ã¦å¤šè¨€èªžãƒ¢ãƒ‡ãƒ«ã‚’è¨­å®šã—ã¦ãã ã•ã„ã€‚',
    semanticHeuristicLabel: 'ãƒ­ãƒ¼ã‚«ãƒ«ä¿¡å·ãƒ™ãƒ¼ã‚¹ã®æš«å®šãƒžãƒƒãƒ—',
    extractionWeak: 'Ã¦Å Â½Ã¥â€¡ÂºÃ£ÂÅ’Ã¤Â¸ÂÃ¥Â®Å’Ã¥â€¦Â¨Ã£ÂÂ®Ã¥ÂÂ¯Ã¨Æ’Â½Ã¦â‚¬Â§Ã£ÂÅ’Ã£Ââ€šÃ£â€šÅ Ã£ÂÂ¾Ã£Ââ„¢Ã£â‚¬â€šÃ©Ââ€¦Ã¥Â»Â¶Ã¨ÂªÂ­Ã£ÂÂ¿Ã¨Â¾Â¼Ã£ÂÂ¿Ã£ÂÂ®Ã£â€šÂµÃ£â€šÂ¤Ã£Æ’Ë†Ã£ÂÂ§Ã£ÂÂ¯Ã¥â€ ÂÃ¨Â©Â¦Ã¨Â¡Å’Ã£Ââ€”Ã£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£Ââ€¢Ã£Ââ€žÃ£â‚¬â€š',
    provenanceLocal: 'local',
    provenanceHybrid: 'hybrid',
    confidenceLow: 'low confidence',
    confidenceMedium: 'medium confidence',
    confidenceHigh: 'high confidence',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `${focus}ã‚’æ‰±ã†${articleType}ãªè¨˜äº‹ã§ã™ã€‚å…¨ä½“åƒã‚’ã¤ã‹ã¿ãªãŒã‚‰èª­ã‚€ãªã‚‰ç´„${readingTimeMin}åˆ†ã‚’è¦‹ã¦ãŠãã¨ã‚ˆã•ãã†ã§ã™ã€‚`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount}æ®µè½ã€${formatNumber(wordCount, 'ja')}èªžã€‚`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `ä¸»é¡Œã¯${focus}ã§ã€${entities}ãŒç›®ç«‹ã¡ã¾ã™ã€‚`
        : `ä¸»é¡Œã¯${focus}ã§ã™ã€‚`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: å¤–éƒ¨ã‚½ãƒ¼ã‚¹${external}ä»¶ã€å¼•ç”¨${quotes}ä»¶ã‚’ç¢ºèªã—ã¾ã—ãŸã€‚`,
    readingMapTone: ({ tone, motion }) =>
      `æ„Ÿæƒ…ã®æµã‚Œã¯${motion}ã€å…¨ä½“ã®ãƒˆãƒ¼ãƒ³ã¯${tone}ã§ã™ã€‚`,
    articleLanguageLabel: ({ language }) => `æ¤œå‡ºã—ãŸè¨˜äº‹è¨€èªž: ${language}`,
    structureBrief: 'çŸ­ã‚',
    structureStandard: 'æ¨™æº–',
    structureDeep: 'é•·ã‚',
    evidenceLight: 'æ ¹æ‹ ã¯è»½ã‚',
    evidenceMixed: 'æ ¹æ‹ ã¯ä¸­ç¨‹åº¦',
    evidenceRich: 'æ ¹æ‹ ã¯åŽšã‚',
  },
  fr: {
    untitled: '(sans titre)',
    by: 'Par',
    chartTermsDataset: 'FrÃ©quence',
    chartTermsMentions: 'fois',
    chartProfileDataset: 'Profil',
    chartSentimentAverage: 'Moyenne',
    chartSentimentSeries: 'Sentiment',
    chartSentimentParagraph: 'Paragraphe',
    chartSentimentPositive: 'positif',
    chartSentimentNeutral: 'neutre',
    chartSentimentCharged: 'chargÃ©',
    radarLabels: ['Adj.', 'RÃ©pÃ©tition', 'ComplexitÃ©', 'Sources', 'Citations'],
    sentimentStable: 'stable',
    sentimentRising: 'en hausse',
    sentimentFalling: 'en baisse',
    sentimentVolatile: 'volatil',
    tonePositive: 'positif',
    toneNeutral: 'neutre',
    toneCharged: 'chargÃ©',
    noEntities: 'Aucune entitÃ© mentionnÃ©e plusieurs fois.',
    noSources: 'Aucune source externe dÃ©tectÃ©e.',
    unknownLanguage: 'inconnu',
    semanticAiReady: 'AperÃ§u sÃ©mantique disponible',
    semanticAiPartial: 'AperÃ§u sÃ©mantique partiel',
    semanticAiUnavailable: 'Pas de couche sÃ©mantique',
    semanticNeedTranslation: "Pour comprendre l'article dans votre langue, activez la couche sÃ©mantique.",
    semanticHeuristicLabel: 'Carte provisoire basÃ©e sur des signaux locaux',
    extractionWeak: "L'extraction semble incomplÃ¨te : interprÃ©tez cette carte avec prudence.",
    topicUnknown: "Je ne peux pas encore dire de quoi il s'agit dans votre langue.",
    limitedMode: 'RÃ©sumÃ© indisponible sans traduction assistÃ©e.',
    summaryModeLocal: 'local',
    summaryModeSemantic: 'sÃ©mantique',
    summaryModeHybrid: 'hybride',
    summaryTranslationDirect: 'direct',
    summaryTranslationReady: 'traduit',
    summaryTranslationPartial: 'partiel',
    summaryTranslationUnavailable: 'non traduit',
    provenanceLocal: 'local',
    provenanceSemantic: 'sÃ©mantique',
    provenanceHybrid: 'hybride',
    confidenceLow: 'faible confiance',
    confidenceMedium: 'confiance moyenne',
    confidenceHigh: 'grande confiance',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `Vous vous apprÃªtez Ã  lire un article ${articleType} sur ${focus}. Comptez environ ${readingTimeMin} min.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel} : ${paragraphCount} paragraphes et ${formatNumber(wordCount, 'fr')} mots.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `Le centre thÃ©matique tourne autour de ${focus}, avec ${entities} en Ã©vidence.`
        : `Le centre thÃ©matique est ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel} : ${external} sources externes et ${quotes} citations.`,
    readingMapTone: ({ tone, motion }) =>
      `La trajectoire Ã©motionnelle reste ${motion}, avec un ton gÃ©nÃ©ral ${tone}.`,
    articleLanguageLabel: ({ language }) => `Langue dÃ©tectÃ©e : ${language}`,
    structureBrief: 'court',
    structureStandard: 'de longueur moyenne',
    structureDeep: 'approfondi',
    evidenceLight: 'Peu de sources',
    evidenceMixed: 'Sources mixtes',
    evidenceRich: 'Sources abondantes',
  },
  de: {
    untitled: '(ohne Titel)',
    by: 'Von',
    chartTermsDataset: 'HÃ¤ufigkeit',
    chartTermsMentions: 'Mal',
    chartProfileDataset: 'Profil',
    chartSentimentAverage: 'Durchschnitt',
    chartSentimentSeries: 'Stimmung',
    chartSentimentParagraph: 'Absatz',
    chartSentimentPositive: 'positiv',
    chartSentimentNeutral: 'neutral',
    chartSentimentCharged: 'geladen',
    radarLabels: ['Adj.', 'Wiederholung', 'KomplexitÃ¤t', 'Quellen', 'Zitate'],
    sentimentStable: 'stabil',
    sentimentRising: 'steigend',
    sentimentFalling: 'fallend',
    sentimentVolatile: 'volatil',
    tonePositive: 'positiv',
    toneNeutral: 'neutral',
    toneCharged: 'geladen',
    noEntities: 'Keine EntitÃ¤ten mit mehr als einer ErwÃ¤hnung gefunden.',
    noSources: 'Keine externen Quellen gefunden.',
    unknownLanguage: 'unbekannt',
    semanticAiReady: 'KI-Ãœbersicht verfÃ¼gbar',
    semanticAiPartial: 'Teilweise KI-Ãœbersicht',
    semanticAiUnavailable: 'Keine semantische Schicht',
    semanticNeedTranslation: 'Aktiviere die semantische Schicht, um den Artikel in deiner Sprache zu verstehen.',
    semanticHeuristicLabel: 'VorlÃ¤ufige Karte basierend auf lokalen Signalen',
    extractionWeak: 'Die Extraktion scheint unvollstÃ¤ndig â€“ interpretiere diese Karte mit Vorsicht.',
    topicUnknown: 'Ich kann noch nicht zuverlÃ¤ssig sagen, worum es geht.',
    limitedMode: 'Zusammenfassung ohne Ãœbersetzung nicht verfÃ¼gbar.',
    summaryModeLocal: 'lokal',
    summaryModeSemantic: 'semantisch',
    summaryModeHybrid: 'hybrid',
    summaryTranslationDirect: 'direkt',
    summaryTranslationReady: 'Ã¼bersetzt',
    summaryTranslationPartial: 'teilweise',
    summaryTranslationUnavailable: 'nicht Ã¼bersetzt',
    provenanceLocal: 'lokal',
    provenanceSemantic: 'semantisch',
    provenanceHybrid: 'hybrid',
    confidenceLow: 'niedrige Konfidenz',
    confidenceMedium: 'mittlere Konfidenz',
    confidenceHigh: 'hohe Konfidenz',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `Sie lesen gleich einen ${articleType} Artikel Ã¼ber ${focus}. Planen Sie etwa ${readingTimeMin} Min ein.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount} AbsÃ¤tze und ${formatNumber(wordCount, 'de')} WÃ¶rter.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `Das Thema dreht sich um ${focus}, mit ${entities} im Fokus.`
        : `Das zentrale Thema ist ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: ${external} externe Quellen und ${quotes} Zitate.`,
    readingMapTone: ({ tone, motion }) =>
      `Der emotionale Verlauf bleibt ${motion}, mit einem insgesamt ${tone}en Ton.`,
    articleLanguageLabel: ({ language }) => `Erkannte Sprache: ${language}`,
    structureBrief: 'kurz',
    structureStandard: 'mittellang',
    structureDeep: 'ausfÃ¼hrlich',
    evidenceLight: 'Wenig Belege',
    evidenceMixed: 'Gemischte Belege',
    evidenceRich: 'Viele Belege',
  },
  pt: {
    untitled: '(sem tÃ­tulo)',
    by: 'Por',
    chartTermsDataset: 'FrequÃªncia',
    chartTermsMentions: 'vezes',
    chartProfileDataset: 'Perfil',
    chartSentimentAverage: 'MÃ©dia',
    chartSentimentSeries: 'Sentimento',
    chartSentimentParagraph: 'ParÃ¡grafo',
    chartSentimentPositive: 'positivo',
    chartSentimentNeutral: 'neutro',
    chartSentimentCharged: 'carregado',
    radarLabels: ['Adj.', 'RepetiÃ§Ã£o', 'Complexidade', 'Fontes', 'CitaÃ§Ãµes'],
    sentimentStable: 'estÃ¡vel',
    sentimentRising: 'crescente',
    sentimentFalling: 'decrescente',
    sentimentVolatile: 'volÃ¡til',
    tonePositive: 'positivo',
    toneNeutral: 'neutro',
    toneCharged: 'carregado',
    noEntities: 'Nenhuma entidade com mais de uma menÃ§Ã£o detectada.',
    noSources: 'Nenhuma fonte externa detectada.',
    unknownLanguage: 'desconhecido',
    semanticAiReady: 'Resumo semÃ¢ntico disponÃ­vel',
    semanticAiPartial: 'Resumo semÃ¢ntico parcial',
    semanticAiUnavailable: 'Sem camada semÃ¢ntica',
    semanticNeedTranslation: 'Para entender o artigo no seu idioma, ative a camada semÃ¢ntica.',
    semanticHeuristicLabel: 'Mapa provisÃ³rio baseado em sinais locais',
    extractionWeak: 'A extraÃ§Ã£o parece incompleta â€” interprete este mapa com cautela.',
    topicUnknown: 'Ainda nÃ£o consigo dizer sobre o que se trata no seu idioma.',
    limitedMode: 'Resumo indisponÃ­vel sem traduÃ§Ã£o assistida.',
    summaryModeLocal: 'local',
    summaryModeSemantic: 'semÃ¢ntico',
    summaryModeHybrid: 'hÃ­brido',
    summaryTranslationDirect: 'direto',
    summaryTranslationReady: 'traduzido',
    summaryTranslationPartial: 'parcial',
    summaryTranslationUnavailable: 'nÃ£o traduzido',
    provenanceLocal: 'local',
    provenanceSemantic: 'semÃ¢ntico',
    provenanceHybrid: 'hÃ­brido',
    confidenceLow: 'baixa confianÃ§a',
    confidenceMedium: 'confianÃ§a mÃ©dia',
    confidenceHigh: 'alta confianÃ§a',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `VocÃª estÃ¡ prestes a ler um texto ${articleType} sobre ${focus}. Reserve cerca de ${readingTimeMin} min.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount} parÃ¡grafos e ${formatNumber(wordCount, 'pt')} palavras.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `O foco temÃ¡tico gira em torno de ${focus}, com ${entities} em destaque.`
        : `O foco temÃ¡tico Ã© ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: ${external} fontes externas e ${quotes} citaÃ§Ãµes.`,
    readingMapTone: ({ tone, motion }) =>
      `O percurso emocional permanece ${motion}, com um tom geral ${tone}.`,
    articleLanguageLabel: ({ language }) => `Idioma detectado: ${language}`,
    structureBrief: 'breve',
    structureStandard: 'de comprimento mÃ©dio',
    structureDeep: 'aprofundado',
    evidenceLight: 'Poucas fontes',
    evidenceMixed: 'Fontes mistas',
    evidenceRich: 'Fontes abundantes',
  },
  it: {
    untitled: '(senza titolo)',
    by: 'Di',
    chartTermsDataset: 'Frequenza',
    chartTermsMentions: 'volte',
    chartProfileDataset: 'Profilo',
    chartSentimentAverage: 'Media',
    chartSentimentSeries: 'Sentiment',
    chartSentimentParagraph: 'Paragrafo',
    chartSentimentPositive: 'positivo',
    chartSentimentNeutral: 'neutro',
    chartSentimentCharged: 'carico',
    radarLabels: ['Agg.', 'Ripetizione', 'ComplessitÃ ', 'Fonti', 'Citazioni'],
    sentimentStable: 'stabile',
    sentimentRising: 'in crescita',
    sentimentFalling: 'in calo',
    sentimentVolatile: 'volatile',
    tonePositive: 'positivo',
    toneNeutral: 'neutro',
    toneCharged: 'carico',
    noEntities: 'Nessuna entitÃ  con piÃ¹ di una menzione rilevata.',
    noSources: 'Nessuna fonte esterna rilevata.',
    unknownLanguage: 'sconosciuto',
    semanticAiReady: 'Panoramica semantica disponibile',
    semanticAiPartial: 'Panoramica semantica parziale',
    semanticAiUnavailable: 'Nessun livello semantico',
    semanticNeedTranslation: "Per capire l'articolo nella tua lingua, attiva il livello semantico.",
    semanticHeuristicLabel: 'Mappa provvisoria basata su segnali locali',
    extractionWeak: "L'estrazione sembra incompleta â€” interpreta questa mappa con cautela.",
    topicUnknown: 'Non riesco ancora a dire di cosa tratta nella tua lingua.',
    limitedMode: 'Riepilogo non disponibile senza traduzione assistita.',
    summaryModeLocal: 'locale',
    summaryModeSemantic: 'semantico',
    summaryModeHybrid: 'ibrido',
    summaryTranslationDirect: 'diretto',
    summaryTranslationReady: 'tradotto',
    summaryTranslationPartial: 'parziale',
    summaryTranslationUnavailable: 'non tradotto',
    provenanceLocal: 'locale',
    provenanceSemantic: 'semantico',
    provenanceHybrid: 'ibrido',
    confidenceLow: 'bassa confidenza',
    confidenceMedium: 'confidenza media',
    confidenceHigh: 'alta confidenza',
    readingMapSummary: ({ articleType, focus, readingTimeMin }) =>
      `Stai per leggere un testo ${articleType} su ${focus}. Prevedi circa ${readingTimeMin} min.`,
    readingMapScope: ({ paragraphCount, wordCount, structureLabel }) =>
      `${structureLabel}: ${paragraphCount} paragrafi e ${formatNumber(wordCount, 'it')} parole.`,
    readingMapFocus: ({ focus, entities }) =>
      entities ? `Il centro tematico ruota attorno a ${focus}, con ${entities} in evidenza.`
        : `Il centro tematico Ã¨ ${focus}.`,
    readingMapEvidence: ({ evidenceLabel, external, quotes }) =>
      `${evidenceLabel}: ${external} fonti esterne e ${quotes} citazioni.`,
    readingMapTone: ({ tone, motion }) =>
      `Il percorso emotivo rimane ${motion}, con un tono generale ${tone}.`,
    articleLanguageLabel: ({ language }) => `Lingua rilevata: ${language}`,
    structureBrief: 'breve',
    structureStandard: 'di media lunghezza',
    structureDeep: 'approfondito',
    evidenceLight: 'Poche fonti',
    evidenceMixed: 'Fonti miste',
    evidenceRich: 'Fonti abbondanti',
  },
};

const LANGUAGE_NAMES = {
  es: { es: 'espanol', en: 'Spanish', ja: 'ã‚¹ãƒšã‚¤ãƒ³èªž', fr: 'espagnol', de: 'Spanisch', pt: 'espanhol', it: 'spagnolo' },
  en: { es: 'ingles', en: 'English', ja: 'è‹±èªž', fr: 'anglais', de: 'Englisch', pt: 'inglÃªs', it: 'inglese' },
  ja: { es: 'japones', en: 'Japanese', ja: 'æ—¥æœ¬èªž', fr: 'japonais', de: 'Japanisch', pt: 'japonÃªs', it: 'giapponese' },
  fr: { es: 'frances', en: 'French', ja: 'ãƒ•ãƒ©ãƒ³ã‚¹èªž', fr: 'franÃ§ais', de: 'FranzÃ¶sisch', pt: 'francÃªs', it: 'francese' },
  pt: { es: 'portugues', en: 'Portuguese', ja: 'ãƒãƒ«ãƒˆã‚¬ãƒ«èªž', fr: 'portugais', de: 'Portugiesisch', pt: 'portuguÃªs', it: 'portoghese' },
  it: { es: 'italiano', en: 'Italian', ja: 'ã‚¤ã‚¿ãƒªã‚¢èªž', fr: 'italien', de: 'Italienisch', pt: 'italiano', it: 'italiano' },
  de: { es: 'aleman', en: 'German', ja: 'ãƒ‰ã‚¤ãƒ„èªž', fr: 'allemand', de: 'Deutsch', pt: 'alemÃ£o', it: 'tedesco' },
  ko: { es: 'coreano', en: 'Korean', ja: 'éŸ“å›½èªž', fr: 'corÃ©en', de: 'Koreanisch', pt: 'coreano', it: 'coreano' },
  ar: { es: 'arabe', en: 'Arabic', ja: 'ã‚¢ãƒ©ãƒ“ã‚¢èªž', fr: 'arabe', de: 'Arabisch', pt: 'Ã¡rabe', it: 'arabo' },
  ru: { es: 'ruso', en: 'Russian', ja: 'ãƒ­ã‚·ã‚¢èªž', fr: 'russe', de: 'Russisch', pt: 'russo', it: 'russo' },
  zh: { es: 'chino', en: 'Chinese', ja: 'ä¸­å›½èªž', fr: 'chinois', de: 'Chinesisch', pt: 'chinÃªs', it: 'cinese' },
  hi: { es: 'hindi', en: 'Hindi', ja: 'ãƒ’ãƒ³ãƒ‡ã‚£ãƒ¼èªž', fr: 'hindi', de: 'Hindi', pt: 'hindi', it: 'hindi' },
};

export function toViewModel(data, options = {}) {
  const locale = normalizeLocale(options.locale);
  const copy = { ...COPY.en, ...(COPY[locale] || {}) };
  const {
    meta,
    url,
    estructura,
    analisis_lexico,
    fuentes,
    entidades_detectadas,
    perfil_estilo,
    sentimiento,
    capa_semantica,
    capa_traduccion,
  } = data;
  const readingMap = buildReadingMap({
    data,
    locale,
    copy,
    articleLanguage: capa_semantica?.articleLanguage || meta?.language || 'unknown',
  });
  const semanticLayer = buildSemanticLayer(data);
  const limitedMode = isLimitedMode(capa_semantica, semanticLayer, capa_traduccion, locale);
  const sourceLanguageMismatch = hasSourceLanguageMismatch(capa_semantica);

  return {
    locale,
    meta: {
      title: meta.title || copy.untitled,
      byline: buildByline(meta.author, meta.date, locale, copy),
      url,
    },
    stats: [
      { id: 'words', value: formatNumber(estructura.wordCount, locale) },
      { id: 'readTime', value: `${estructura.readingTimeMin} min` },
      { id: 'paragraphs', value: String(estructura.paragraphCount) },
      { id: 'quotes', value: String(estructura.quoteCount) },
      { id: 'links', value: String(estructura.linkCount) },
      { id: 'sentences', value: String(estructura.sentenceCount) },
      { id: 'chars', value: formatNumber(estructura.charCount, locale) },
      { id: 'headings', value: String(estructura.headingCount) },
      { id: 'avgSentence', value: `${estructura.avgSentenceWords}` },
      { id: 'avgParagraph', value: `${estructura.avgParagraphWords}` },
      { id: 'linkRatio', value: `${estructura.linkRatio}%` },
      { id: 'quoteRatio', value: `${estructura.quoteRatio}%` },
    ],
    signals: [
      {
        id: 'adjectives',
        label: copy.signalLabels?.[0] || copy.radarLabels[0],
        score: analisis_lexico.adjectiveDensity,
        level: signalLevel(analisis_lexico.adjectiveDensity),
        displayValue: formatIndexScore(analisis_lexico.adjectiveDensity),
      },
      {
        id: 'repetition',
        label: copy.signalLabels?.[1] || copy.radarLabels[1],
        score: analisis_lexico.repetitionScore,
        level: signalLevel(analisis_lexico.repetitionScore),
        displayValue: formatIndexScore(analisis_lexico.repetitionScore),
      },
      {
        id: 'sentenceLen',
        label: copy.signalLabels?.[2] || copy.radarLabels[2],
        score: analisis_lexico.sentenceLengthScore,
        level: signalLevel(analisis_lexico.sentenceLengthScore),
        displayValue: formatIndexScore(analisis_lexico.sentenceLengthScore),
      },
      ...(analisis_lexico.readabilityScore != null ? [{
        id: 'readability',
        label: copy.signalLabels?.[3] || 'Readability',
        score: analisis_lexico.readabilityScore,
        level: analisis_lexico.readabilityScore >= 65 ? 'low' : analisis_lexico.readabilityScore >= 35 ? 'mid' : 'high',
        displayValue: formatReadabilityScore(analisis_lexico.readabilityScore, locale),
      }] : []),
      {
        id: 'weasel',
        score: Math.min(100, (analisis_lexico.weaselWordCount || 0) * 12),
        level: signalLevel(Math.min(100, (analisis_lexico.weaselWordCount || 0) * 12)),
        label: copy.signalLabels?.[4] || 'Evasive language',
        displayValue: formatCountSignal(analisis_lexico.weaselWordCount || 0, locale, {
          oneEs: 'marca',
          otherEs: 'marcas',
          oneEn: 'marker',
          otherEn: 'markers',
        }),
      },
    ],
    discourseBalance: buildDiscourseBalanceSignals(analisis_lexico.eioProfile, locale),
    lexicalResources: (analisis_lexico.lexicalDevices || []).map((item) => ({
      id: item.id,
      label: copy.lexicalResourceLabels?.[item.id] || {
        adverbs: 'Adverbs',
        idioms: 'Set phrases',
        modalizers: 'Modalizers',
        passive: 'Passive voice',
      }[item.id] || item.id,
      count: item.count,
      score: item.score,
      level: signalLevel(item.score),
    })),
    topTerms: analisis_lexico.topTerms,
    entities: resolveEntitiesForLocale(data),
    entitiesChart: buildEntitiesChart(resolveEntitiesForLocale(data), locale),
    sources: fuentes.items.map((link) => ({
      text: link.text?.trim() || tryHostname(link.href),
      href: link.href,
    })),
    argumentChart: buildArgumentChart(analisis_lexico.eioProfile, locale),
    radarProfile: {
      labels: copy.radarLabels,
      values: [
        perfil_estilo.adjectiveDensity,
        perfil_estilo.repetitionScore,
        perfil_estilo.sentenceLengthScore,
        perfil_estilo.sourceRichness,
        perfil_estilo.quoteRichness,
      ],
      datasetLabel: copy.chartProfileDataset,
    },
    sentimentArc: {
      scores: sentimiento.scores,
      average: sentimiento.average,
      arc: sentimiento.arc,
      arcLabel: arcLabel(sentimiento.arc, sentimiento.average, copy, locale),
      summary: sentimentSummary(sentimiento.scores, sentimiento.average, sentimiento.arc, copy, locale),
      rail: buildSentimentRail(sentimiento.scores, copy),
      labels: {
        average: copy.chartSentimentAverage,
        sentiment: copy.chartSentimentSeries,
        paragraph: copy.chartSentimentParagraph,
        positive: copy.chartSentimentPositive,
        neutral: copy.chartSentimentNeutral,
        charged: copy.chartSentimentCharged,
        start: copy.chartSentimentStart,
        peak: copy.chartSentimentPeak,
        end: copy.chartSentimentEnd,
      },
    },
    paragraphFlowChart: buildParagraphFlowChart(data.diagnostico_parrafos, locale),
    rhetoricalFlowChart: buildRhetoricalFlowChart(data.diagnostico_parrafos, locale),
    readingMap,
    quickSummary: buildQuickSummary(readingMap, semanticLayer, capa_traduccion, copy, limitedMode),
    semanticLayer,
    pipelineBadges: buildPipelineBadges(data, locale, copy),
    sourceLanguageMismatch,
    chartTerms: {
      datasetLabel: copy.chartTermsDataset,
      mentionsLabel: copy.chartTermsMentions,
    },
    emptyStates: {
      entities: copy.noEntities,
      sources: copy.noSources,
    },
    trustSignals: buildTrustSignals(data),
    sourceAnatomy: buildSourceAnatomy(data.anatomia_fuentes, locale),
    sourceAnatomyChart: buildSourceAnatomyChart(data.anatomia_fuentes, locale),
    actorAttributionChart: buildActorAttributionChart(data.atribucion_actores, locale),
    narrativeFrames: buildNarrativeFrames(data.marcos_narrativos, locale),
    narrativeFramesChart: buildNarrativeFramesChart(data.marcos_narrativos, locale),
    perspectiveMap: buildPerspectiveMap(data.mapa_perspectivas, data.capa_semantica_ai, locale),
    comparativeCoverage: buildComparativeCoverage(data.cobertura_comparativa, locale),
    alertas: buildAlertas(data, locale),
  };
}

function buildTrustSignals(data) {
  const rep = data.capa_semantica?.domainReputation || null;
  const clickbait = data.capa_semantica?.clickbaitScore ?? null;
  return {
    domainReputation: rep,
    clickbaitScore: clickbait,
    clickbaitLevel: clickbait === null ? null : clickbait >= 60 ? 'high' : clickbait >= 30 ? 'medium' : 'low',
    trustTier: rep ? (rep.trustScore >= 82 ? 'high' : rep.trustScore >= 62 ? 'medium' : rep.trustScore >= 40 ? 'low' : 'very-low') : null,
  };
}

function buildPipelineBadges(data, locale, copy) {
  const articleLanguage = data.capa_semantica?.articleLanguage || data.meta?.language || 'unknown';
  const outputLanguage = data.pipeline?.outputLanguage || locale;
  const extraction = data.capa_extraccion || data.pipeline?.layers?.extraction || {};
  const translation = data.capa_traduccion || {};
  const semantic = data.capa_semantica_ai || {};
  const finalLayer = data.pipeline?.layers?.final || {};

  return [
    {
      text: `${locale === 'en' ? 'Article' : 'Articulo'}: ${languageName(articleLanguage, locale, copy)}`,
      tone: 'muted',
    },
    {
      text: `${locale === 'en' ? 'Output' : 'Salida'}: ${String(outputLanguage || 'auto').toUpperCase()}`,
      tone: 'muted',
    },
    {
      text: `${locale === 'en' ? 'Extraction' : 'Extraccion'}: ${labelForStatus(extraction.status, locale, extraction.coverage)}`,
      tone: extraction.status === 'partial' ? 'warn' : 'default',
    },
    {
      text: buildTranslationBadgeText(translation, locale),
      tone: translation.status === 'failed' ? 'warn' : translation.available ? 'default' : 'muted',
    },
    {
      text: buildSemanticBadgeText(semantic, locale),
      tone: semantic.status === 'failed' ? 'warn' : semantic.available ? 'default' : 'muted',
    },
    {
      text: `${locale === 'en' ? 'Map' : 'Mapa'}: ${labelForFinalMode(finalLayer.mode, finalLayer.status, locale)}`,
      tone: finalLayer.status === 'limited' || finalLayer.status === 'partial' ? 'warn' : 'default',
    },
  ].filter((item) => item.text);
}

function buildTranslationBadgeText(layer, locale) {
  if (layer.status === 'direct') {
    return locale === 'en' ? 'Translation: not needed' : 'Traduccion: no necesaria';
  }
  if (layer.available) {
    const provider = layer.provider ? ` ${providerLabel(layer.provider)}` : '';
    const coverage = layer.coverage && layer.coverage !== 'none' ? ` · ${layer.coverage}` : '';
    return `${locale === 'en' ? 'Translation' : 'Traduccion'}:${provider}${coverage}`;
  }
  if (layer.status === 'disabled') {
    return locale === 'en' ? 'Translation: off' : 'Traduccion: off';
  }
  if (layer.status === 'failed') {
    return locale === 'en' ? 'Translation: failed' : 'Traduccion: fallida';
  }
  return locale === 'en' ? 'Translation: pending' : 'Traduccion: pendiente';
}

function buildSemanticBadgeText(layer, locale) {
  if (layer.available) {
    const provider = layer.provider ? ` ${providerLabel(layer.provider)}` : '';
    const coverage = layer.coverage && layer.coverage !== 'none' ? ` · ${layer.coverage}` : '';
    return `${locale === 'en' ? 'Semantics' : 'Semantica'}:${provider}${coverage}`;
  }
  if (layer.status === 'disabled') {
    return locale === 'en' ? 'Semantics: off' : 'Semantica: off';
  }
  if (layer.status === 'failed') {
    return locale === 'en' ? 'Semantics: failed' : 'Semantica: fallida';
  }
  return locale === 'en' ? 'Semantics: pending' : 'Semantica: pendiente';
}

function labelForStatus(status, locale, coverage) {
  if (status === 'partial') return locale === 'en' ? `partial${coverage ? ` · ${coverage}` : ''}` : `parcial${coverage ? ` · ${coverage}` : ''}`;
  if (status === 'ready') return locale === 'en' ? 'ok' : 'correcta';
  return locale === 'en' ? 'limited' : 'limitada';
}

function labelForFinalMode(mode, status, locale) {
  if (status === 'limited') return locale === 'en' ? 'limited' : 'limitado';
  if (mode === 'hybrid') return locale === 'en' ? 'hybrid' : 'hibrido';
  if (mode === 'semantic') return locale === 'en' ? 'semantic' : 'semantico';
  if (mode === 'translated') return locale === 'en' ? 'translated' : 'traducido';
  return locale === 'en' ? 'local' : 'local';
}

function providerLabel(provider) {
  if (provider === 'chrome-ai') return 'Chrome AI';
  if (provider === 'libretranslate') return 'LibreTranslate';
  if (provider === 'remote') return 'Remote';
  if (provider === 'mock') return 'Mock';
  return provider;
}

function buildSourceAnatomy(anatomy, locale) {
  if (!anatomy) return null;
  const isEs = locale !== 'en' && locale !== 'fr' && locale !== 'de' && locale !== 'pt' && locale !== 'it' && locale !== 'ja';
  const labels = isEs
    ? { primary: 'Primarias', expert: 'Expertas', anonymous: 'Anónimas', medial: 'Mediales', unattributed: 'Sin atribución' }
    : { primary: 'Primary', expert: 'Expert', anonymous: 'Anonymous', medial: 'From media', unattributed: 'Unattributed' };
  const icons = { primary: 'document', expert: 'spark', anonymous: 'question', medial: 'news', unattributed: 'warning' };

  const max = Math.max(anatomy.primary, anatomy.expert, anatomy.anonymous, anatomy.medial, anatomy.unattributed, 1);
  const bars = ['primary', 'expert', 'anonymous', 'medial', 'unattributed'].map((type) => ({
    type,
    icon: icons[type],
    label: labels[type],
    count: anatomy[type],
    pct: Math.round((anatomy[type] / max) * 100),
  }));

  const dominantLabels = isEs
    ? { primary: 'Predominio: fuentes primarias', expert: 'Predominio: fuentes expertas', anonymous: 'Predominio: fuentes anónimas', medial: 'Predominio: citas a otros medios', unattributed: 'Predominio: afirmaciones sin atribución', mixed: '' }
    : { primary: 'Dominant: primary sources', expert: 'Dominant: expert sources', anonymous: 'Dominant: anonymous sources', medial: 'Dominant: references to other media', unattributed: 'Dominant: unattributed claims', mixed: '' };

  return {
    bars,
    transparencyScore: anatomy.transparencyScore,
    dominantType: anatomy.dominantType,
    dominantLabel: dominantLabels[anatomy.dominantType] || '',
    isEmpty: anatomy.total === 0 && anatomy.unattributed === 0,
  };
}

function buildSourceAnatomyChart(anatomy, locale) {
  if (!anatomy) return { labels: [], values: [], total: 0, isEmpty: true };
  const isEs = locale !== 'en';
  const labels = isEs
    ? ['Primarias', 'Expertas', 'Anónimas', 'Mediales', 'Sin atribución']
    : ['Primary', 'Expert', 'Anonymous', 'Media', 'Unattributed'];
  const values = [
    anatomy.primary || 0,
    anatomy.expert || 0,
    anatomy.anonymous || 0,
    anatomy.medial || 0,
    anatomy.unattributed || 0,
  ];
  return {
    labels,
    values,
    total: values.reduce((sum, value) => sum + value, 0),
    isEmpty: values.every((value) => value === 0),
  };
}

function buildArgumentChart(eioProfile, locale) {
  if (!eioProfile) return { labels: [], values: [], isEmpty: true };
  const isEs = locale !== 'en';
  const values = [
    eioProfile.evidence || 0,
    eioProfile.interpretation || 0,
    eioProfile.opinion || 0,
  ];
  return {
    labels: isEs ? ['Evidencia', 'Interpretación', 'Opinión'] : ['Evidence', 'Interpretation', 'Opinion'],
    values,
    isEmpty: values.every((value) => value === 0),
  };
}

function buildEntitiesChart(entities, locale) {
  const items = (entities || [])
    .filter((item) => item?.name)
    .slice(0, 6);
  return {
    labels: items.map((item) => item.name),
    values: items.map((item) => item.mentions || item.count || 0),
    mentionsLabel: locale === 'en' ? 'mentions' : 'menciones',
    isEmpty: items.length === 0,
  };
}

function buildParagraphFlowChart(paragraphDiagnostics, locale) {
  const items = (paragraphDiagnostics || []).slice(0, 12);
  return {
    labels: items.map((item) => `P${item.id}`),
    focusValues: items.map((item) => item.focusScore || 0),
    attributionValues: items.map((item) => item.attributionScore || 0),
    focusTerms: items.map((item) => item.focusTerm || ''),
    focusLabel: locale === 'en' ? 'Topic focus' : 'Foco temático',
    attributionLabel: locale === 'en' ? 'Attribution' : 'Atribución',
    isEmpty: items.length === 0,
  };
}

function buildActorAttributionChart(actorAttribution, locale) {
  const items = (actorAttribution || []).slice(0, 6);
  return {
    labels: items.map((item) => item.name),
    attributed: items.map((item) => item.attributed || 0),
    unattributed: items.map((item) => item.unattributed || 0),
    attributedLabel: locale === 'en' ? 'Attributed' : 'Atribuidas',
    unattributedLabel: locale === 'en' ? 'Unattributed' : 'No atribuidas',
    isEmpty: items.length === 0,
  };
}

function buildRhetoricalFlowChart(paragraphDiagnostics, locale) {
  const items = (paragraphDiagnostics || []).slice(0, 12);
  return {
    labels: items.map((item) => `P${item.id}`),
    modalValues: items.map((item) => item.modalScore || 0),
    cohesionValues: items.map((item) => item.cohesionScore || 0),
    modalLabel: locale === 'en' ? 'Modalization' : 'Modalizacion',
    cohesionLabel: locale === 'en' ? 'Cohesion' : 'Cohesion',
    isEmpty: items.length === 0,
  };
}

function buildNarrativeFramesChart(frames, locale) {
  if (!frames?.frames?.length) return { labels: [], values: [], isEmpty: true };
  return {
    labels: frames.frames.map((item) => item.label),
    values: frames.frames.map((item) => item.score || 0),
    total: frames.frames.reduce((sum, item) => sum + (item.score || 0), 0),
    isEmpty: frames.totalSignals === 0,
    title: locale === 'en' ? 'Frame balance' : 'Balance de encuadres',
  };
}

function buildNarrativeFrames(frames, locale) {
  if (!frames || !frames.frames.length) return { items: [], dominant: null, dominantLabel: '', isEmpty: true };
  const isEs = locale !== 'en' && locale !== 'fr' && locale !== 'de' && locale !== 'pt' && locale !== 'it' && locale !== 'ja';

  const items = frames.frames.map((f) => ({
    id: f.id,
    icon: f.icon,
    label: f.label,
    score: f.score,
    count: f.count,
    level: f.score >= 50 ? 'high' : f.score >= 25 ? 'mid' : 'low',
  }));

  const dominantFrame = frames.dominant ? frames.frames.find((f) => f.id === frames.dominant) : null;
  const dominantLabel = dominantFrame
    ? (isEs ? `Marco dominante: ${dominantFrame.label}` : `Dominant frame: ${dominantFrame.label}`)
    : '';

  return {
    items,
    dominant: frames.dominant,
    secondary: frames.secondary,
    dominantLabel,
    isEmpty: frames.totalSignals === 0,
  };
}

function buildComparativeCoverage(data, locale) {
  const isEs = locale !== 'en' && locale !== 'fr' && locale !== 'de' && locale !== 'pt' && locale !== 'it' && locale !== 'ja';
  if (!data?.available) {
    return { available: false, results: [], frameDiversityLabel: '', hasDivergence: false };
  }
  const diversityLabels = isEs
    ? { high: 'Alta diversidad de marcos entre medios', medium: 'Diversidad media de marcos', low: 'Marcos similares en todos los medios consultados' }
    : { high: 'High frame diversity across sources', medium: 'Moderate frame diversity', low: 'Similar framing across all sources' };
  return {
    available: true,
    results: data.results || [],
    frameDiversity: data.frameDiversity || 'low',
    frameDiversityLabel: diversityLabels[data.frameDiversity || 'low'] || '',
    hasDivergence: data.hasDivergence || false,
    query: data.query || '',
  };
}

function buildPerspectiveMap(lexical, aiLayer, locale) {
  const isEs = locale !== 'en' && locale !== 'fr' && locale !== 'de' && locale !== 'pt' && locale !== 'it' && locale !== 'ja';

  // Voices from lexical detection (always available)
  const voices = lexical?.voices || [];
  const pluralityScore = lexical?.pluralityScore ?? 0;
  const presentVoices = voices.filter((v) => v.count > 0);

  const pluralityLabel = presentVoices.length === 0
    ? (isEs ? 'Sin voces detectadas' : 'No voices detected')
    : (isEs
      ? `${presentVoices.length} de ${voices.length} categorías de actores presentes · Pluralidad: ${pluralityScore}%`
      : `${presentVoices.length} of ${voices.length} actor categories present · Plurality: ${pluralityScore}%`);

  // Omitted angles from Chrome AI (optional enrichment)
  const omittedAngles = aiLayer?.semanticOverview?.omittedAngles || [];
  const unsourcedClaims = aiLayer?.semanticOverview?.unsourcedClaims || [];

  return {
    voices,
    pluralityScore,
    pluralityLabel,
    omittedAngles,
    unsourcedClaims,
    method: lexical?.method || 'lexical',
    aiEnriched: aiLayer?.available === true,
    isEmpty: voices.length === 0,
  };
}

function buildAlertas(data, locale) {
  const isEs = locale !== 'en' && locale !== 'fr' && locale !== 'de' && locale !== 'pt' && locale !== 'it' && locale !== 'ja';
  const { analisis_lexico, capa_semantica, estructura, fuentes } = data;
  const t = (es, en) => isEs ? es : en;
  const alerts = [];
  const wordCount = estructura?.wordCount || 0;
  const extLinks = fuentes?.external || 0;
  const quotes = estructura?.quoteCount || 0;
  const anatomy = data.anatomia_fuentes;

  const rep = capa_semantica?.domainReputation;
  if (rep) {
    if (rep.trustScore >= 82) {
      alerts.push({ id: 'domain-high', level: 'ok', icon: '✓', label: t('Fuente de alta confianza', 'Trusted source'), detail: `${rep.domain} · ${rep.trustScore}/100` });
    } else if (rep.trustScore < 45) {
      alerts.push({ id: 'domain-low', level: 'danger', icon: '✗', label: t('Fuente de baja reputación', 'Low-reputation source'), detail: `${rep.domain} · ${rep.trustScore}/100` });
    }
  }

  const clickbait = capa_semantica?.clickbaitScore ?? 0;
  if (clickbait >= 60) {
    alerts.push({ id: 'clickbait-high', level: 'danger', icon: '⚠', label: t('Titular con señales de clickbait', 'Clickbait headline signals'), detail: `${clickbait}/100` });
  } else if (clickbait >= 30) {
    alerts.push({ id: 'clickbait-mid', level: 'warning', icon: '↑', label: t('Titular llamativo', 'Attention-grabbing headline'), detail: `${clickbait}/100` });
  }

  const weasel = analisis_lexico?.weaselWordCount || 0;
  if (weasel >= 3) {
    alerts.push({ id: 'weasel', level: 'warning', icon: '◎', label: t('Lenguaje evasivo detectado', 'Evasive language detected'), detail: t(`${weasel} expresiones de atribución difusa`, `${weasel} vague attribution expressions`) });
  }

  const adjDensity = analisis_lexico?.adjectiveDensity || 0;
  if (adjDensity >= 55) {
    alerts.push({ id: 'adjectives', level: 'warning', icon: '◎', label: t('Texto muy adjetivado', 'High adjective density'), detail: t(`${adjDensity}% densidad adjetival`, `${adjDensity}% adjective density`) });
  }

  const repetition = analisis_lexico?.repetitionScore || 0;
  if (repetition >= 58 && wordCount > 350) {
    alerts.push({ id: 'repetition-high', level: 'info', icon: '·', label: t('Repetición léxica elevada', 'High lexical repetition'), detail: t(`${repetition}% de repetición estimada`, `${repetition}% estimated repetition`) });
  }

  if (extLinks === 0 && quotes === 0 && wordCount > 300) {
    alerts.push({ id: 'evidence-none', level: 'info', icon: '·', label: t('Sin fuentes externas ni citas', 'No external sources or quotes'), detail: t('No se detectaron referencias verificables', 'No verifiable references found') });
  }

  const eio = analisis_lexico?.eioProfile;
  if (eio && eio.opinionCount + eio.interpretCount + eio.evidenceCount >= 3) {
    if (eio.opinion >= 40) {
      alerts.push({ id: 'opinion-heavy', level: 'warning', icon: '◎', label: t('Alto componente valorativo', 'High evaluative content'), detail: t(`${eio.opinion}% del contenido es valorativo`, `${eio.opinion}% evaluative markers`) });
    }
    if (eio.interpretation >= 35 && eio.evidence <= 15 && wordCount > 300) {
      alerts.push({ id: 'interpretive-heavy', level: 'warning', icon: '◎', label: t('Predomina interpretación sobre evidencia', 'Interpretation outweighs evidence'), detail: t(`${eio.interpretation}% interpretación frente a ${eio.evidence}% evidencia`, `${eio.interpretation}% interpretation vs ${eio.evidence}% evidence`) });
    }
    if (eio.evidence <= 10 && wordCount > 300) {
      alerts.push({ id: 'evidence-weak', level: 'info', icon: '·', label: t('Pocas marcas de evidencia', 'Few evidence markers'), detail: t('El texto carece de atribución explícita', 'Text lacks explicit attribution') });
    }
  }

  if (anatomy) {
    if (anatomy.anonymous >= 2 && anatomy.primary === 0) {
      alerts.push({ id: 'anon-sources', level: 'warning', icon: '◎', label: t('Fuentes anónimas sin respaldo documental', 'Anonymous sources without documentary support'), detail: t(`${anatomy.anonymous} atribuciones sin nombre`, `${anatomy.anonymous} unnamed attributions`) });
    }
    if (anatomy.unattributed >= 5) {
      alerts.push({ id: 'unattributed', level: 'warning', icon: '◎', label: t('Alto número de afirmaciones sin fuente', 'High number of unattributed claims'), detail: t(`${anatomy.unattributed} afirmaciones sin atribuir`, `${anatomy.unattributed} unattributed statements`) });
    }
    if (anatomy.medial >= 3 && anatomy.primary === 0) {
      alerts.push({ id: 'medial-only', level: 'info', icon: '·', label: t('El artículo cita principalmente otros medios', 'Article cites mainly other media'), detail: t(`${anatomy.medial} referencias a otros medios`, `${anatomy.medial} media cross-references`) });
    }
    if ((extLinks >= 4 || quotes >= 3 || capa_semantica?.evidenceLevel === 'rich') && anatomy.unattributed <= 2) {
      alerts.push({ id: 'evidence-rich', level: 'ok', icon: '✓', label: t('Base de apoyo visible', 'Visible supporting base'), detail: t(`${extLinks} fuentes externas y ${quotes} citas detectadas`, `${extLinks} external sources and ${quotes} quotes detected`) });
    }
  }

  const frames = data.marcos_narrativos;
  if (frames?.dominant) {
    const topFrame = frames.frames[0];
    if (topFrame && topFrame.score >= 45) {
      const frameLabelsEs = {
        CRISIS_AMENAZA: 'Marco narrativo dominante: crisis / amenaza',
        CONFLICTO: 'Marco narrativo dominante: conflicto',
        VICTIMA_RESPONSABLE: 'Marco narrativo dominante: víctima / responsable',
        ESCANDALO_REVELACION: 'Marco narrativo dominante: escándalo / revelación',
        PROGRESO_LOGRO: 'Marco narrativo dominante: progreso / logro',
        NORMALIZACION: 'Marco narrativo dominante: normalización'
      };
      const frameLabelsEn = {
        CRISIS_AMENAZA: 'Dominant frame: crisis / threat',
        CONFLICTO: 'Dominant frame: conflict',
        VICTIMA_RESPONSABLE: 'Dominant frame: victim / accountability',
        ESCANDALO_REVELACION: 'Dominant frame: scandal / revelation',
        PROGRESO_LOGRO: 'Dominant frame: progress / achievement',
        NORMALIZACION: 'Dominant frame: normalization'
      };
      const level = frames.dominant === 'CRISIS_AMENAZA' || frames.dominant === 'ESCANDALO_REVELACION' ? 'warning' : 'info';
      alerts.push({ id: `frame-${frames.dominant.toLowerCase()}`, level, icon: topFrame.icon || '·', label: t(frameLabelsEs[frames.dominant] || `Marco: ${frames.dominant}`, frameLabelsEn[frames.dominant] || `Frame: ${frames.dominant}`) });
    }
  }

  const perspectiva = data.mapa_perspectivas;
  if (perspectiva) {
    const present = (perspectiva.voices || []).filter((v) => v.count > 0).length;
    const total = (perspectiva.voices || []).length;
    if (total > 0 && present <= 1) {
      alerts.push({ id: 'perspective-low', level: 'warning', icon: '👁', label: t('Pluralidad de voces muy baja', 'Very low voice plurality'), detail: t(`Solo 1 categoría de actor detectada de ${total}`, `Only 1 actor category detected out of ${total}`) });
    } else if (total > 0 && present === 2) {
      alerts.push({ id: 'perspective-limited', level: 'info', icon: '👁', label: t('Perspectivas limitadas', 'Limited perspectives'), detail: t(`${present} de ${total} categorías de actores presentes`, `${present} of ${total} actor categories present`) });
    } else if (total >= 4 && present >= 4) {
      alerts.push({ id: 'perspective-wide', level: 'ok', icon: '✓', label: t('Pluralidad de voces amplia', 'Broad voice plurality'), detail: t(`${present} categorías de actores presentes`, `${present} actor categories present`) });
    }
  }

  const levelOrder = { danger: 0, warning: 1, info: 2, ok: 3 };
  return alerts
    .sort((a, b) => (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99))
    .slice(0, 5);
}
function buildSemanticLayer(data) {
  const semanticOverview = data.capa_semantica_ai?.available ? data.capa_semantica_ai.semanticOverview : null;

  if (!semanticOverview) {
    return {
      available: false,
      summary: '',
      orientation: '',
      topic: '',
      actors: [],
      events: [],
      points: [],
      editorialTone: '',
      rhetoricalSignals: [],
      readingNote: '',
      omittedAngles: [],
      unsourcedClaims: [],
    };
  }

  return {
    available: true,
    summary: String(semanticOverview.summary || semanticOverview.topicSummary || '').trim(),
    orientation: String(semanticOverview.readerOrientation || '').trim(),
    topic: String(semanticOverview.topicSummary || '').trim(),
    actors: sanitizeBullets(semanticOverview.mainActors, 4),
    events: sanitizeBullets(semanticOverview.mainEvents, 4),
    points: sanitizeBullets(semanticOverview.keyPoints, 5),
    editorialTone: String(semanticOverview.editorialTone || '').trim(),
    rhetoricalSignals: sanitizeBullets(semanticOverview.rhetoricalSignals, 3),
    readingNote: String(semanticOverview.readingNote || '').trim(),
    omittedAngles: sanitizeBullets(semanticOverview.omittedAngles, 4),
    unsourcedClaims: sanitizeBullets(semanticOverview.unsourcedClaims, 4),
    status: data.capa_semantica_ai?.status || 'ready',
    coverage: data.capa_semantica_ai?.coverage || 'high',
    translated: Boolean(data.capa_traduccion?.available),
  };
}

function buildQuickSummary(readingMap, semanticLayer, translationLayer, copy, limitedMode) {
  const extractionWeak = readingMap.bullets.some((item) => /extraccion|Extraction looks incomplete/.test(item));
  const lead = limitedMode
    ? copy.limitedMode
    : semanticLayer.available
      ? (semanticLayer.summary || semanticLayer.topic || readingMap.summary)
      : extractionWeak ? (readingMap.topicUnknown || readingMap.summary) : readingMap.summary;

  const summaryTips = limitedMode
    ? [
      { emoji: 'lock', text: readingMap.bullets[0] || '' },
      { emoji: 'alert', text: readingMap.bullets[1] || '' },
    ]
    : semanticLayer.available
      ? [
        { emoji: 'users', text: semanticLayer.actors[0] || semanticLayer.events[0] || readingMap.bullets[1] || '' },
        { emoji: 'alert', text: semanticLayer.points[0] || readingMap.bullets[2] || '' },
        { emoji: 'link', text: readingMap.bullets[3] || '' },
      ]
      : [
        { emoji: 'link', text: readingMap.bullets[1] || '' },
        { emoji: 'alert', text: readingMap.bullets[2] || '' },
        { emoji: 'scan', text: readingMap.bullets[3] || '' },
      ];

  const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const baseSummary = normalizeText(readingMap.summary);
  const normalizedLead = normalizeText(lead);
  const distinctLead = normalizedLead && normalizedLead !== baseSummary ? lead : '';
  const seen = new Set([baseSummary, normalizedLead].filter(Boolean));
  const dedupedTips = summaryTips.filter((item) => {
    const normalized = normalizeText(item.text);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  return {
    lead: distinctLead,
    tips: dedupedTips,
    limitedMode,
    modeBadge: semanticLayer.available
      ? resolveSummaryMode(copy, readingMap.provenanceBadge)
      : copy.summaryModeLocal,
    translationBadge: resolveTranslationBadge(copy, semanticLayer, translationLayer, limitedMode),
  };
}

function hasSourceLanguageMismatch(capaSemantica) {
  const requested = capaSemantica?.requestedSourceLanguage;
  const detected = capaSemantica?.detectedArticleLanguage;
  if (!requested || !detected) return false;
  return requested !== detected;
}

function isLimitedMode(capaSemantica, semanticAiLayer, translationLayer, locale) {
  if (semanticAiLayer?.available) return false;
  if (translationLayer?.available) return false;
  const articleLanguage = capaSemantica?.articleLanguage || capaSemantica?.detectedArticleLanguage || 'unknown';
  if (!articleLanguage || articleLanguage === 'unknown') return false;
  if (locale === 'ja') return false;
  return articleLanguage !== locale && ['ja', 'ko', 'zh', 'ar', 'ru'].includes(articleLanguage);
}

function buildReadingMap({ data, locale, copy, articleLanguage }) {
  const { meta, estructura, entidades_detectadas, capa_semantica, capa_semantica_ai, capa_traduccion } = data;
  const focus = buildFocusLabel(data, locale);
  const entities = formatEntityList(resolveEntitiesForLocale(data), locale);
  const structureLabel = copy[`structure${capitalize(capa_semantica?.structureKind || 'standard')}`];
  const evidenceLabel = copy[`evidence${capitalize(capa_semantica?.evidenceLevel || 'mixed')}`];
  const semanticOverview = capa_semantica_ai?.available ? capa_semantica_ai.semanticOverview : null;
  const semanticStatusLabel = capa_semantica_ai?.status === 'partial'
    ? (copy.semanticAiPartial || copy.semanticAiReady)
    : copy.semanticAiReady;
  copy.semanticAiReady = semanticStatusLabel;
  const limitedMode = isLimitedMode(capa_semantica, capa_semantica_ai, capa_traduccion, locale);

  if (semanticOverview) {
    const bullets = [
      ...sanitizeBullets(semanticOverview.keyPoints, 3),
      ...sanitizeBullets(semanticOverview.mainActors, 1).map((value) => `${value}`),
      ...sanitizeBullets(semanticOverview.mainEvents, 1).map((value) => `${value}`),
      copy.readingMapEvidence({
        evidenceLabel,
        external: data.fuentes.external,
        quotes: estructura.quoteCount,
      }),
    ].slice(0, 5);

    return {
      summary: semanticOverview.summary || semanticOverview.topicSummary || copy.readingMapSummary({
        articleType: structureLabel,
        focus,
        readingTimeMin: estructura.readingTimeMin,
      }),
      bullets: bullets.length ? bullets : [
        semanticOverview.readerOrientation || copy.readingMapFocus({ focus, entities }),
      ],
      provenanceBadge: resolveProvenanceBadge(copy, capa_semantica, capa_semantica_ai),
      confidenceBadge: confidenceLabel(resolveCombinedConfidence(capa_semantica, capa_semantica_ai), copy),
      articleLanguageLabel: `${copy.articleLanguageLabel({
        language: languageName(articleLanguage, locale, copy),
      })} · ${copy.semanticAiReady}`,
    };
  }

  return {
    summary: limitedMode
      ? copy.limitedMode
      : capa_semantica?.extractionWarning && shouldHideRawFocus(articleLanguage, locale)
      ? copy.topicUnknown
      : copy.readingMapSummary({
          articleType: structureLabel,
          focus,
          readingTimeMin: estructura.readingTimeMin,
          title: meta.title || copy.untitled,
        }),
    bullets: [
      ...(capa_semantica?.extractionWarning ? [copy.extractionWeak] : []),
      ...(limitedMode ? [] : [copy.readingMapScope({
        paragraphCount: estructura.paragraphCount,
        wordCount: estructura.wordCount,
        structureLabel,
      })]),
      ...(limitedMode ? [] : [copy.readingMapFocus({ focus, entities })]),
      ...(limitedMode ? [] : [copy.readingMapEvidence({
        evidenceLabel,
        external: data.fuentes.external,
        quotes: estructura.quoteCount,
      })]),
    ],
    provenanceBadge: copy.provenanceLocal,
    confidenceBadge: confidenceLabel(resolveCombinedConfidence(capa_semantica, capa_semantica_ai), copy),
    topicUnknown: copy.topicUnknown,
    articleLanguageLabel: `${copy.articleLanguageLabel({
      language: languageName(articleLanguage, locale, copy),
    })} · ${copy.semanticAiUnavailable} · ${copy.semanticHeuristicLabel}`,
  };
}

function buildFocusLabel(data, locale) {
  const articleLanguage = data.capa_semantica?.articleLanguage || 'unknown';
  const semanticOverview = data.capa_semantica_ai?.available ? data.capa_semantica_ai.semanticOverview : null;
  const translatedTitle = String(data.capa_traduccion?.translatedTitle || '').trim();
  const translatedTerms = (data.capa_traduccion?.translatedFocusTerms || []).filter(Boolean);
  if (semanticOverview?.topicSummary) return semanticOverview.topicSummary;
  if (translatedTitle) return translatedTitle;
  if (translatedTerms.length >= 2) return formatList(translatedTerms.slice(0, 3), locale);
  if (shouldHideRawFocus(articleLanguage, locale)) {
    return locale === 'en' ? 'the article topic' : locale === 'ja' ? 'Ã¨Â¨ËœÃ¤Âºâ€¹Ã£ÂÂ®Ã¤Â¸Â»Ã©Â¡Å’' : 'el tema del articulo';
  }

  const useTitleFirst = articleLanguage === 'ja' || articleLanguage === 'ko' || articleLanguage === 'zh';
  const terms = data.capa_semantica?.focusTerms?.filter(Boolean) || [];
  const title = normalizeTitle(data.meta?.title);

  if (title && articleLanguage === locale && (locale === 'es' || locale === 'en')) return title;
  if (useTitleFirst && title) return title;
  if (terms.length >= 2) return formatList(terms.slice(0, 3), locale);
  if (title) return title;
  if (terms.length === 1) return terms[0];
  return locale === 'ja' ? 'ä¸­å¿ƒãƒ†ãƒ¼ãƒž' : locale === 'en' ? 'its main subject' : 'su tema central';
}

function formatEntityList(entities, locale) {
  const names = entities.slice(0, 2).map((item) => item.name).filter(Boolean);
  return names.length ? formatList(names, locale) : null;
}

function resolveEntitiesForLocale(data) {
  const translatedEntities = data.capa_traduccion?.translatedEntities;
  if (Array.isArray(translatedEntities) && translatedEntities.length) return translatedEntities;
  return data.entidades_detectadas || [];
}

function shouldHideRawFocus(articleLanguage, locale) {
  if (locale === 'ja') return false;
  if (!articleLanguage || articleLanguage === 'unknown') return false;
  return articleLanguage !== locale && ['ja', 'ko', 'zh', 'ar', 'ru'].includes(articleLanguage);
}

function sanitizeBullets(items, maxItems) {
  return (items || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function arcLabel(arc, average, copy, locale) {
  const tone = average > 20 ? copy.tonePositive : average < -20 ? copy.toneCharged : copy.toneNeutral;
  const shape = {
    rising: copy.sentimentRising,
    falling: copy.sentimentFalling,
    flat: copy.sentimentStable,
    volatile: copy.sentimentVolatile,
  }[arc] || copy.sentimentStable;

  if (locale === 'ja') return `ãƒˆãƒ¼ãƒ³ ${tone} ãƒ» ${shape}`;
  if (locale === 'es') return `Intensidad ${tone} · ${shape}`;
  return `Intensity ${tone} Â· ${shape}`;
}


function describeMotion(arc, locale) {
  if (locale === 'es') {
    if (arc === 'rising') return 'concentra más presión en el cierre';
    if (arc === 'falling') return 'arranca con más presión y luego se abre';
    if (arc === 'volatile') return 'alterna varios cambios de intensidad';
    return 'reparte la presión de forma bastante estable';
  }

  if (arc === 'rising') return 'gains intensity as it moves forward';
  if (arc === 'falling') return 'loses intensity as it moves forward';
  if (arc === 'volatile') return 'swings across several tonal shifts';
  return 'stays fairly steady';
}

function toneFromScore(score, copy) {
  return score > 20 ? copy.tonePositive : score < -20 ? copy.toneCharged : copy.toneNeutral;
}

function toneKeyFromScore(score) {
  return score > 20 ? 'positive' : score < -20 ? 'charged' : 'neutral';
}

function buildSentimentRail(scores, copy) {
  if (!Array.isArray(scores) || !scores.length) return [];
  const peakIndex = scores.reduce((bestIndex, score, index, array) => (
    Math.abs(score) > Math.abs(array[bestIndex]) ? index : bestIndex
  ), 0);

  return scores.map((score, index) => ({
    id: index + 1,
    score,
    tone: toneKeyFromScore(score),
    toneLabel: toneFromScore(score, copy),
    isStart: index === 0,
    isPeak: index === peakIndex,
    isEnd: index === scores.length - 1,
  }));
}

function sentimentSummary(scores, average, arc, copy, locale) {
  if (!Array.isArray(scores) || !scores.length) {
    return {
      toneChip: '',
      motionChip: '',
      peakChip: '',
      text: '',
    };
  }

  const tone = toneFromScore(average, copy);
  const motion = {
    rising: copy.sentimentRising,
    falling: copy.sentimentFalling,
    flat: copy.sentimentStable,
    volatile: copy.sentimentVolatile,
  }[arc] || copy.sentimentStable;
  const startTone = toneFromScore(scores[0], copy);
  const endTone = toneFromScore(scores[scores.length - 1], copy);
  const peakIndex = scores.reduce((bestIndex, score, index, array) => (
    Math.abs(score) > Math.abs(array[bestIndex]) ? index : bestIndex
  ), 0);
  const peakTone = toneFromScore(scores[peakIndex], copy);

  if (locale === 'es') {
    return {
      toneChip: `Intensidad ${tone}`,
      motionChip: `Ritmo ${motion}`,
      peakChip: `Pico P${peakIndex + 1}`,
      text: `Empieza con intensidad ${startTone}, ${describeMotion(arc, locale)} y cierra con intensidad ${endTone}. El tramo de mayor presión aparece en P${peakIndex + 1} con intensidad ${peakTone}.`,
    };
  }

  return {
    toneChip: `Intensity ${tone}`,
    motionChip: `Rhythm ${motion}`,
    peakChip: `Peak P${peakIndex + 1}`,
    text: `It starts at ${startTone} intensity, ${describeMotion(arc, locale)}, and ends at ${endTone}. The strongest segment appears in P${peakIndex + 1} with ${peakTone} intensity.`,
  };
}
function confidenceLabel(level, copy) {
  if (level === 'high') return copy.confidenceHigh;
  if (level === 'medium') return copy.confidenceMedium;
  return copy.confidenceLow;
}

function resolveCombinedConfidence(capaSemantica, semanticAiLayer) {
  const localScore = labelToScore(capaSemantica?.localConfidence);
  if (!semanticAiLayer?.available) return scoreToLabel(localScore);

  const semanticScore = coverageToScore(semanticAiLayer.coverage);
  const extractionPenalty = capaSemantica?.extractionConfidence === 'low' ? -10 : 0;
  return scoreToLabel(Math.round((localScore + semanticScore) / 2) + extractionPenalty);
}

function resolveProvenanceBadge(copy, capaSemantica, semanticAiLayer) {
  if (!semanticAiLayer?.available) return copy.provenanceLocal;
  if (capaSemantica?.extractionConfidence === 'low') return copy.provenanceSemantic || copy.provenanceHybrid;
  return copy.provenanceHybrid;
}

function resolveTranslationBadge(copy, semanticLayer, translationLayer, limitedMode) {
  if (limitedMode) return copy.summaryTranslationUnavailable;
  if (translationLayer?.status === 'direct' || translationLayer?.coverage === 'native') {
    return copy.summaryTranslationDirect || copy.summaryTranslationReady;
  }
  if (semanticLayer?.available) {
    return semanticLayer.status === 'partial' ? copy.summaryTranslationPartial : copy.summaryTranslationReady;
  }
  if (translationLayer?.available) {
    return translationLayer.status === 'partial' ? copy.summaryTranslationPartial : copy.summaryTranslationReady;
  }
  return copy.summaryTranslationUnavailable;
}

function resolveSummaryMode(copy, provenanceBadge) {
  const normalized = String(provenanceBadge || '').toLowerCase();
  if (normalized.includes('semantic') || normalized.includes('semant')) return copy.summaryModeSemantic;
  if (normalized.includes('hybrid') || normalized.includes('hibrid')) return copy.summaryModeHybrid;
  return copy.summaryModeLocal;
}

function labelToScore(label) {
  if (label === 'high') return 82;
  if (label === 'medium') return 62;
  return 36;
}

function coverageToScore(label) {
  if (label === 'high') return 86;
  if (label === 'medium') return 64;
  return 34;
}

function scoreToLabel(score) {
  if (score >= 75) return 'high';
  if (score >= 52) return 'medium';
  return 'low';
}

function signalLevel(score) {
  if (score < 30) return 'low';
  if (score < 65) return 'mid';
  return 'high';
}

function formatIndexScore(score) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  return `${safe}/100`;
}

function formatReadabilityScore(score, locale) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const band = locale === 'en'
    ? (safe >= 65 ? 'high' : safe >= 35 ? 'medium' : 'low')
    : (safe >= 65 ? 'alta' : safe >= 35 ? 'media' : 'baja');
  return `${band} · ${safe}/100`;
}

function formatCountSignal(count, locale, labels = {}) {
  const safe = Math.max(0, Math.round(Number(count) || 0));
  if (locale === 'en') return `${safe} ${safe === 1 ? (labels.oneEn || 'item') : (labels.otherEn || 'items')}`;
  return `${safe} ${safe === 1 ? (labels.oneEs || 'marca') : (labels.otherEs || 'marcas')}`;
}

function buildDiscourseBalanceSignals(eioProfile, locale) {
  if (!eioProfile) return [];
  const total = (eioProfile.evidenceCount || 0) + (eioProfile.interpretCount || 0) + (eioProfile.opinionCount || 0);
  if (total <= 0) return [];
  const isEn = locale === 'en';
  return [
    {
      id: 'eio-evidence',
      label: isEn ? 'Evidence' : 'Evidencia',
      score: eioProfile.evidence || 0,
      tone: 'evidence',
    },
    {
      id: 'eio-interpretation',
      label: isEn ? 'Interpretation' : 'Interpretación',
      score: eioProfile.interpretation || 0,
      tone: 'interpretation',
    },
    {
      id: 'eio-opinion',
      label: isEn ? 'Opinion' : 'Opinión',
      score: eioProfile.opinion || 0,
      tone: 'opinion',
    },
  ];
}

function buildByline(author, date, locale, copy) {
  const parts = [];
  if (author) parts.push(`${copy.by} ${author}`);
  const formattedDate = formatDate(date, locale);
  if (formattedDate) parts.push(formattedDate);
  return parts.join(copy.join);
}

function formatDate(raw, locale) {
  if (!raw) return null;
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return raw;
  }
}

function normalizeLocale(locale) {
  const base = String(locale || 'es').toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(base) ? base : 'en';
}

function languageName(lang, locale, copy) {
  const normalized = String(lang || 'unknown').toLowerCase().split('-')[0];
  return LANGUAGE_NAMES[normalized]?.[locale] || copy.unknownLanguage;
}

function formatList(items, locale) {
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

function formatNumber(value, locale) {
  try {
    return Number(value || 0).toLocaleString(locale);
  } catch {
    return String(value || 0);
  }
}

function tryHostname(href) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}

function normalizeTitle(title) {
  const text = String(title || '').trim();
  if (!text) return '';
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
}

function capitalize(text) {
  return String(text || '').charAt(0).toUpperCase() + String(text || '').slice(1);
}

function capitalizeSentimentArc(arc) {
  return arc === 'flat' ? 'Stable' : capitalize(arc);
}


