/**
 * Monitora - Side panel orchestrator.
 */

import { isChromeAIAvailable } from './src/ai-analyzer.js';
import { toViewModel } from './src/ui-models.js';
import {
  renderChartTerms,
  renderChartProfile,
  renderChartCadence,
  renderChartArgumentBalance,
  renderChartEntities,
  renderChartSourceAnatomy,
  renderChartParagraphFlow,
  renderChartActorAttribution,
  renderChartRhetoricalFlow,
  renderChartFrameDistribution,
} from './src/charts.js';
import { getDomainReputation } from './src/domain-reputation.js';
import { saveEntry, getHistory, getStats } from './src/reading-history.js';
import { runAnalysisPipeline } from './src/pipeline/analysis-orchestrator.js';
import { resolveSemanticCapability, resolveTranslationCapability } from './src/provider-registry.js';

const STORAGE_KEY_SEMANTIC_CONFIG = 'biasmapper.semanticConfig';
const STORAGE_KEY_TRANSLATION_CONFIG = 'biasmapper.translationConfig';
const STORAGE_KEY_COMPARE_REFERENCE = 'biasmapper.compareReference';
const STORAGE_KEY_COMPARATIVE_CONFIG = 'biasmapper.comparativeConfig';

const OUTPUT_LOCALES = ['auto', 'es', 'en', 'fr', 'de', 'pt', 'it', 'ja'];
const SOURCE_LANGUAGES = ['auto', 'es', 'en', 'ja', 'fr', 'de', 'it', 'pt', 'ko', 'ar', 'ru'];
const ENABLE_EXPERIMENTAL_LAYERS = false;
const AUTO_LANGUAGE_BADGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1.5' y='1.5' width='21' height='21' rx='6' fill='%23111c30' stroke='%235f7397' stroke-width='1.5'/%3E%3Cpath d='M7.2 15.8 10.2 8.2h1.4l3 7.6h-1.5l-.7-1.9H9.9l-.7 1.9Zm3.1-3.1h1.7l-.85-2.36Z' fill='%23eef3ff'/%3E%3Cpath d='m16.3 7.1.3 1 .98.33-.98.32-.3 1.01-.32-1.01-1-.32 1-.33Zm1.9 3.2.22.68.68.22-.68.22-.22.69-.21-.69-.69-.22.69-.22Z' fill='%23a78bfa'/%3E%3C/svg%3E")`;
const PANEL_FRAME_COPY = {
  es: {
    introTitle: 'Que hace este panel',
    introBody: 'Describe como esta construido el texto: que lenguaje usa, en que apoyo se basa y que voces o encuadres prioriza.',
    introNoteTitle: 'Que no hace',
    introNoteBody: 'No decide si el texto es verdadero, falso o sesgado. Aporta metainformacion para leer mejor su construccion discursiva.',
    groupSummary: 'Panorama',
    groupLanguage: 'Como esta construido',
    groupSources: 'Quien sostiene el texto',
    groupVoices: 'Que encuadre domina',
    groupCompare: 'Comparativa',
    groupAdvanced: 'Ajustes avanzados',
    readingMap: 'Resumen de lectura',
    structure: 'Base',
    lexical: 'Lenguaje',
    sentiment: 'Arquitectura del texto',
    terms: 'Terminos y foco',
    profile: 'Perfil retorico',
    entities: 'Actores y atribucion',
    sources: 'Fuentes y apoyo',
    sourceAnatomy: 'Fuentes y apoyo',
    narrativeFrames: 'Voces y encuadre',
    perspectiveMap: 'Voces y encuadre',
    compare: 'Comparar construccion',
    comparativeCoverage: 'Cobertura comparativa',
    semanticAi: 'Ajustes avanzados',
    workflowEyebrow: 'Estado del analisis',
    workflowTitle: 'Capas activas y soporte del sistema',
    translationAi: 'Traduccion de apoyo',
    comparativeConfigTitle: 'Comparativa entre medios',
    comparativeHint: 'Busca como otros medios cubren el mismo hecho para comparar lenguaje, apoyo y encuadre.',
    semanticAssistActivate: 'Activar ahora',
    semanticAssistChooseProvider: 'Elegir proveedor',
    semanticAssistLocalOnly: 'Seguir en local',
    semanticAssistChromeReady: 'Recomendado: usar Chrome AI local. Se activa y se vuelve a analizar en un paso.',
    semanticAssistChromeUnavailable: 'Chrome AI no esta disponible aqui. Puedes configurar Ollama o seguir con analisis local.',
    semanticAssistWorking: 'Activando resumen semantico...',
    semanticAssistActivated: 'Resumen semantico activado. Vuelve a analizar para incorporarlo.',
    actionPanelTitle: 'Capas del analisis',
    actionPanelCopy: 'Activa o ajusta desde aqui las capas que enriquecen este analisis. Al cambiar una capa, el mapa se recarga arriba automaticamente.',
    actionSemanticTitle: 'Enriquecer con resumen semantico',
    actionSemanticCopy: 'Añade tema, actores, eventos clave y orientacion de lectura sobre el texto actual.',
    actionSemanticButton: 'Activar resumen semantico',
    actionTranslationTitle: 'Traducir para ampliar el mapa',
    actionTranslationCopy: 'Capa experimental desactivada en el flujo principal.',
    actionTranslationButton: 'Activar traduccion',
    actionTranslationDemoButton: 'Probar demo',
    actionComparativeTitle: 'Buscar cobertura comparativa',
    actionComparativeCopy: 'Compara como otros medios cubren el mismo hecho y detecta diferencias de encuadre.',
    actionComparativeButton: 'Activar comparativa',
    actionComparativeSetupButton: 'Configurar comparativa',
    actionOpenSettings: 'Configurar aqui',
    actionLayerActive: 'Activa',
    actionLayerAvailable: 'Lista para activar',
    actionLayerNeedsSetup: 'Necesita configuracion',
    actionLayerBusy: 'Actualizando...',
    actionLayerEnable: 'Activar',
    actionLayerDisable: 'Desactivar',
    actionLayerConfigure: 'Elegir conexion',
    actionLayerReadyHint: 'Se incorporara al siguiente reanalisis automatico.',
    actionLayerActiveHint: 'Ya esta incorporada al mapa actual.',
    actionWorking: 'Preparando mejora...',
    actionUnavailableTitle: 'No disponible ahora',
    actionSemanticUnavailable: 'El resumen semantico solo se ofrecera cuando exista una ruta estable disponible en este navegador o un servicio remoto configurado.',
    actionTranslationUnavailable: 'La traduccion asistida solo se ofrecera cuando exista un servicio remoto configurado.',
    advancedExperimentalNote: 'Los proveedores locales quedan como opciones experimentales dentro de ajustes avanzados.',
    capabilitiesTitle: 'Capacidades disponibles',
    capabilitiesHint: 'El modo simple prioriza rutas estables. Los proveedores locales quedan como opciones experimentales.',
    capabilitySemanticLabel: 'Resumen semantico',
    capabilityTranslationLabel: 'Traduccion',
    capabilityStableRemote: 'Servicio remoto listo',
    capabilityStableChrome: 'Chrome AI disponible',
    capabilityStableNone: 'Sin ruta estable',
    capabilitySemanticDetailRemote: 'El panel puede enriquecer analisis con un servicio remoto configurado.',
    capabilitySemanticDetailChrome: 'El panel puede enriquecer analisis usando Chrome AI en este navegador.',
    capabilitySemanticDetailNone: 'Configura un servicio remoto o usa Chrome AI si esta disponible para ofrecer semantica estable.',
    capabilityTranslationDetailRemote: 'El panel puede traducir articulos con un servicio remoto configurado.',
    capabilityTranslationDetailNone: 'Configura un servicio remoto para ofrecer traduccion asistida estable.',
  },
  en: {
    introTitle: 'What this panel does',
    introBody: 'It describes how the text is built: what language it uses, what support it relies on, and which voices or frames it prioritizes.',
    introNoteTitle: 'What it does not do',
    introNoteBody: 'It does not decide whether the text is true, false, or biased. It provides meta-information to better read the discourse construction.',
    groupSummary: 'Overview',
    groupLanguage: 'How it is built',
    groupSources: 'Who supports the text',
    groupVoices: 'Which framing dominates',
    groupCompare: 'Comparison',
    groupAdvanced: 'Advanced settings',
    readingMap: 'Reading summary',
    structure: 'Foundation',
    lexical: 'Language',
    sentiment: 'Text architecture',
    terms: 'Terms and focus',
    profile: 'Rhetorical profile',
    entities: 'Actors and attribution',
    sources: 'Sources and support',
    sourceAnatomy: 'Sources and support',
    narrativeFrames: 'Voices and framing',
    perspectiveMap: 'Voices and framing',
    compare: 'Compare construction',
    comparativeCoverage: 'Comparative coverage',
    semanticAi: 'Advanced settings',
    workflowEyebrow: 'Analysis state',
    workflowTitle: 'Active layers and system support',
    translationAi: 'Support translation',
    comparativeConfigTitle: 'Cross-outlet comparison',
    comparativeHint: 'Looks for how other outlets cover the same event to compare language, support, and framing.',
    semanticAssistActivate: 'Enable now',
    semanticAssistChooseProvider: 'Choose provider',
    semanticAssistLocalOnly: 'Stay local',
    semanticAssistChromeReady: 'Recommended: use local Chrome AI. It will be enabled and the analysis rerun in one step.',
    semanticAssistChromeUnavailable: 'Chrome AI is not available here. You can configure Ollama or continue with local analysis.',
    semanticAssistWorking: 'Enabling semantic summary...',
    semanticAssistActivated: 'Semantic summary enabled. Run analysis again to include it.',
    actionPanelTitle: 'Analysis layers',
    actionPanelCopy: 'Enable or adjust the layers that enrich this analysis from here. When a layer changes, the map reloads above automatically.',
    actionSemanticTitle: 'Enrich with semantic summary',
    actionSemanticCopy: 'Adds topic, actors, key events, and reading guidance for the current text.',
    actionSemanticButton: 'Enable semantic summary',
    actionTranslationTitle: 'Translate to expand the map',
    actionTranslationCopy: 'Enable assisted translation to better understand texts that do not match your output language.',
    actionTranslationButton: 'Enable translation',
    actionTranslationDemoButton: 'Try demo',
    actionComparativeTitle: 'Search comparative coverage',
    actionComparativeCopy: 'Compare how other outlets cover the same event and spot framing differences.',
    actionComparativeButton: 'Enable comparison',
    actionComparativeSetupButton: 'Set up comparison',
    actionOpenSettings: 'Configure here',
    actionLayerActive: 'Active',
    actionLayerAvailable: 'Ready to enable',
    actionLayerNeedsSetup: 'Needs setup',
    actionLayerBusy: 'Updating...',
    actionLayerEnable: 'Enable',
    actionLayerDisable: 'Disable',
    actionLayerConfigure: 'Choose connection',
    actionLayerReadyHint: 'It will be added on the next automatic re-analysis.',
    actionLayerActiveHint: 'It is already included in the current map.',
    actionWorking: 'Preparing improvement...',
    actionUnavailableTitle: 'Not available right now',
    actionSemanticUnavailable: 'Semantic summary is only offered when a stable route is available in this browser or a remote service is configured.',
    actionTranslationUnavailable: 'Assisted translation is only offered when a configured remote service is available.',
    advancedExperimentalNote: 'Local providers remain experimental options under advanced settings.',
    capabilitiesTitle: 'Available capabilities',
    capabilitiesHint: 'Simple mode prioritizes stable routes. Local providers remain experimental.',
    capabilitySemanticLabel: 'Semantic summary',
    capabilityTranslationLabel: 'Translation',
    capabilityStableRemote: 'Remote service ready',
    capabilityStableChrome: 'Chrome AI available',
    capabilityStableNone: 'No stable route',
    capabilitySemanticDetailRemote: 'The panel can enrich analysis with a configured remote service.',
    capabilitySemanticDetailChrome: 'The panel can enrich analysis using Chrome AI in this browser.',
    capabilitySemanticDetailNone: 'Configure a remote service or use Chrome AI when available to offer stable semantics.',
    capabilityTranslationDetailRemote: 'The panel can translate articles with a configured remote service.',
    capabilityTranslationDetailNone: 'Configure a remote service to offer stable assisted translation.',
  },
};
const LANGUAGE_FLAG_MAP = {
  ar: 'arab',
  de: 'de',
  en: 'gb',
  es: 'es',
  fr: 'fr',
  it: 'it',
  ja: 'jp',
  ko: 'kr',
  pt: 'pt',
  ru: 'ru',
};

const PANEL_COPY = {
  es: {
    sourceLanguageLabel: 'Texto',
    outputLanguageLabel: 'Salida',
    analyze: 'Analizar',
    retry: 'Reintentar',
    semanticAi: 'Semantica asistida',
    semanticEnabled: 'Activar resumen semantico asistido',
    semanticProvider: 'Proveedor',
    semanticEndpoint: 'URL base',
    semanticModel: 'Modelo',
    semanticSave: 'Guardar y reanalizar',
    translationAi: 'Servicio de traduccion',
    translationEnabled: 'Activar traduccion asistida',
    translationProvider: 'Proveedor',
    translationEndpoint: 'URL base',
    translationSave: 'Guardar y reanalizar',
    translationDisabledStatus: 'Traduccion asistida desactivada.',
    translationSavedStatus: 'Configuracion de traduccion guardada.',
    translationRunningStatus: 'Traduciendo contenido base...',
    translationReadyStatus: 'Traduccion disponible.',
    translationPartialStatus: 'Traduccion parcial disponible.',
    translationFailedStatus: 'No se pudo traducir el contenido.',
    semanticDisabledStatus: 'Resumen semantico desactivado.',
    semanticSavedStatus: 'Configuracion semantica guardada.',
    semanticRunningStatus: 'Generando orientacion semantica...',
    semanticReadyStatus: 'Resumen semantico disponible.',
    semanticPartialStatus: 'Resumen semantico parcial disponible.',
    semanticFailedStatus: 'No se pudo generar el resumen semantico.',
    semanticSummaryLabel: 'Resumen',
    semanticTopicLabel: 'De que va',
    semanticActorsLabel: 'Actores principales',
    semanticEventsLabel: 'Eventos clave',
    semanticPointsLabel: 'Claves de lectura',
    semanticEditorialToneLabel: 'Tono editorial',
    semanticOmittedLabel: 'Angulos omitidos',
    semanticUnsourcedLabel: 'Claims sin fuente',
    quickSummary: '💡 Resumen rapido',
    sourceMismatch: 'El idioma del texto esta forzado y no coincide con el idioma detectado del articulo.',
    compare: 'Comparativa',
    saveReference: 'Guardar referencia',
    clearReference: 'Limpiar referencia',
    compareCurrent: 'Actual',
    compareReference: 'Referencia',
    compareNoReference: 'Sin referencia comparativa guardada.',
    compareReferenceSaved: 'Referencia activa:',
    compareSummarySame: 'Comparas dos piezas con un foco cercano pero con diferencias visibles de tratamiento.',
    compareSummaryDifferent: 'Comparas dos piezas con encuadres distintos sobre un eje temático relacionado.',
    compareLengthMore: 'El articulo actual es mas largo y desarrollado que la referencia.',
    compareLengthLess: 'El articulo actual es mas corto y mas directo que la referencia.',
    compareEvidenceMore: 'El articulo actual muestra una base de apoyo mas amplia.',
    compareEvidenceLess: 'La referencia muestra una base de apoyo mas amplia.',
    compareToneSame: 'Ambos textos mantienen un tono general parecido.',
    compareToneDifferent: 'El tono general cambia de una pieza a otra.',
    compareFocusOverlap: 'Comparten foco en',
    compareFocusSplit: 'El foco narrativo se desplaza entre ambas piezas.',
    idleHtml: 'Navega a un artículo y haz clic en <strong>Analizar</strong> para examinar su estructura y sus señales léxicas.',
    loading: 'Extrayendo y analizando contenido...',
    loadingExtracting: 'Extrayendo el articulo y detectando su idioma...',
    loadingTranslating: 'Preparando una capa experimental desactivada en el flujo principal...',
    loadingSemantic: 'Generando el resumen semantico...',
    readingMap: 'Mapa de lectura',
    structure: 'Base',
    lexical: 'Lenguaje',
    sentiment: 'Arquitectura del texto',
    terms: 'Terminos y foco',
    profile: 'Perfil retorico',
    entities: 'Actores y atribucion',
    sources: 'Fuentes y apoyo',
    sourceAnatomy: 'Fuentes y apoyo',
    narrativeFrames: 'Voces y encuadre',
    perspectiveMap: 'Voces y encuadre',
    perspectiveOmittedTitle: 'Perspectivas ausentes',
    perspectiveUnsourcedTitle: 'Afirmaciones sin fuente atribuida',
    comparativeCoverage: 'Cobertura comparativa',
    comparativeConfigTitle: 'Cobertura comparativa',
    comparativeEnabled: 'Activar busqueda comparativa',
    comparativeApiKey: 'Brave API Key',
    comparativeSave: 'Guardar y reanalizar',
    comparativeDisabledStatus: 'Cobertura comparativa desactivada.',
    comparativeSavedStatus: 'Configuracion de cobertura guardada.',
    comparativeFrameDivergenceAlert: 'Marcos narrativos divergentes entre medios',
    stats: ['Palabras', 'Lectura', 'Parrafos', 'Citas', 'Links', 'Oraciones', 'Caracteres', 'Subtitulos', 'Media frase', 'Media parrafo', 'Ratio links', 'Ratio citas'],
    signalLabels: ['Densidad adjetival', 'Repeticion lexica', 'Complejidad sintactica', 'Facilidad de lectura', 'Marcas de evasion'],
    legends: ['+ Positivo', 'Neutro', 'Cargado -'],
    lexicalNote: 'Estos indices usan una escala comun de 0 a 100. Compara presencia relativa entre rasgos; las proporciones argumentales se leen aparte, en balance argumental.',
    termsNote: 'Mide la frecuencia de los terminos mas repetidos. Cuanto mas larga la barra, mas veces aparece ese foco en el articulo.',
    sentimentNote: 'Combina foco léxico, balance argumental y recorrido por párrafos para describir cómo avanza el texto.',
    profileNote: 'Este radar resume cinco dimensiones del estilo. Cuanto mas se expande cada eje, mayor peso relativo tiene esa senal en la pieza.',
    outputOptions: { auto: 'Auto', es: 'ES', en: 'EN', fr: 'FR', de: 'DE', pt: 'PT', it: 'IT', ja: 'JA' },
    sourceOptions: { auto: 'Auto', es: 'ES', en: 'EN', ja: 'JA', fr: 'FR', de: 'DE', it: 'IT', pt: 'PT', ko: 'KO', ar: 'AR', ru: 'RU' },
    workflowEyebrow: 'Proceso',
    workflowTitle: 'Que esta usando ahora mismo el sistema',
    workflowExtractionTitle: 'Extraccion',
    workflowLocalTitle: 'Analisis local',
    workflowTranslationTitle: 'Traduccion',
    workflowSemanticTitle: 'Resumen semantico',
    workflowFinalTitle: 'Mapa final',
    workflowStatusReady: 'Listo',
    workflowStatusPartial: 'Parcial',
    workflowStatusLimited: 'Limitado',
    workflowStatusDisabled: 'Desactivado',
    workflowStatusPending: 'Pendiente',
    workflowExtractionReady: 'El articulo se ha extraido con suficiente estructura para analizarlo.',
    workflowExtractionWeak: 'La extraccion es incompleta y puede afectar al resumen y al foco.',
    workflowLocalReady: 'La capa local ha calculado estructura, fuentes y señales retóricas sin red.',
    workflowLocalPartial: 'La capa local funciona, pero la extracción limita parte del mapa.',
    workflowTranslationDirect: 'No hace falta traducción adicional para este análisis local.',
    workflowTranslationReady: 'Hay traduccion previa disponible para orientar el resumen.',
    workflowTranslationPartial: 'La traduccion existe, pero no cubre el contenido con suficiente amplitud.',
    workflowTranslationOff: 'Sin traducción activa en el flujo principal.',
    workflowSemanticReady: 'El mapa final ya puede apoyarse en una capa semantica real.',
    workflowSemanticPartial: 'La capa semantica ayuda, pero su cobertura aun es parcial.',
    workflowSemanticOff: 'Sin resumen semántico. El sistema usa señales locales estructurales.',
    workflowFinalLocal: 'Mapa final local-first.',
    workflowFinalTranslated: 'Mapa final apoyado por traduccion.',
    workflowFinalSemantic: 'Mapa final apoyado por semantica.',
    workflowFinalHybrid: 'Mapa final hibrido: local + traduccion + semantica.',
    workflowFinalLimited: 'Mapa final limitado por idioma o cobertura.',
  },
  en: {
    sourceLanguageLabel: 'Text',
    outputLanguageLabel: 'Output',
    analyze: 'Analyze',
    retry: 'Retry',
    semanticAi: 'Semantic layer',
    semanticEnabled: 'Enable assisted semantic summary',
    semanticProvider: 'Provider',
    semanticEndpoint: 'Base URL',
    semanticModel: 'Model',
    semanticSave: 'Save and rerun',
    translationAi: 'Translation service',
    translationEnabled: 'Enable assisted translation',
    translationProvider: 'Provider',
    translationEndpoint: 'Base URL',
    translationSave: 'Save and rerun',
    translationDisabledStatus: 'Assisted translation disabled.',
    translationSavedStatus: 'Translation settings saved.',
    translationRunningStatus: 'Translating source content...',
    translationReadyStatus: 'Translation available.',
    translationPartialStatus: 'Partial translation available.',
    translationFailedStatus: 'Could not translate source content.',
    semanticDisabledStatus: 'Semantic summary disabled.',
    semanticSavedStatus: 'Semantic configuration saved.',
    semanticRunningStatus: 'Generating semantic orientation...',
    semanticReadyStatus: 'Semantic summary available.',
    semanticPartialStatus: 'Partial semantic summary available.',
    semanticFailedStatus: 'Could not generate semantic summary.',
    semanticSummaryLabel: 'Summary',
    semanticTopicLabel: 'What it is about',
    semanticActorsLabel: 'Main actors',
    semanticEventsLabel: 'Key events',
    semanticPointsLabel: 'Reading cues',
    semanticEditorialToneLabel: 'Editorial tone',
    semanticOmittedLabel: 'Omitted angles',
    semanticUnsourcedLabel: 'Unsourced claims',
    quickSummary: '💡 Quick brief',
    sourceMismatch: 'The text language is forced and does not match the detected article language.',
    compare: 'Comparison layer',
    saveReference: 'Save reference',
    clearReference: 'Clear reference',
    compareCurrent: 'Current',
    compareReference: 'Reference',
    compareNoReference: 'No comparison reference saved yet.',
    compareReferenceSaved: 'Active reference:',
    compareSummarySame: 'You are comparing two pieces with a related focus but visible treatment differences.',
    compareSummaryDifferent: 'You are comparing two pieces with distinct framings around a connected topic.',
    compareLengthMore: 'The current article is longer and more developed than the reference.',
    compareLengthLess: 'The current article is shorter and more direct than the reference.',
    compareEvidenceMore: 'The current article shows a broader support base.',
    compareEvidenceLess: 'The reference shows a broader support base.',
    compareToneSame: 'Both texts keep a similar overall tone.',
    compareToneDifferent: 'The overall tone shifts from one piece to the other.',
    compareFocusOverlap: 'They share a focus on',
    compareFocusSplit: 'The narrative focus shifts between both pieces.',
    idleHtml: 'Open an article and click <strong>Analyze</strong> to inspect its structure and lexical signals.',
    loading: 'Extracting and analyzing content...',
    loadingExtracting: 'Extracting the article and detecting its language...',
    loadingTranslating: 'Translating the base content into the output language...',
    loadingSemantic: 'Generating the semantic summary...',
    readingMap: 'Reading map',
    structure: 'Foundation',
    lexical: 'Language',
    sentiment: 'Text architecture',
    terms: 'Terms and focus',
    profile: 'Rhetorical profile',
    entities: 'Actors and attribution',
    sources: 'Sources and support',
    sourceAnatomy: 'Sources and support',
    narrativeFrames: 'Voices and framing',
    perspectiveMap: 'Voices and framing',
    perspectiveOmittedTitle: 'Missing perspectives',
    perspectiveUnsourcedTitle: 'Unsourced claims',
    comparativeCoverage: 'Coverage comparison',
    comparativeConfigTitle: 'Comparative coverage',
    comparativeEnabled: 'Enable comparative search',
    comparativeApiKey: 'Brave API Key',
    comparativeSave: 'Save and rerun',
    comparativeDisabledStatus: 'Comparative coverage disabled.',
    comparativeSavedStatus: 'Comparative coverage settings saved.',
    comparativeFrameDivergenceAlert: 'Divergent narrative frames across sources',
    stats: ['Words', 'Read time', 'Paragraphs', 'Quotes', 'Links', 'Sentences', 'Characters', 'Headings', 'Avg sentence', 'Avg paragraph', 'Link ratio', 'Quote ratio'],
    signalLabels: ['Adjective density', 'Lexical repetition', 'Syntactic complexity', 'Reading ease', 'Evasion markers'],
    legends: ['+ Positive', 'Neutral', 'Charged -'],
    lexicalNote: 'These indices share a common 0 to 100 scale. Compare relative presence across traits; argument proportions are shown separately in argument balance.',
    termsNote: 'This chart measures how often the main terms repeat. The longer the bar, the more often that focus appears in the article.',
    sentimentNote: 'It combines lexical focus, argumentative balance, and paragraph-by-paragraph trajectory to show how the text advances.',
    profileNote: 'This radar summarizes five style dimensions. The farther each axis expands, the more relative weight that signal has in the piece.',
    outputOptions: { auto: 'Auto', es: 'ES', en: 'EN', fr: 'FR', de: 'DE', pt: 'PT', it: 'IT', ja: 'JA' },
    sourceOptions: { auto: 'Auto', es: 'ES', en: 'EN', ja: 'JA', fr: 'FR', de: 'DE', it: 'IT', pt: 'PT', ko: 'KO', ar: 'AR', ru: 'RU' },
    workflowEyebrow: 'Process',
    workflowTitle: 'What the system is using right now',
    workflowExtractionTitle: 'Extraction',
    workflowLocalTitle: 'Local analysis',
    workflowTranslationTitle: 'Translation',
    workflowSemanticTitle: 'Semantic summary',
    workflowFinalTitle: 'Final map',
    workflowStatusReady: 'Ready',
    workflowStatusPartial: 'Partial',
    workflowStatusLimited: 'Limited',
    workflowStatusDisabled: 'Off',
    workflowStatusPending: 'Pending',
    workflowExtractionReady: 'The article has been extracted with enough structure to analyze it.',
    workflowExtractionWeak: 'Extraction is incomplete and may affect the summary and focus.',
    workflowLocalReady: 'The local layer computed structure, source anatomy and rhetoric without network access.',
    workflowLocalPartial: 'The local layer works, but weak extraction limits part of the map.',
    workflowTranslationDirect: 'No translation is needed because the article already matches the output language.',
    workflowTranslationReady: 'Pre-translation is available to support the summary.',
    workflowTranslationPartial: 'Translation is available, but coverage is still partial.',
    workflowTranslationOff: 'Translation is off. If languages differ, the summary will stay limited.',
    workflowSemanticReady: 'The final map can already rely on a real semantic layer.',
    workflowSemanticPartial: 'The semantic layer helps, but its coverage is still partial.',
    workflowSemanticOff: 'Semantic summary is off. The system will rely on local signals or pre-translation.',
    workflowFinalLocal: 'Final map is local-first.',
    workflowFinalTranslated: 'Final map is supported by translation.',
    workflowFinalSemantic: 'Final map is supported by semantics.',
    workflowFinalHybrid: 'Final map is hybrid: local + translation + semantics.',
    workflowFinalLimited: 'Final map is limited by language or coverage.',
  },
  ja: {
    sourceLanguageLabel: '原文',
    outputLanguageLabel: '出力',
    analyze: '分析',
    retry: '再試行',
    semanticAi: '意味レイヤー',
    semanticEnabled: '補助的な意味要約を使う',
    semanticProvider: 'プロバイダ',
    semanticEndpoint: 'エンドポイント',
    semanticModel: 'モデル',
    semanticSave: '保存',
    semanticDisabledStatus: '意味AIなしのローカルモードです。',
    semanticSavedStatus: '意味設定を保存しました。',
    semanticRunningStatus: '意味要約を生成しています...',
    semanticReadyStatus: '意味要約を取得しました。',
    semanticFailedStatus: '意味要約を生成できませんでした。',
    idleHtml: '記事を開いて<strong>分析</strong>を押すと、構造と語彙シグナルを確認できます。',
    loading: '抽出と分析を実行しています...',
    readingMap: '読解マップ',
    structure: '構造',
    lexical: '語彙シグナル',
    sentiment: '感情の流れ',
    terms: '頻出語',
    profile: '文体プロファイル',
    entities: '検出した固有名詞',
    sources: '外部ソース',
    stats: ['語数', '読了時間', '段落', '引用', 'リンク', '文数'],
    signalLabels: ['形容の密度', '語彙の反復', '文の複雑さ'],
    legends: ['+ 前向き', '中立', '強め -'],
    outputOptions: { auto: 'Auto', es: 'ES', en: 'EN', fr: 'FR', de: 'DE', pt: 'PT', it: 'IT', ja: 'JA' },
    sourceOptions: { auto: 'Auto', es: 'ES', en: 'EN', ja: 'JA', fr: 'FR', de: 'DE', it: 'IT', pt: 'PT', ko: 'KO', ar: 'AR', ru: 'RU' },
  },
};

const DEFAULT_SEMANTIC_CONFIG = {
  enabled: false,
  provider: 'auto',
  endpoint: '',
  model: '',
};

const DEFAULT_COMPARATIVE_CONFIG = {
  enabled: false,
  apiKey: '',
};

const DEFAULT_TRANSLATION_CONFIG = {
  enabled: false,
  provider: 'auto',
  endpoint: '',
};

const btnAnalyze = document.getElementById('btn-analyze');
const btnRetry = document.getElementById('btn-retry');
const stateIdle = document.getElementById('state-idle');
const stateLoad = document.getElementById('state-loading');
const stateErr = document.getElementById('state-error');
const errorMsg = document.getElementById('error-message');
const panelMain = document.getElementById('panel-content');
const semanticEnabledInput = document.getElementById('semantic-ai-enabled');
const translationEnabledInput = document.getElementById('translation-ai-enabled');
const translationProviderInput = document.getElementById('translation-provider');
const translationEndpointInput = document.getElementById('translation-endpoint');
const semanticProviderInput = document.getElementById('semantic-provider');
const semanticEndpointInput = document.getElementById('semantic-endpoint');
const semanticModelInput = document.getElementById('semantic-model');
const semanticSaveButton = document.getElementById('btn-semantic-save');
const translationSaveButton = document.getElementById('btn-translation-save');
const semanticStatus = document.getElementById('semantic-status');
const translationStatus = document.getElementById('translation-status');
const analysisActions = document.getElementById('analysis-actions');
const analysisActionsTitle = document.getElementById('analysis-actions-title');
const analysisActionsCopy = document.getElementById('analysis-actions-copy');
const analysisActionsList = document.getElementById('analysis-actions-list');
const semanticQuickEnableButton = document.getElementById('btn-semantic-quick-enable');
const semanticOpenSettingsButton = document.getElementById('btn-semantic-open-settings');
const semanticLocalOnlyButton = document.getElementById('btn-semantic-local-only');
const semanticAssist = document.getElementById('workflow-semantic-assist');
const semanticAssistMeta = document.getElementById('workflow-semantic-assist-meta');
const compareSaveButton = document.getElementById('btn-save-reference');
const compareClearButton = document.getElementById('btn-clear-reference');
const comparativeEnabledInput = document.getElementById('comparative-enabled');
const comparativeApiKeyInput = document.getElementById('comparative-apikey');
const comparativeSaveButton = document.getElementById('btn-comparative-save');
const comparativeStatus = document.getElementById('comparative-status');
const capabilitySemanticPrimary = document.getElementById('capability-semantic-primary');
const capabilitySemanticDetail = document.getElementById('capability-semantic-detail');
const capabilityTranslationPrimary = document.getElementById('capability-translation-primary');
const capabilityTranslationDetail = document.getElementById('capability-translation-detail');

let currentAnalysisData = null;
let compareReferenceData = null;
let currentLocale = resolveOutputLocale('auto');
let eventsBound = false;
let semanticAssistDismissed = false;
let analysisActionBusyKind = '';
let analysisActionConfigKind = '';

function setState(state) {
  stateIdle.hidden = state !== 'idle';
  stateLoad.hidden = state !== 'loading';
  stateErr.hidden = state !== 'error';
  panelMain.hidden = state !== 'ready';
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveOutputLocale(preference) {
  const base = String(preference || 'auto').toLowerCase().split('-')[0];
  if (base !== 'auto' && OUTPUT_LOCALES.includes(base)) return base;
  const browserBase = String(navigator.language || 'en').toLowerCase().split('-')[0];
  return OUTPUT_LOCALES.includes(browserBase) ? browserBase : 'en';
}

function normalizeSourceLanguage(preference) {
  const base = String(preference || 'auto').toLowerCase().split('-')[0];
  return SOURCE_LANGUAGES.includes(base) ? base : 'auto';
}

function getOutputLanguagePreference(fallback = 'auto') {
  return resolveOutputLocale(fallback || currentLocale || 'auto');
}

function getSourceLanguagePreference() {
  return 'auto';
}

function getPanelCopy(locale) {
  return PANEL_COPY[resolveOutputLocale(locale)] || PANEL_COPY.en;
}

function getFrameCopy(locale) {
  return PANEL_FRAME_COPY[resolveOutputLocale(locale)] || PANEL_FRAME_COPY.en;
}

function getPreferredSemanticQuickConfig(chromeAvailable) {
  return chromeAvailable
    ? { enabled: true, provider: 'auto', endpoint: '', model: '' }
    : null;
}

function getPreferredTranslationQuickConfig() {
  const current = normalizeTranslationConfig(collectTranslationConfig());
  if (!current.endpoint) return null;
  return {
    enabled: true,
    provider: 'auto',
    endpoint: current.endpoint,
    userConfigured: true,
  };
}

function buildCacheKey(url, sourceLanguage, outputLanguage, semanticConfig, translationConfig, comparativeConfig) {
  const pipelineVersion = 'pipeline-v3';
  const semanticSignature = semanticConfig?.enabled
    ? `${semanticConfig.provider}:${semanticConfig.endpoint}:${semanticConfig.model}:${outputLanguage}`
    : 'semantic-off';
  const translationSignature = translationConfig?.enabled
    ? `${translationConfig.provider}:${translationConfig.endpoint}:${outputLanguage}`
    : 'translation-off';
  const comparativeSignature = comparativeConfig?.enabled ? 'comp-on' : 'comp-off';
  return `${pipelineVersion}::${url}::${normalizeSourceLanguage(sourceLanguage)}::${semanticSignature}::${translationSignature}::${comparativeSignature}`;
}

function normalizeSemanticConfig(config = {}) {
  return {
    enabled: Boolean(config.enabled),
    provider: config.provider || DEFAULT_SEMANTIC_CONFIG.provider,
    endpoint: String(config.endpoint || DEFAULT_SEMANTIC_CONFIG.endpoint).trim(),
    model: String(config.model || DEFAULT_SEMANTIC_CONFIG.model).trim(),
  };
}

function normalizeTranslationConfig(config = {}) {
  const userConfigured = config.userConfigured === true;
  const hasExplicitEnabled = typeof config.enabled === 'boolean';

  return {
    enabled: hasExplicitEnabled ? Boolean(config.enabled) : DEFAULT_TRANSLATION_CONFIG.enabled,
    provider: config.provider || DEFAULT_TRANSLATION_CONFIG.provider,
    endpoint: String(config.endpoint || DEFAULT_TRANSLATION_CONFIG.endpoint).trim(),
    userConfigured,
  };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function cacheGet(cacheKey) {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'CACHE_GET', url: cacheKey });
    return res?.data ?? null;
  } catch {
    return null;
  }
}

async function cacheSet(cacheKey, data) {
  try {
    await chrome.runtime.sendMessage({ type: 'CACHE_SET', url: cacheKey, data });
  } catch {
    // non-fatal
  }
}

async function readPreference(storageKey, fallback) {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    return stored?.[storageKey] ?? fallback;
  } catch {
    return fallback;
  }
}

async function savePreference(storageKey, value) {
  try {
    await chrome.storage.local.set({ [storageKey]: value });
  } catch {
    // non-fatal
  }
}

function fillSelect(select, optionsMap, values, preference) {
  select.innerHTML = values.map((value) => (
    `<option value="${value}">${optionsMap[value] || value.toUpperCase()}</option>`
  )).join('');
  select.value = preference;
  if (!values.includes(select.value)) select.value = values[0];
  updateLanguageSelectVisual(select);
}

function resolveFlagCode(language) {
  return LANGUAGE_FLAG_MAP[String(language || 'auto').toLowerCase()] || 'xx';
}

function resolveLanguageBadge(language) {
  if (String(language || 'auto').toLowerCase() === 'auto') return AUTO_LANGUAGE_BADGE;
  return `url("img/flags/${resolveFlagCode(language)}.svg")`;
}

function updateLanguageSelectVisual(select) {
  if (!select?.classList?.contains('reading-panel__lang-select--flagged')) return;
  select.style.setProperty('--select-flag-image', resolveLanguageBadge(select.value));
}

function populateLanguageSelects(outputPreference, sourcePreference) {
  currentLocale = resolveOutputLocale(outputPreference || sourcePreference || 'auto');
}

function populateSemanticConfig(config) {
  const normalized = normalizeSemanticConfig(config);
  semanticEnabledInput.checked = normalized.enabled;
  semanticProviderInput.value = normalized.provider;
  semanticEndpointInput.value = normalized.endpoint;
  semanticModelInput.value = normalized.model;
}

function populateTranslationConfig(config) {
  const normalized = normalizeTranslationConfig(config);
  translationEnabledInput.checked = normalized.enabled;
  translationProviderInput.value = normalized.provider;
  translationEndpointInput.value = normalized.endpoint;
}

function collectSemanticConfig() {
  if (!ENABLE_EXPERIMENTAL_LAYERS) return { ...DEFAULT_SEMANTIC_CONFIG };
  return normalizeSemanticConfig({
    enabled: semanticEnabledInput.checked,
    provider: semanticProviderInput.value,
    endpoint: semanticEndpointInput.value,
    model: semanticModelInput.value,
  });
}

function collectTranslationConfig() {
  if (!ENABLE_EXPERIMENTAL_LAYERS) return { ...DEFAULT_TRANSLATION_CONFIG };
  return normalizeTranslationConfig({
    enabled: translationEnabledInput.checked,
    provider: translationProviderInput.value,
    endpoint: translationEndpointInput.value,
    userConfigured: true,
  });
}

function normalizeComparativeConfig(config = {}) {
  return {
    enabled: Boolean(config.enabled),
    apiKey: String(config.apiKey || '').trim(),
  };
}

function populateComparativeConfig(config) {
  const normalized = normalizeComparativeConfig(config);
  if (comparativeEnabledInput) comparativeEnabledInput.checked = normalized.enabled;
  if (comparativeApiKeyInput) comparativeApiKeyInput.value = normalized.apiKey;
}

function collectComparativeConfig() {
  if (!ENABLE_EXPERIMENTAL_LAYERS) return { ...DEFAULT_COMPARATIVE_CONFIG };
  return normalizeComparativeConfig({
    enabled: comparativeEnabledInput?.checked ?? false,
    apiKey: comparativeApiKeyInput?.value ?? '',
  });
}

async function saveComparativeConfig() {
  const config = collectComparativeConfig();
  await savePreference(STORAGE_KEY_COMPARATIVE_CONFIG, config);
  if (comparativeStatus) {
    comparativeStatus.textContent = getPanelCopy(getOutputLanguagePreference()).comparativeSavedStatus;
  }
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
}

function setSemanticStatus(text) {
  semanticStatus.textContent = text;
}

function setTranslationStatus(text) {
  translationStatus.textContent = text;
}

function setLoadingCopy(text) {
  const node = document.getElementById('state-loading-copy');
  if (node) node.textContent = text;
}

function focusReadingMap() {
  document.getElementById('card-reading-map')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function getActionPanelCopy(locale) {
  return { ...PANEL_FRAME_COPY.en, ...getFrameCopy(locale) };
}

function buildActionPresets({
  kind,
  semanticCapability,
  semanticConfig,
  translationConfig,
  comparativeConfig,
}) {
  if (kind === 'semantic') {
    const presets = [];
    if (semanticCapability?.chromeAvailable) {
      presets.push({ id: 'chrome-ai', label: 'Chrome AI' });
    }
    if (semanticConfig?.endpoint) {
      presets.push({ id: 'remote', label: 'Remoto guardado' });
    }
    if (semanticConfig?.endpoint && semanticConfig?.model) {
      presets.push({ id: 'ollama', label: 'Ollama guardado' });
    }
    return presets;
  }

  if (kind === 'translation') {
    const presets = [{ id: 'mock', label: 'Probar demo' }];
    if (translationConfig?.endpoint) {
      presets.push({ id: 'remote', label: 'Remoto guardado' });
      if (translationConfig.provider === 'libretranslate') {
        presets.push({ id: 'libretranslate', label: 'LibreTranslate' });
      }
    }
    return presets;
  }

  if (comparativeConfig?.apiKey) {
    return [{ id: 'brave', label: 'Brave guardado' }];
  }

  return [];
}

function renderInlineActionConfig(action, copy) {
  if (analysisActionConfigKind !== action.kind) return '';

  if (action.kind === 'semantic') {
    const config = normalizeSemanticConfig(collectSemanticConfig());
    return `
      <div class="mol-analysis-action__config" data-inline-config="${action.kind}">
        <p class="mol-analysis-action__helper">Monitora no incluye este servicio. Elige una conexión real: Chrome AI en este navegador, Ollama en local o tu propia API.</p>
        <label class="mol-analysis-action__field">
          <span>${esc(copy.semanticProvider || 'Proveedor')}</span>
          <select class="reading-panel__lang-select" data-inline-field="provider">
            <option value="auto" ${config.provider === 'auto' ? 'selected' : ''}>Auto (usar lo que ya este listo)</option>
            <option value="remote" ${config.provider === 'remote' ? 'selected' : ''}>Tu API de resumen</option>
            <option value="chrome-ai" ${config.provider === 'chrome-ai' ? 'selected' : ''}>Chrome AI (local)</option>
            <option value="ollama" ${config.provider === 'ollama' ? 'selected' : ''}>Ollama (experimental)</option>
          </select>
        </label>
        <label class="mol-analysis-action__field">
          <span>${esc(copy.semanticEndpoint || 'URL base')}</span>
          <input class="mol-semantic-settings__input" type="text" data-inline-field="endpoint" value="${esc(config.endpoint)}" placeholder="http://127.0.0.1:5000">
          <small class="mol-analysis-action__microcopy">Monitora llamará a <code>/semantic-summary</code> sobre esa URL.</small>
        </label>
        <label class="mol-analysis-action__field">
          <span>${esc(copy.semanticModel || 'Modelo')}</span>
          <input class="mol-semantic-settings__input" type="text" data-inline-field="model" value="${esc(config.model)}" placeholder="qwen2.5:3b-instruct">
          <small class="mol-analysis-action__microcopy">Solo hace falta si eliges Ollama.</small>
        </label>
        <div class="mol-analysis-action__config-actions">
          <button class="atom-btn atom-btn--secondary atom-btn--size-sm" data-analysis-inline-save="${action.kind}">${esc(copy.semanticSave || 'Guardar')}</button>
          <button class="atom-btn atom-btn--ghost atom-btn--size-sm" data-analysis-inline-cancel="${action.kind}">Cancelar</button>
        </div>
      </div>`;
  }

  if (action.kind === 'translation') {
    const config = normalizeTranslationConfig(collectTranslationConfig());
    return `
      <div class="mol-analysis-action__config" data-inline-config="${action.kind}">
        <p class="mol-analysis-action__helper">Para traducir necesitas una conexion real. Si no tienes una API propia, este bloque no funcionara todavia.</p>
        <label class="mol-analysis-action__field">
          <span>${esc(copy.translationProvider || 'Proveedor')}</span>
          <select class="reading-panel__lang-select" data-inline-field="provider">
            <option value="auto" ${config.provider === 'auto' ? 'selected' : ''}>Auto (usar lo que ya este listo)</option>
            <option value="remote" ${config.provider === 'remote' ? 'selected' : ''}>Tu API de traduccion</option>
            <option value="libretranslate" ${config.provider === 'libretranslate' ? 'selected' : ''}>LibreTranslate (experimental)</option>
            <option value="mock" ${config.provider === 'mock' ? 'selected' : ''}>Mock / Dev</option>
          </select>
        </label>
        <label class="mol-analysis-action__field">
          <span>${esc(copy.translationEndpoint || 'URL base')}</span>
          <input class="mol-semantic-settings__input" type="text" data-inline-field="endpoint" value="${esc(config.endpoint)}" placeholder="http://127.0.0.1:5000">
        </label>
        <div class="mol-analysis-action__config-actions">
          <button class="atom-btn atom-btn--secondary atom-btn--size-sm" data-analysis-inline-save="${action.kind}">${esc(copy.translationSave || 'Guardar')}</button>
          <button class="atom-btn atom-btn--ghost atom-btn--size-sm" data-analysis-inline-cancel="${action.kind}">Cancelar</button>
        </div>
      </div>`;
  }

  const config = normalizeComparativeConfig(collectComparativeConfig());
  return `
    <div class="mol-analysis-action__config" data-inline-config="${action.kind}">
      <p class="mol-analysis-action__helper">La comparativa usa Brave Search. Solo necesitas pegar tu API key y Monitora relanzará el análisis.</p>
      <label class="mol-analysis-action__field">
        <span>${esc(copy.comparativeApiKey || 'Brave API Key')}</span>
        <input class="mol-semantic-settings__input" type="password" data-inline-field="apiKey" value="${esc(config.apiKey)}" placeholder="BSA...">
      </label>
      <div class="mol-analysis-action__config-actions">
        <button class="atom-btn atom-btn--secondary atom-btn--size-sm" data-analysis-inline-save="${action.kind}">${esc(copy.comparativeSave || 'Guardar')}</button>
        <button class="atom-btn atom-btn--ghost atom-btn--size-sm" data-analysis-inline-cancel="${action.kind}">Cancelar</button>
      </div>
    </div>`;
}

function semanticStatusText(copy, semanticLayer) {
  const providerLabel = semanticLayer?.provider ? ` (${semanticLayer.provider})` : '';
  if (!semanticLayer?.available) {
    if (semanticLayer?.status === 'disabled') {
      return semanticLayer?.actionable
        ? `${copy.semanticDisabledStatus} ${semanticLayer.actionable}`
        : copy.semanticDisabledStatus;
    }
    return semanticLayer?.reason
      ? `${copy.semanticFailedStatus}${providerLabel} ${semanticLayer.reason}${semanticLayer.actionable ? ` ${semanticLayer.actionable}` : ''}`
      : copy.semanticDisabledStatus;
  }

  if (semanticLayer.status === 'partial') return `${copy.semanticPartialStatus || copy.semanticReadyStatus}${providerLabel}`;
  return `${copy.semanticReadyStatus}${providerLabel}`;
}

function translationStatusText(copy, translationLayer) {
  const providerLabel = translationLayer?.provider ? ` (${translationLayer.provider})` : '';
  if (!translationLayer?.available) {
    if (translationLayer?.status === 'direct') return copy.summaryTranslationDirect || copy.translationReadyStatus;
    if (translationLayer?.status === 'disabled') {
      return translationLayer?.actionable
        ? `${copy.translationDisabledStatus} ${translationLayer.actionable}`
        : copy.translationDisabledStatus;
    }
    return translationLayer?.reason
      ? `${copy.translationFailedStatus}${providerLabel} ${translationLayer.reason}${translationLayer.actionable ? ` ${translationLayer.actionable}` : ''}`
      : copy.translationDisabledStatus;
  }

  if (translationLayer.status === 'partial') return `${copy.translationPartialStatus || copy.translationReadyStatus}${providerLabel}`;
  return `${copy.translationReadyStatus}${providerLabel}`;
}

function workflowStatusClass(level) {
  if (level === 'ready') return 'is-ok';
  if (level === 'partial' || level === 'limited') return 'is-warn';
  return 'is-off';
}

function renderWorkflowStep(kind, title, status, text, level) {
  setNodeText(`workflow-${kind}-title`, title);
  setNodeText(`workflow-${kind}-status`, status);
  setNodeText(`workflow-${kind}-copy`, text);
  const card = document.getElementById(`workflow-step-${kind}`);
  if (card) {
    card.classList.remove('is-ok', 'is-warn', 'is-off');
    card.classList.add(workflowStatusClass(level));
  }
}

async function refreshSemanticAssist() {
  if (!ENABLE_EXPERIMENTAL_LAYERS) {
    if (semanticAssist) semanticAssist.hidden = true;
    return;
  }
  if (!semanticAssist || !semanticQuickEnableButton || !semanticOpenSettingsButton || !semanticLocalOnlyButton || !semanticAssistMeta) return;

  const frameCopy = getFrameCopy(getOutputLanguagePreference(currentLocale));
  const semanticEnabled = Boolean(semanticEnabledInput?.checked);
  if (currentAnalysisData || semanticEnabled || semanticAssistDismissed) {
    semanticAssist.hidden = true;
    return;
  }

  const capability = await resolveSemanticCapability(collectSemanticConfig());
  semanticAssist.hidden = false;
  semanticQuickEnableButton.textContent = frameCopy.semanticAssistActivate;
  semanticOpenSettingsButton.textContent = frameCopy.semanticAssistChooseProvider;
  semanticLocalOnlyButton.textContent = frameCopy.semanticAssistLocalOnly;
  semanticQuickEnableButton.disabled = !capability.recommended;
  semanticAssistMeta.textContent = capability.recommended
    ? frameCopy.semanticAssistChromeReady
    : frameCopy.semanticAssistChromeUnavailable;
}

async function renderAnalysisActions(vm) {
  if (!ENABLE_EXPERIMENTAL_LAYERS) {
    if (analysisActions) analysisActions.hidden = true;
    return;
  }
  if (!analysisActions || !analysisActionsList || !analysisActionsTitle || !analysisActionsCopy || !currentAnalysisData) return;

  const frameCopy = getActionPanelCopy(vm.locale);
  const translationConfig = normalizeTranslationConfig(collectTranslationConfig());
  const comparativeConfig = normalizeComparativeConfig(collectComparativeConfig());
  const semanticCapability = await resolveSemanticCapability(collectSemanticConfig());
  const translationCapability = resolveTranslationCapability(collectTranslationConfig());
  const translationLayer = currentAnalysisData.capa_traduccion || {};
  const semanticLayer = currentAnalysisData.capa_semantica_ai || {};
  const comparativeLayer = currentAnalysisData.cobertura_comparativa || {};
  const articleLanguage = currentAnalysisData.capa_semantica?.articleLanguage || currentAnalysisData.meta?.language || 'unknown';
  const outputLanguage = getOutputLanguagePreference(vm.locale);
  const articleNeedsTranslation = articleLanguage && articleLanguage !== 'unknown' && outputLanguage !== 'auto' && articleLanguage !== outputLanguage;
  const actions = [
    {
      kind: 'semantic',
      title: frameCopy.actionSemanticTitle,
      copy: semanticLayer.status === 'failed'
        ? [semanticLayer.reason, semanticLayer.actionable].filter(Boolean).join(' ')
        : vm.semanticLayer.available
        ? `${frameCopy.actionSemanticCopy} ${frameCopy.actionLayerActiveHint}`
        : semanticCapability.recommended
          ? `${frameCopy.actionSemanticCopy} ${frameCopy.actionLayerReadyHint}`
          : `${frameCopy.actionSemanticUnavailable} ${frameCopy.advancedExperimentalNote}`,
      state: semanticLayer.status === 'failed'
        ? 'setup'
        : vm.semanticLayer.available
          ? 'active'
          : semanticCapability.recommended
            ? 'available'
            : 'setup',
      primaryLabel: vm.semanticLayer.available ? frameCopy.actionLayerDisable : semanticCapability.recommended ? frameCopy.actionLayerEnable : '',
      secondaryLabel: frameCopy.actionOpenSettings,
    },
    {
      kind: 'translation',
      title: frameCopy.actionTranslationTitle,
      copy: translationLayer.status === 'direct'
        ? translationStatusText(getPanelCopy(vm.locale), translationLayer)
        : translationLayer.available
          ? `${frameCopy.actionTranslationCopy} ${frameCopy.actionLayerActiveHint}`
          : translationCapability.recommended
            ? `${frameCopy.actionTranslationCopy} ${articleNeedsTranslation ? frameCopy.actionLayerReadyHint : frameCopy.actionTranslationCopy}`
            : `${frameCopy.actionTranslationUnavailable} ${frameCopy.advancedExperimentalNote}`,
      state: translationLayer.status === 'direct'
        ? 'active'
        : translationLayer.available
          ? 'active'
          : translationCapability.recommended
            ? 'available'
            : 'setup',
      primaryLabel: (translationLayer.status === 'direct' || translationLayer.available)
        ? frameCopy.actionLayerDisable
        : translationCapability.recommended
          ? frameCopy.actionLayerEnable
          : frameCopy.actionTranslationDemoButton,
      secondaryLabel: frameCopy.actionOpenSettings,
    },
    {
      kind: 'comparative',
      title: frameCopy.actionComparativeTitle,
      copy: comparativeLayer.status === 'failed'
        ? comparativeLayer.reason || `${frameCopy.actionComparativeCopy} ${frameCopy.actionLayerNeedsSetup}.`
        : vm.comparativeCoverage?.available
        ? `${frameCopy.actionComparativeCopy} ${frameCopy.actionLayerActiveHint}`
        : comparativeConfig.apiKey
          ? `${frameCopy.actionComparativeCopy} ${frameCopy.actionLayerReadyHint}`
          : `${frameCopy.actionComparativeCopy} ${frameCopy.actionLayerNeedsSetup}.`,
      state: vm.comparativeCoverage?.available
        ? 'active'
        : comparativeLayer.status === 'failed'
          ? 'setup'
        : comparativeConfig.apiKey
          ? 'available'
          : 'setup',
      primaryLabel: vm.comparativeCoverage?.available
        ? frameCopy.actionLayerDisable
        : comparativeConfig.apiKey
          ? frameCopy.actionLayerEnable
          : '',
      secondaryLabel: frameCopy.actionOpenSettings,
    },
  ];

  analysisActions.hidden = false;

  analysisActionsTitle.textContent = frameCopy.actionPanelTitle;
  analysisActionsCopy.textContent = frameCopy.actionPanelCopy;
  analysisActionsList.innerHTML = actions.map((action) => `
    <article class="mol-analysis-action is-${action.state}" data-action-kind="${action.kind}">
      <div class="mol-analysis-action__body">
        <div class="mol-analysis-action__meta">
          <span class="mol-analysis-action__state mol-analysis-action__state--${action.state}">${esc(
            action.kind === analysisActionBusyKind
              ? frameCopy.actionLayerBusy
              : action.state === 'active'
                ? frameCopy.actionLayerActive
                : action.state === 'available'
                  ? frameCopy.actionLayerAvailable
                  : frameCopy.actionLayerNeedsSetup
          )}</span>
        </div>
        <p class="mol-analysis-action__title">${esc(action.title)}</p>
        <p class="mol-analysis-action__copy">${esc(action.copy)}</p>
      </div>
      <div class="mol-analysis-action__actions">
        ${action.primaryLabel ? `<button class="atom-btn atom-btn--secondary atom-btn--size-sm" data-analysis-action="${action.kind}" data-analysis-state="${action.state}" ${action.kind === analysisActionBusyKind ? 'disabled' : ''}>${esc(action.primaryLabel)}</button>` : ''}
        ${action.secondaryLabel ? `<button class="atom-btn atom-btn--ghost atom-btn--size-sm" data-analysis-settings="${action.kind}" ${action.kind === analysisActionBusyKind ? 'disabled' : ''}>${esc(action.secondaryLabel)}</button>` : ''}
      </div>
      ${renderInlineActionConfig(action, getPanelCopy(vm.locale))}
    </article>
  `).join('');
}

function setNodeText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

async function refreshCapabilityStatus(locale) {
  const frameCopy = getFrameCopy(getOutputLanguagePreference(locale || currentLocale));
  setNodeText('title-capabilities', frameCopy.capabilitiesTitle);
  setNodeText('capabilities-hint', frameCopy.capabilitiesHint);
  setNodeText('label-capability-semantic', frameCopy.capabilitySemanticLabel);
  setNodeText('label-capability-translation', frameCopy.capabilityTranslationLabel);

  const semanticCapability = await resolveSemanticCapability(collectSemanticConfig());
  const translationCapability = resolveTranslationCapability(collectTranslationConfig());

  if (capabilitySemanticPrimary && capabilitySemanticDetail) {
    if (semanticCapability.remoteReady) {
      capabilitySemanticPrimary.textContent = frameCopy.capabilityStableRemote;
      capabilitySemanticDetail.textContent = frameCopy.capabilitySemanticDetailRemote;
    } else if (semanticCapability.chromeAvailable) {
      capabilitySemanticPrimary.textContent = frameCopy.capabilityStableChrome;
      capabilitySemanticDetail.textContent = frameCopy.capabilitySemanticDetailChrome;
    } else {
      capabilitySemanticPrimary.textContent = frameCopy.capabilityStableNone;
      capabilitySemanticDetail.textContent = frameCopy.capabilitySemanticDetailNone;
    }
  }

  if (capabilityTranslationPrimary && capabilityTranslationDetail) {
    if (translationCapability.remoteReady) {
      capabilityTranslationPrimary.textContent = frameCopy.capabilityStableRemote;
      capabilityTranslationDetail.textContent = frameCopy.capabilityTranslationDetailRemote;
    } else {
      capabilityTranslationPrimary.textContent = frameCopy.capabilityStableNone;
      capabilityTranslationDetail.textContent = frameCopy.capabilityTranslationDetailNone;
    }
  }
}

function renderSentimentStrip(sentimentArc) {
  const strip = document.getElementById('sentiment-strip');
  const rail = document.getElementById('sentiment-rail');
  if (!strip) return;

  strip.innerHTML = '';
  if (rail) rail.innerHTML = '';
  const scores = Array.isArray(sentimentArc?.scores) ? sentimentArc.scores : [];
  if (!scores.length) {
    if (rail) rail.hidden = true;
    return;
  }

  const maxIntensity = Math.max(...scores.map((score) => Math.abs(score)), 1);
  scores.forEach((score, index) => {
    const segment = document.createElement('span');
    const tone = score > 20 ? 'positive' : score < -20 ? 'charged' : 'neutral';
    const intensity = Math.max(0.28, Math.abs(score) / maxIntensity);
    segment.className = `mol-sentiment-strip__segment mol-sentiment-strip__segment--${tone}`;
    segment.style.setProperty('--segment-intensity', intensity.toFixed(2));
    segment.title = `P${index + 1}: ${score > 0 ? '+' : ''}${score}`;
    segment.setAttribute('aria-label', `P${index + 1}: ${score > 0 ? '+' : ''}${score}`);
    strip.appendChild(segment);
  });

  if (!rail || !Array.isArray(sentimentArc?.rail) || !sentimentArc.rail.length) {
    if (rail) rail.hidden = true;
    return;
  }

  rail.hidden = false;
  const labels = sentimentArc.labels || {};
  rail.innerHTML = sentimentArc.rail.map((item) => {
    const tags = [
      item.isStart ? labels.start || 'Start' : '',
      item.isPeak ? labels.peak || 'Peak' : '',
      item.isEnd ? labels.end || 'End' : '',
    ].filter(Boolean);
    return `
      <article class="mol-sentiment-step mol-sentiment-step--${item.tone}" aria-label="P${item.id}: ${esc(item.toneLabel)}">
        <div class="mol-sentiment-step__bar" data-tone="${item.tone}" style="--step-intensity:${Math.max(0.34, Math.abs(item.score) / maxIntensity).toFixed(2)}"></div>
        <div class="mol-sentiment-step__meta">
          <span class="mol-sentiment-step__index">P${item.id}</span>
          <span class="mol-sentiment-step__tone">${esc(item.toneLabel)}</span>
        </div>
        ${tags.length ? `<div class="mol-sentiment-step__tags">${tags.map((tag) => `<span class="mol-sentiment-step__tag">${esc(tag)}</span>`).join('')}</div>` : ''}
      </article>`;
  }).join('');
}

function renderLexicalResources(resources) {
  const block = document.getElementById('lexical-resources-block');
  const list = document.getElementById('lexical-resources-list');
  if (!block || !list) return;

  const items = Array.isArray(resources) ? resources.filter((item) => item.count > 0 || item.score > 0) : [];
  block.hidden = items.length === 0;
  if (!items.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = items.map((item) => `
    <div class="mol-lexical-resource">
      <div class="mol-lexical-resource__head">
        <span class="mol-lexical-resource__label">${esc(item.label)}</span>
        <span class="mol-lexical-resource__value">${item.count}</span>
      </div>
      <div class="mol-lexical-resource__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.score}">
        <div class="mol-lexical-resource__fill" data-level="${item.level}" style="width:${item.score}%"></div>
      </div>
    </div>
  `).join('');
}

function renderDiscourseFocus(terms, locale) {
  const block = document.getElementById('discourse-focus-block');
  const list = document.getElementById('discourse-focus-list');
  if (!block || !list) return;

  const items = Array.isArray(terms) ? terms.filter((item) => item?.term && item?.count).slice(0, 5) : [];
  block.hidden = items.length === 0;
  if (!items.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = items.map((item) => `
    <span class="mol-discourse-focus__chip">
      <span class="mol-discourse-focus__term">${esc(item.term)}</span>
      <span class="mol-discourse-focus__count">${item.count}${locale === 'en' ? ' mentions' : ' menciones'}</span>
    </span>
  `).join('');
}

function renderDiscourseBalance(signals, locale) {
  const block = document.getElementById('discourse-balance-block');
  const list = document.getElementById('discourse-balance-list');
  if (!block || !list) return;

  const labels = {
    'eio-evidence': locale === 'en' ? 'Evidence' : 'Evidencia',
    'eio-interpretation': locale === 'en' ? 'Interpretation' : 'Interpretacion',
    'eio-opinion': locale === 'en' ? 'Opinion' : 'Opinion',
  };
  const tones = {
    'eio-evidence': 'evidence',
    'eio-interpretation': 'interpretation',
    'eio-opinion': 'opinion',
  };
  const items = Array.isArray(signals)
    ? signals.filter((item) => labels[item.id]).map((item) => ({
      label: labels[item.id],
      score: Number(item.score) || 0,
      tone: tones[item.id],
    }))
    : [];

  block.hidden = items.length === 0;
  if (!items.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = items.map((item) => `
    <div class="mol-discourse-balance__row">
      <span class="mol-discourse-balance__label">${esc(item.label)}</span>
      <span class="mol-discourse-balance__value">${item.score}%</span>
      <div class="mol-discourse-balance__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.score}">
        <div class="mol-discourse-balance__fill" data-tone="${item.tone}" style="width:${item.score}%"></div>
      </div>
    </div>
  `).join('');
}

function renderInlineIcon(name, title = '') {
  const icons = {
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6" rx="1.8"/><path d="M5.5 7V5.6a2.5 2.5 0 0 1 5 0V7"/></svg>',
    alert: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2 14 13H2L8 2.2Z"/><path d="M8 5.8v3.2"/><circle cx="8" cy="11.3" r=".6" fill="currentColor" stroke="none"/></svg>',
    users: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="11.2" cy="6.8" r="1.6"/><path d="M2.8 12c.7-1.8 2.1-2.7 4.2-2.7S10.5 10.2 11.2 12"/><path d="M9.8 11.6c.4-1.1 1.2-1.7 2.5-1.7 1 0 1.7.4 2.2 1.2"/></svg>',
    link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.3 9.7 4.9 11a2.3 2.3 0 1 1-3.2-3.2L3 6.4"/><path d="m9.7 6.3 1.4-1.3a2.3 2.3 0 1 1 3.2 3.2L13 9.6"/><path d="M5.5 10.5 10.5 5.5"/></svg>',
    scan: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5H3.7A1.2 1.2 0 0 0 2.5 3.7V5"/><path d="M11 2.5h1.3a1.2 1.2 0 0 1 1.2 1.2V5"/><path d="M13.5 11v1.3a1.2 1.2 0 0 1-1.2 1.2H11"/><path d="M5 13.5H3.7a1.2 1.2 0 0 1-1.2-1.2V11"/><path d="M5 8h6"/><path d="M4 10.5h8"/><path d="M6 5.5h4"/></svg>',
    document: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h4.5L12 5v8.5H5z"/><path d="M9.5 2.5V5H12"/><path d="M7 8h3"/><path d="M7 10.5h3"/></svg>',
    spark: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 .9 2.6L11.5 5.5l-2.6.9L8 9l-.9-2.6-2.6-.9 2.6-.9z"/><path d="m12.2 9.8.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z"/></svg>',
    question: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.5"/><path d="M6.6 6.4a1.8 1.8 0 1 1 2.7 1.6c-.8.5-1.1.9-1.1 1.6"/><circle cx="8" cy="11.6" r=".6" fill="currentColor" stroke="none"/></svg>',
    news: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M5.5 7h5"/><path d="M5.5 9.5h5"/><path d="M3 11.5a2 2 0 0 0 2 2"/></svg>',
    warning: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2 14 13H2L8 2.2Z"/><path d="M8 5.8v3.2"/><circle cx="8" cy="11.3" r=".6" fill="currentColor" stroke="none"/></svg>',
  };
  const svg = icons[name] || icons.alert;
  return `<span class="ui-icon ui-icon--${name}" aria-hidden="true" title="${esc(title)}">${svg}</span>`;
}

function createPanelSectionGroup(groupId) {
  const group = document.createElement('section');
  group.className = 'reading-panel__group';
  group.id = `group-${groupId}`;

  const header = document.createElement('div');
  header.className = 'reading-panel__group-head';

  const title = document.createElement('p');
  title.className = 'reading-panel__group-title';
  title.id = `group-title-${groupId}`;

  header.appendChild(title);
  group.appendChild(header);
  return group;
}

function ensurePanelScaffolding() {
  const content = document.getElementById('panel-content');
  if (!content) return;

  let intro = document.getElementById('panel-intro');
  if (!intro) {
    intro = document.createElement('section');
    intro.id = 'panel-intro';
    intro.className = 'mol-reading-card mol-reading-card--intro';
    intro.innerHTML = `
      <div class="mol-panel-intro__grid">
        <div class="mol-panel-intro__block">
          <p class="mol-panel-intro__eyebrow">Contexto</p>
          <h2 class="mol-panel-intro__title" id="panel-intro-title"></h2>
          <p class="mol-panel-intro__body" id="panel-intro-body"></p>
        </div>
        <div class="mol-panel-intro__block mol-panel-intro__block--muted">
          <p class="mol-panel-intro__eyebrow" id="panel-intro-note-title"></p>
          <p class="mol-panel-intro__body" id="panel-intro-note-body"></p>
        </div>
      </div>
    `;
  }

  const groups = {
    summary: document.getElementById('group-summary') || createPanelSectionGroup('summary'),
    language: document.getElementById('group-language') || createPanelSectionGroup('language'),
    sources: document.getElementById('group-sources') || createPanelSectionGroup('sources'),
    voices: document.getElementById('group-voices') || createPanelSectionGroup('voices'),
    compare: document.getElementById('group-compare') || createPanelSectionGroup('compare'),
    advanced: ENABLE_EXPERIMENTAL_LAYERS ? (document.getElementById('group-advanced') || createPanelSectionGroup('advanced')) : null,
  };
  let hiddenSupport = document.getElementById('group-hidden-support');
  if (!hiddenSupport) {
    hiddenSupport = document.createElement('section');
    hiddenSupport.id = 'group-hidden-support';
    hiddenSupport.hidden = true;
  }

  const meta = document.querySelector('.mol-reading-card--meta');
  const alerts = document.getElementById('card-alerts');
  const cards = {
    readingMap: document.getElementById('card-reading-map'),
    structure: document.getElementById('card-structure'),
    lexical: document.getElementById('card-lexical'),
    terms: document.getElementById('card-terms'),
    sentiment: document.getElementById('card-sentiment'),
    profile: document.getElementById('card-profile'),
    entities: document.getElementById('card-entities'),
    sources: document.getElementById('card-sources'),
    narrativeFrames: document.getElementById('card-narrative-frames'),
    compare: document.getElementById('card-compare'),
    comparativeCoverage: document.getElementById('card-comparative-coverage'),
    semanticAi: document.getElementById('card-semantic-ai'),
    workflow: document.getElementById('card-workflow'),
  };

  const orderedNodes = [
    meta,
    alerts,
    intro,
    groups.summary,
    groups.language,
    groups.sources,
    groups.voices,
    groups.compare,
    groups.advanced,
    hiddenSupport,
  ].filter(Boolean);
  content.replaceChildren(...orderedNodes);

  [cards.readingMap].filter(Boolean).forEach((node) => groups.summary.append(node));
  [cards.structure, cards.lexical, cards.terms, cards.sentiment, cards.profile].filter(Boolean).forEach((node) => groups.language.append(node));
  [cards.entities, cards.sources].filter(Boolean).forEach((node) => groups.sources.append(node));
  [cards.narrativeFrames].filter(Boolean).forEach((node) => groups.voices.append(node));
  [cards.compare, cards.comparativeCoverage].filter(Boolean).forEach((node) => groups.compare.append(node));
  if (groups.advanced) {
    [cards.semanticAi, cards.workflow].filter(Boolean).forEach((node) => {
      node.hidden = true;
      groups.advanced.append(node);
    });
    groups.advanced.hidden = true;
  } else {
    [cards.semanticAi, cards.workflow].filter(Boolean).forEach((node) => {
      node.hidden = true;
      hiddenSupport.append(node);
    });
  }
}

function refreshPanelGroups() {
  document.querySelectorAll('.reading-panel__group').forEach((group) => {
    const visibleCards = Array.from(group.querySelectorAll(':scope > .mol-reading-card')).filter((card) => !card.hidden);
    group.hidden = visibleCards.length === 0;
  });
}

function applyStaticCopy(locale) {
  const copy = getPanelCopy(locale);
  const frameCopy = getFrameCopy(locale);

  setNodeText('panel-intro-title', frameCopy.introTitle);
  setNodeText('panel-intro-body', frameCopy.introBody);
  setNodeText('panel-intro-note-title', frameCopy.introNoteTitle);
  setNodeText('panel-intro-note-body', frameCopy.introNoteBody);
  setNodeText('group-title-summary', frameCopy.groupSummary);
  setNodeText('group-title-language', frameCopy.groupLanguage);
  setNodeText('group-title-sources', frameCopy.groupSources);
  setNodeText('group-title-voices', frameCopy.groupVoices);
  setNodeText('group-title-compare', frameCopy.groupCompare);
  setNodeText('group-title-advanced', frameCopy.groupAdvanced);
  setNodeText('title-translation-ai', frameCopy.translationAi);
  setNodeText('label-translation-enabled', copy.translationEnabled);
  setNodeText('label-translation-provider', copy.translationProvider);
  setNodeText('label-translation-endpoint', copy.translationEndpoint);
  setNodeText('translation-hint', copy.workflowTranslationOff || PANEL_COPY.en.workflowTranslationOff);
  setNodeText('title-semantic-config', copy.semanticSummaryLabel || PANEL_COPY.en.semanticSummaryLabel);
  setNodeText('title-semantic-ai', frameCopy.semanticAi);
  setNodeText('label-semantic-enabled', copy.semanticEnabled);
  setNodeText('label-semantic-provider', copy.semanticProvider);
  setNodeText('label-semantic-endpoint', copy.semanticEndpoint);
  setNodeText('label-semantic-model', copy.semanticModel);
  setNodeText('semantic-hint', copy.workflowSemanticOff || PANEL_COPY.en.workflowSemanticOff);
  setNodeText('semantic-summary-label', copy.semanticSummaryLabel || PANEL_COPY.en.semanticSummaryLabel);
  setNodeText('semantic-topic-label', copy.semanticTopicLabel || PANEL_COPY.en.semanticTopicLabel);
  setNodeText('semantic-actors-label', copy.semanticActorsLabel || PANEL_COPY.en.semanticActorsLabel);
  setNodeText('semantic-events-label', copy.semanticEventsLabel || PANEL_COPY.en.semanticEventsLabel);
  setNodeText('semantic-points-label', copy.semanticPointsLabel || PANEL_COPY.en.semanticPointsLabel);
  setNodeText('semantic-tone-label', copy.semanticEditorialToneLabel || PANEL_COPY.en.semanticEditorialToneLabel);
  setNodeText('semantic-omitted-label', copy.semanticOmittedLabel || PANEL_COPY.en.semanticOmittedLabel || 'Omitted angles');
  setNodeText('semantic-unsourced-label', copy.semanticUnsourcedLabel || PANEL_COPY.en.semanticUnsourcedLabel || 'Unsourced claims');
  setNodeText('summary-eyebrow', copy.quickSummary || PANEL_COPY.en.quickSummary);
  setNodeText('workflow-eyebrow', frameCopy.workflowEyebrow);
  setNodeText('workflow-eyebrow-title', frameCopy.workflowEyebrow);
  setNodeText('workflow-title', frameCopy.workflowTitle);
  setNodeText('workflow-local-title', copy.workflowLocalTitle || PANEL_COPY.en.workflowLocalTitle || 'Local analysis');
  setNodeText('workflow-final-title', copy.workflowFinalTitle || PANEL_COPY.en.workflowFinalTitle || 'Final map');
  setNodeText('title-compare', frameCopy.compare);
  setNodeText('compare-current-label', copy.compareCurrent || PANEL_COPY.en.compareCurrent);
  setNodeText('compare-reference-label', copy.compareReference || PANEL_COPY.en.compareReference);
  setNodeText('compare-reference-status', compareReferenceData?.meta?.title
    ? `${copy.compareReferenceSaved || PANEL_COPY.en.compareReferenceSaved} ${compareReferenceData.meta.title}`
    : (copy.compareNoReference || PANEL_COPY.en.compareNoReference));
  translationSaveButton.textContent = copy.translationSave;
  semanticSaveButton.textContent = copy.semanticSave;
  compareSaveButton.textContent = copy.saveReference || PANEL_COPY.en.saveReference;
  compareClearButton.textContent = copy.clearReference || PANEL_COPY.en.clearReference;
  btnAnalyze.textContent = copy.analyze;
  btnRetry.textContent = copy.retry;
  document.getElementById('state-idle-copy').innerHTML = copy.idleHtml;
  setNodeText('state-loading-copy', copy.loading);
  setNodeText('title-reading-map', frameCopy.readingMap);
  setNodeText('title-structure', frameCopy.structure);
  setNodeText('title-lexical', frameCopy.lexical);
  setNodeText('title-sentiment', frameCopy.sentiment);
  setNodeText('discourse-focus-title', locale === 'en' ? 'Lexical anchors' : 'Focos lexicos');
  setNodeText('discourse-focus-copy', locale === 'en'
    ? 'The terms that hold the topic in place and keep the piece centered.'
    : 'Los terminos que fijan el tema y sostienen la pieza.');
  setNodeText('discourse-balance-title', locale === 'en' ? 'Argument balance' : 'Balance argumental');
  setNodeText('discourse-balance-copy', locale === 'en'
    ? 'Separates evidence, interpretation, and opinion to show where the text carries more weight.'
    : 'Separa evidencia, interpretacion y opinion para ver donde carga mas el texto.');
  setNodeText('argument-chart-title', locale === 'en' ? 'Argument profile' : 'Perfil argumentativo');
  setNodeText('argument-chart-note', locale === 'en'
    ? 'Shows the overall split between evidence, interpretation, and opinion.'
    : 'Visualiza el reparto entre evidencia, interpretacion y opinion como huella global del texto.');
  setNodeText('paragraph-flow-title', locale === 'en' ? 'Paragraph progression' : 'Progresion por parrafo');
  setNodeText('paragraph-flow-note', locale === 'en'
    ? 'Crosses topic focus and visible attribution to show where the text advances with stronger support.'
    : 'Cruza foco tematico y atribucion visible para detectar donde el texto sostiene mejor su avance.');
  setNodeText('title-terms', frameCopy.terms);
  setNodeText('title-profile', frameCopy.profile);
  setNodeText('rhetorical-flow-title', locale === 'en' ? 'Cohesion and modalization' : 'Cohesion y modalizacion');
  setNodeText('rhetorical-flow-note', locale === 'en'
    ? 'Shows how paragraphs connect and how much the text leans on doubt, hypothesis, or inference.'
    : 'Observa como se enlazan los parrafos y cuanto recurre el texto a duda, hipotesis o inferencia.');
  setNodeText('title-entities', frameCopy.entities);
  setNodeText('entity-chart-title', locale === 'en' ? 'Actor weight' : 'Peso de actores');
  setNodeText('entity-chart-note', locale === 'en'
    ? 'Compares which actors gather the most visibility inside the article.'
    : 'Compara que actores concentran mas presencia dentro del articulo.');
  setNodeText('title-sources', frameCopy.sources);
  setNodeText('source-chart-title', locale === 'en' ? 'Source composition' : 'Composicion de fuentes');
  setNodeText('source-chart-note', locale === 'en'
    ? 'Summarizes how support is distributed across source types.'
    : 'Resume como se reparte el apoyo entre fuentes primarias, expertas, mediales, anonimas y sin atribucion.');
  setNodeText('title-narrative-frames', frameCopy.narrativeFrames);
  setNodeText('frame-chart-title', locale === 'en' ? 'Frame balance' : 'Balance de encuadres');
  setNodeText('frame-chart-note', locale === 'en'
    ? 'Summarizes how the detected narrative frames are distributed across the piece.'
    : 'Resume el reparto entre los marcos narrativos detectados en la pieza.');
  setNodeText('actor-attribution-title', locale === 'en' ? 'Attribution by actor' : 'Atribucion por actor');
  setNodeText('actor-attribution-note', locale === 'en'
    ? 'Separates supported mentions from unsupported mentions for each visible actor.'
    : 'Distingue entre menciones apoyadas por atribucion visible y menciones desnudas para cada actor.');
  setNodeText('title-comparative-coverage', frameCopy.comparativeCoverage);
  setNodeText('title-comparative-config', frameCopy.comparativeConfigTitle);
  setNodeText('comparative-hint', frameCopy.comparativeHint);
  if (copy.comparativeEnabled) setNodeText('label-comparative-enabled', copy.comparativeEnabled);
  if (copy.comparativeApiKey) setNodeText('label-comparative-apikey', copy.comparativeApiKey);
  if (copy.comparativeSave && comparativeSaveButton) comparativeSaveButton.textContent = copy.comparativeSave;

  ['words', 'readTime', 'paragraphs', 'quotes', 'links', 'sentences', 'chars', 'headings', 'avgSentence', 'avgParagraph', 'linkRatio', 'quoteRatio'].forEach((id, index) => {
    const label = copy.stats[index];
    const node = document.getElementById(`label-stat-${id}`);
    if (label && node) node.textContent = label;
  });

  document.getElementById('meter-adjectives-label').textContent = copy.signalLabels[0];
  document.getElementById('meter-repetition-label').textContent = copy.signalLabels[1];
  document.getElementById('meter-sentenceLen-label').textContent = copy.signalLabels[2];
  if (copy.signalLabels[3]) setNodeText('meter-readability-label', copy.signalLabels[3]);
  if (copy.signalLabels[4]) setNodeText('meter-weasel-label', copy.signalLabels[4]);
  setNodeText('legend-positive', copy.legends[0]);
  setNodeText('legend-neutral', copy.legends[1]);
  setNodeText('legend-charged', copy.legends[2]);
  setNodeText('lexical-note', copy.lexicalNote || PANEL_COPY.en.lexicalNote);
  setNodeText('lexical-resources-title', copy.lexicalResourcesTitle || PANEL_COPY.en.lexicalResourcesTitle);
  setNodeText('lexical-resources-note', copy.lexicalResourcesNote || PANEL_COPY.en.lexicalResourcesNote);
  setNodeText('terms-note', copy.termsNote || PANEL_COPY.en.termsNote);
  setNodeText('sentiment-note', copy.sentimentNote || PANEL_COPY.en.sentimentNote);
  setNodeText('profile-note', copy.profileNote || PANEL_COPY.en.profileNote);
  void refreshCapabilityStatus(locale);
}

async function extractFromTab(tabId) {
  let response;
  try {
    response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js'],
    });
    response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT' });
  }

  if (!response?.ok) throw new Error(response?.error || 'Error al extraer contenido de la pagina.');
  if (response.data?.error) throw new Error(response.data.error);
  return response.data;
}

function render(vm) {
  currentLocale = vm.locale;
  applyStaticCopy(currentLocale);

  document.getElementById('meta-title').textContent = vm.meta.title;
  document.getElementById('meta-byline').textContent = vm.meta.byline;
  document.getElementById('reading-map-provenance').textContent = vm.readingMap.provenanceBadge;
  document.getElementById('reading-map-confidence').textContent = vm.readingMap.confidenceBadge;
  const pipelineBadges = document.getElementById('pipeline-badges');
  if (pipelineBadges) {
    pipelineBadges.innerHTML = (vm.pipelineBadges || []).map((badge) => {
      const className = badge.tone === 'warn'
        ? 'mol-reading-badge mol-reading-badge--warn'
        : badge.tone === 'muted'
          ? 'mol-reading-badge mol-reading-badge--muted'
          : 'mol-reading-badge';
      return `<span class="${className}">${esc(badge.text)}</span>`;
    }).join('');
  }
  document.getElementById('reading-map-summary').textContent = vm.readingMap.summary;
  const readingMapLanguage = document.getElementById('reading-map-language');
  if (readingMapLanguage) {
    const baseLanguageLabel = String(vm.readingMap.articleLanguageLabel || '')
      .split(/·/)
      .map((part) => part.trim())
      .filter(Boolean)[0] || '';
    const readingModeLabel = vm.readingMap.provenanceBadge === 'local'
      ? 'Mapa local basado en señales estructurales'
      : 'Mapa ampliado';
    readingMapLanguage.textContent = [baseLanguageLabel, readingModeLabel].filter(Boolean).join(' · ');
  }
  document.getElementById('reading-map-points').innerHTML = vm.readingMap.bullets.map((item) => `<li>${esc(item)}</li>`).join('');
  console.log('[Monitora] vm.alertas:', vm.alertas);
  renderAlerts(vm.alertas);
  renderTrustSignals(vm.trustSignals);
  const summaryWarning = document.getElementById('summary-warning');
  const summaryModeBadge = document.getElementById('summary-mode-badge');
  const summaryTranslationBadge = document.getElementById('summary-translation-badge');
  const summaryLead = document.getElementById('summary-lead');
  const summaryTips = document.getElementById('summary-tips');
  const summaryBadges = document.getElementById('summary-badges');
  const readingMapQuick = document.getElementById('reading-map-quick');
  summaryModeBadge.textContent = vm.quickSummary.modeBadge;
  summaryTranslationBadge.textContent = vm.quickSummary.translationBadge;
  summaryLead.textContent = vm.quickSummary.lead || '';
  summaryLead.hidden = !vm.quickSummary.lead;
  summaryTips.innerHTML = vm.quickSummary.tips.map((item) => `
    <div class="mol-summary-tip">
      ${renderInlineIcon(item.emoji, item.text)}
      <span>${esc(item.text)}</span>
    </div>
  `).join('');
  summaryTips.hidden = vm.quickSummary.tips.length === 0;
  if (vm.sourceLanguageMismatch) {
    summaryWarning.hidden = false;
    summaryWarning.textContent = getPanelCopy(vm.locale).sourceMismatch || PANEL_COPY.en.sourceMismatch;
  } else {
    summaryWarning.hidden = true;
    summaryWarning.textContent = '';
  }
  if (summaryBadges) {
    summaryBadges.hidden = !vm.quickSummary.modeBadge && !vm.quickSummary.translationBadge;
  }
  if (readingMapQuick) {
    readingMapQuick.hidden = Boolean(summaryBadges?.hidden) && summaryWarning.hidden && summaryLead.hidden && summaryTips.hidden;
  }
  void renderAnalysisActions(vm);
  renderWorkflow(vm.locale, currentAnalysisData);
  void refreshSemanticAssist();
  const readingMapToggle = document.querySelector('#card-reading-map .mol-reading-card__toggle');
  const readingMapLimitedNote = document.getElementById('reading-map-limited-note');
  setCardExpandedState(readingMapToggle, true);
  if (readingMapLimitedNote) readingMapLimitedNote.hidden = !vm.quickSummary.limitedMode;
  setNodeText('compare-reference-status', compareReferenceData?.meta?.title
    ? `${getPanelCopy(vm.locale).compareReferenceSaved || PANEL_COPY.en.compareReferenceSaved} ${compareReferenceData.meta.title}`
    : (getPanelCopy(vm.locale).compareNoReference || PANEL_COPY.en.compareNoReference));
  compareClearButton.hidden = !compareReferenceData;

  const semanticOutput = document.getElementById('semantic-output');
  const semanticSummary = document.getElementById('semantic-summary');
  const semanticOrientation = document.getElementById('semantic-orientation');
  const semanticTopic = document.getElementById('semantic-topic');
  const semanticActors = document.getElementById('semantic-actors');
  const semanticEvents = document.getElementById('semantic-events');
  const semanticPoints = document.getElementById('semantic-points');
  const semanticOmitted = document.getElementById('semantic-omitted');
  const semanticUnsourced = document.getElementById('semantic-unsourced');

  if (vm.semanticLayer.available) {
    semanticOutput.hidden = false;
    semanticSummary.textContent = vm.semanticLayer.summary || vm.semanticLayer.topic || '';
    semanticOrientation.textContent = vm.semanticLayer.orientation || '';
    semanticTopic.textContent = vm.semanticLayer.topic || vm.semanticLayer.summary || '';
    semanticActors.innerHTML = vm.semanticLayer.actors.map((item) => `<li>${esc(item)}</li>`).join('');
    semanticEvents.innerHTML = vm.semanticLayer.events.map((item) => `<li>${esc(item)}</li>`).join('');
    semanticPoints.innerHTML = vm.semanticLayer.points.map((item) => `<li>${esc(item)}</li>`).join('');
    if (semanticOmitted) semanticOmitted.innerHTML = vm.semanticLayer.omittedAngles.map((item) => `<li>${esc(item)}</li>`).join('');
    if (semanticUnsourced) semanticUnsourced.innerHTML = vm.semanticLayer.unsourcedClaims.map((item) => `<li>${esc(item)}</li>`).join('');
    const semanticEditorial = document.getElementById('semantic-editorial');
    const hasEditorial = vm.semanticLayer.editorialTone || vm.semanticLayer.readingNote || vm.semanticLayer.rhetoricalSignals.length;
    if (semanticEditorial) {
      semanticEditorial.hidden = !hasEditorial;
      document.getElementById('semantic-editorial-tone').textContent = vm.semanticLayer.editorialTone || '';
      document.getElementById('semantic-reading-note').textContent = vm.semanticLayer.readingNote || '';
      document.getElementById('semantic-rhetorical-signals').innerHTML = vm.semanticLayer.rhetoricalSignals.map((s) => `<li>${esc(s)}</li>`).join('');
    }
  } else {
    semanticOutput.hidden = true;
    semanticSummary.textContent = '';
    semanticOrientation.textContent = '';
    semanticTopic.textContent = '';
    semanticActors.innerHTML = '';
    semanticEvents.innerHTML = '';
    semanticPoints.innerHTML = '';
    if (semanticOmitted) semanticOmitted.innerHTML = '';
    if (semanticUnsourced) semanticUnsourced.innerHTML = '';
    const semanticEditorial = document.getElementById('semantic-editorial');
    if (semanticEditorial) semanticEditorial.hidden = true;
  }

  vm.stats.forEach(({ id, value }) => {
    const el = document.getElementById(`stat-${id}`);
    if (!el) return;
    const num = parseInt(String(value).replace(/\D/g, ''), 10);
    if (!Number.isNaN(num) && num > 0 && !String(value).includes('min')) {
      countUp(el, num, String(value), vm.locale);
    } else {
      el.textContent = value;
    }
  });

  vm.signals.forEach(({ id, score, unit, level, displayValue }) => {
    const fill = document.getElementById(`meter-${id}-fill`);
    const value = document.getElementById(`meter-${id}-val`);
    const track = fill?.closest('[role="progressbar"]');
    if (fill) {
      fill.style.width = `${score}%`;
      fill.dataset.level = level;
    }
    if (value) value.textContent = displayValue || `${score}${unit || ''}`;
    if (track) track.setAttribute('aria-valuenow', String(score));
  });
  renderLexicalResources(vm.lexicalResources);
  renderDiscourseFocus(vm.topTerms, vm.locale);
  renderDiscourseBalance(vm.discourseBalance || [], vm.locale);
  renderChartArgumentBalance('chart-argument-balance', vm.argumentChart, {
    datasetLabel: vm.locale === 'en' ? 'Argument profile' : 'Perfil argumentativo',
  });
  renderChartParagraphFlow('chart-paragraph-flow', vm.paragraphFlowChart);

  renderChartTerms('chart-terms', vm.topTerms, vm.chartTerms);
  renderChartEntities('chart-entities', vm.entitiesChart, {
    datasetLabel: vm.locale === 'en' ? 'Actors' : 'Actores',
    mentionsLabel: vm.entitiesChart?.mentionsLabel || (vm.locale === 'en' ? 'mentions' : 'menciones'),
  });
  renderChartSourceAnatomy('chart-source-anatomy', vm.sourceAnatomyChart, {});
  renderChartProfile('chart-profile', vm.radarProfile);
  renderChartActorAttribution('chart-actor-attribution', vm.actorAttributionChart);
  renderChartRhetoricalFlow('chart-rhetorical-flow', vm.rhetoricalFlowChart);
  renderChartFrameDistribution('chart-frame-distribution', vm.narrativeFramesChart);

  const cadenceLabel = String(vm.sentimentArc.arcLabel || '')
    .replace(/^Tono\s+/i, 'Intensidad ')
    .replace(/^Tone\s+/i, 'Intensity ');
  document.getElementById('sentiment-label').textContent = cadenceLabel;
  setNodeText('sentiment-chip-tone', vm.sentimentArc.summary?.toneChip || '');
  setNodeText('sentiment-chip-motion', vm.sentimentArc.summary?.motionChip || '');
  setNodeText('sentiment-chip-peak', vm.sentimentArc.summary?.peakChip || '');
  setNodeText('sentiment-summary-text', vm.sentimentArc.summary?.text || '');
  renderChartCadence('chart-sentiment', vm.sentimentArc.scores || [], vm.sentimentArc.labels || {});

  const entityList = document.getElementById('entity-list');
  const entityChartBlock = document.getElementById('entity-chart-block');
  if (entityChartBlock) entityChartBlock.hidden = !vm.entitiesChart || vm.entitiesChart.isEmpty;
  entityList.innerHTML = vm.entities.length
    ? vm.entities.map((entity) => `
        <div class="mol-entity-item">
          <span class="mol-entity-item__name">${esc(entity.name)}</span>
          <span class="mol-entity-item__count">${entity.mentions}</span>
        </div>
      `).join('')
    : `<p class="atom-txt atom-txt--muted atom-txt--sm">${esc(vm.emptyStates.entities)}</p>`;

  const sourceList = document.getElementById('sources-list');
  sourceList.innerHTML = vm.sources.length
    ? vm.sources.map((source) => {
      let srcHostname = '';
      try { srcHostname = new URL(source.href).hostname; } catch {}
      const rep = getDomainReputation(srcHostname);
      const tier = rep ? (rep.trustScore >= 82 ? 'high' : rep.trustScore >= 62 ? 'medium' : rep.trustScore >= 40 ? 'low' : 'very-low') : null;
      const badgeIcon = { high: '✓', medium: '◎', low: '⚠', 'very-low': '✗' };
      const badge = tier ? `<span class="mol-trust-signal mol-trust-signal--${tier} mol-trust-signal--xs" title="${rep.trustScore}/100">${badgeIcon[tier]}</span>` : '';
      return `
        <div class="mol-entity-item mol-entity-item--source">
          ${badge}
          <a class="atom-link mol-entity-item__name" href="${esc(source.href)}" target="_blank" rel="noopener noreferrer">${esc(source.text)}</a>
        </div>`;
    }).join('')
    : `<p class="atom-txt atom-txt--muted atom-txt--sm">${esc(vm.emptyStates.sources)}</p>`;

  // Hide readability meter for CJK content (null score)
  const readabilityWrap = document.getElementById('meter-readability-wrap');
  if (readabilityWrap) {
    readabilityWrap.hidden = currentAnalysisData?.analisis_lexico?.readabilityScore == null;
  }

  // Hide terms chart and lexical repetition meter for CJK (stopwords not filtered → meaningless output)
  const detectedLang = currentAnalysisData?.meta?.detectedLanguage || '';
  const isCJK = ['ja', 'ko', 'zh'].includes(detectedLang);
  const cardTerms = document.getElementById('card-terms');
  if (cardTerms) cardTerms.hidden = isCJK;
  const meterRepetitionWrap = document.getElementById('meter-repetition-fill')?.closest('.mol-signal-meter');
  if (meterRepetitionWrap) meterRepetitionWrap.hidden = isCJK;

  // Title–body congruence note — hide when cross-language without semantic layer (comparison is meaningless)
  const congruenceEl = document.getElementById('title-congruence-note');
  if (congruenceEl) {
    const tc = currentAnalysisData?.capa_semantica?.titleCongruence;
    const articleLang = detectedLang;
    const crossLang = articleLang && articleLang !== 'unknown' && articleLang !== currentLocale && !vm.semanticLayer.available;
    if (tc != null && !crossLang) {
      const isEn = currentLocale === 'en';
      const lvl = tc >= 60 ? (isEn ? 'high' : 'alta') : tc >= 30 ? (isEn ? 'partial' : 'parcial') : (isEn ? 'low' : 'baja');
      congruenceEl.textContent = isEn
        ? `Title–body congruence: ${tc}% (${lvl})`
        : `Congruencia título-cuerpo: ${tc}% (${lvl})`;
      congruenceEl.hidden = false;
    } else {
      congruenceEl.hidden = true;
    }
  }

  // Source diversity note
  const diversityEl = document.getElementById('source-diversity-note');
  if (diversityEl) {
    const div = currentAnalysisData?.fuentes?.diversityScore;
    const ext = currentAnalysisData?.fuentes?.external || 0;
    if (div != null && ext > 0) {
      const isEn = currentLocale === 'en';
      const lvl = div >= 80 ? (isEn ? 'high' : 'alta') : div >= 50 ? (isEn ? 'medium' : 'media') : (isEn ? 'low' : 'baja');
      diversityEl.textContent = isEn
        ? `Source diversity: ${div}% (${lvl})`
        : `Diversidad de fuentes: ${div}% (${lvl})`;
      diversityEl.hidden = false;
    } else {
      diversityEl.hidden = true;
    }
  }

  // F1.1 — Source anatomy
  const anatomyBarsEl = document.getElementById('source-anatomy-bars');
  const anatomyDominantEl = document.getElementById('source-anatomy-dominant');
  const sourceChartBlock = document.getElementById('source-chart-block');
  if (sourceChartBlock) sourceChartBlock.hidden = !vm.sourceAnatomyChart || vm.sourceAnatomyChart.isEmpty;
  if (anatomyBarsEl && vm.sourceAnatomy && !vm.sourceAnatomy.isEmpty) {
    anatomyBarsEl.innerHTML = vm.sourceAnatomy.bars
      .map((b) => `
        <div class="mol-signal-meter">
          <span class="mol-signal-meter__label mol-signal-meter__label--with-icon">${renderInlineIcon(b.icon, b.label)}<span>${esc(b.label)}</span></span>
          <span class="mol-signal-meter__value">${b.count}</span>
          <div class="mol-signal-meter__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.pct}">
            <div class="mol-signal-meter__fill" style="width:${b.pct}%" data-level="${b.count > 0 ? 'mid' : 'low'}"></div>
          </div>
        </div>`)
      .join('');
    if (anatomyDominantEl && vm.sourceAnatomy.dominantLabel) {
      anatomyDominantEl.textContent = vm.sourceAnatomy.dominantLabel;
      anatomyDominantEl.hidden = false;
    }
  } else if (anatomyBarsEl) {
    anatomyBarsEl.innerHTML = `<p class="atom-txt atom-txt--muted atom-txt--sm">${esc(vm.emptyStates.sources)}</p>`;
  }

  // F1.3 — Narrative frames
  const framesListEl = document.getElementById('narrative-frames-list');
  const frameDominantEl = document.getElementById('narrative-dominant-label');
  const frameChartBlock = document.getElementById('frame-chart-block');
  if (frameChartBlock) frameChartBlock.hidden = !vm.narrativeFramesChart || vm.narrativeFramesChart.isEmpty;
  if (framesListEl && vm.narrativeFrames && !vm.narrativeFrames.isEmpty) {
    framesListEl.innerHTML = vm.narrativeFrames.items
      .filter((f) => f.score > 0)
      .map((f) => `
        <div class="mol-signal-meter">
          <span class="mol-signal-meter__label">${esc(f.label)}</span>
          <span class="mol-signal-meter__value">${f.score}%</span>
          <div class="mol-signal-meter__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f.score}">
            <div class="mol-signal-meter__fill" style="width:${f.score}%" data-level="${f.level}"></div>
          </div>
        </div>`)
      .join('');
    if (frameDominantEl && vm.narrativeFrames.dominantLabel) {
      frameDominantEl.textContent = vm.narrativeFrames.dominantLabel;
      frameDominantEl.hidden = false;
    }
  } else if (framesListEl) {
    framesListEl.innerHTML = `<p class="atom-txt atom-txt--muted atom-txt--sm">${esc(vm.emptyStates.sources)}</p>`;
  }

  const argumentChartBlock = document.getElementById('argument-chart-block');
  if (argumentChartBlock) argumentChartBlock.hidden = !vm.argumentChart || vm.argumentChart.isEmpty;
  const paragraphFlowBlock = document.getElementById('paragraph-flow-block');
  if (paragraphFlowBlock) paragraphFlowBlock.hidden = !vm.paragraphFlowChart || vm.paragraphFlowChart.isEmpty;

  // F1.2 — EIO labels (locale-aware)
  const isEs = vm.locale !== 'en' && vm.locale !== 'fr' && vm.locale !== 'de' && vm.locale !== 'pt' && vm.locale !== 'it' && vm.locale !== 'ja';
  const eioLabels = isEs
    ? ['Evidencia', 'Interpretación', 'Opinión']
    : ['Evidence', 'Interpretation', 'Opinion'];
  ['eio-evidence', 'eio-interpretation', 'eio-opinion'].forEach((id, i) => {
    const labelEl = document.getElementById(`meter-${id}-label`);
    if (labelEl) labelEl.textContent = eioLabels[i];
  });

  // F2.1 — Perspective map
  const copy = getPanelCopy(vm.locale);
  const voicesListEl = document.getElementById('perspective-voices-list');
  const pluralityLabelEl = document.getElementById('perspective-plurality-label');
  const omittedListEl = document.getElementById('perspective-omitted-list');
  const actorAttributionBlock = document.getElementById('actor-attribution-block');
  if (actorAttributionBlock) actorAttributionBlock.hidden = !vm.actorAttributionChart || vm.actorAttributionChart.isEmpty;
  const rhetoricalFlowBlock = document.getElementById('rhetorical-flow-block');
  if (rhetoricalFlowBlock) rhetoricalFlowBlock.hidden = !vm.rhetoricalFlowChart || vm.rhetoricalFlowChart.isEmpty;
  if (voicesListEl && vm.perspectiveMap && !vm.perspectiveMap.isEmpty) {
    voicesListEl.innerHTML = vm.perspectiveMap.voices
      .filter((v) => v.count > 0)
      .map((v) => `
        <div class="mol-signal-meter">
          <span class="mol-signal-meter__label">${esc(v.icon)} ${esc(v.label)}</span>
          <span class="mol-signal-meter__value">${v.count}</span>
          <div class="mol-signal-meter__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v.presence === 'high' ? 100 : 40}">
            <div class="mol-signal-meter__fill" style="width:${v.presence === 'high' ? 100 : 40}%" data-level="${v.presence === 'high' ? 'high' : 'mid'}"></div>
          </div>
        </div>`)
      .join('');
    if (pluralityLabelEl && vm.perspectiveMap.pluralityLabel) {
      pluralityLabelEl.textContent = vm.perspectiveMap.pluralityLabel;
      pluralityLabelEl.hidden = false;
    }
    if (omittedListEl) {
      const angles = vm.perspectiveMap.omittedAngles;
      const unsourced = vm.perspectiveMap.unsourcedClaims;
      if (angles.length || unsourced.length) {
        omittedListEl.innerHTML = [
          angles.length ? `<p class="atom-txt atom-txt--sm atom-txt--muted">${esc(copy.perspectiveOmittedTitle || 'Missing perspectives')}</p><ul>${angles.map((a) => `<li class="atom-txt atom-txt--sm">⚠ ${esc(a)}</li>`).join('')}</ul>` : '',
          unsourced.length ? `<p class="atom-txt atom-txt--sm atom-txt--muted">${esc(copy.perspectiveUnsourcedTitle || 'Unsourced claims')}</p><ul>${unsourced.map((u) => `<li class="atom-txt atom-txt--sm">· ${esc(u)}</li>`).join('')}</ul>` : '',
        ].join('');
        omittedListEl.hidden = false;
      } else {
        omittedListEl.hidden = true;
      }
    }
  } else if (voicesListEl) {
    voicesListEl.innerHTML = `<p class="atom-txt atom-txt--muted atom-txt--sm">${esc(vm.emptyStates.sources)}</p>`;
  }

  // F3.1 — Comparative coverage
  const comparativeCard = document.getElementById('card-comparative-coverage');
  const comparativeResultsEl = document.getElementById('comparative-results-list');
  const comparativeDiversityEl = document.getElementById('comparative-frame-diversity');
  if (comparativeCard) {
    if (vm.comparativeCoverage?.available && comparativeResultsEl) {
      comparativeCard.hidden = false;
      const cc = vm.comparativeCoverage;
      if (comparativeDiversityEl) {
        comparativeDiversityEl.textContent = cc.frameDiversityLabel;
        comparativeDiversityEl.hidden = !cc.frameDiversityLabel;
      }
      comparativeResultsEl.innerHTML = cc.results.map((r) => `
        <div class="mol-comparative-result">
          <div class="mol-comparative-result__meta">
            <span class="mol-comparative-result__source">${esc(r.source)}</span>
            ${r.frameLabel ? `<span class="mol-comparative-result__frame${r.frameDiff ? ' is-divergent' : ''}">${esc(r.frameIcon)} ${esc(r.frameLabel)}</span>` : ''}
          </div>
          <a class="atom-link mol-comparative-result__title" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>
          ${r.snippet ? `<p class="mol-comparative-result__snippet atom-txt atom-txt--sm atom-txt--muted">${esc(r.snippet.slice(0, 180))}${r.snippet.length > 180 ? '…' : ''}</p>` : ''}
        </div>`).join('');
    } else {
      comparativeCard.hidden = true;
    }
  }

  renderComparison(vm.locale);
  refreshPanelGroups();
}

function renderProactiveDomainAlert(hostname) {
  const el = document.getElementById('idle-domain-alert');
  if (!el) return;
  const rep = getDomainReputation(hostname);
  if (!rep) { el.hidden = true; return; }
  const tier = rep.trustScore >= 82 ? 'high' : rep.trustScore >= 62 ? 'medium' : rep.trustScore >= 40 ? 'low' : 'very-low';
  const icon = { high: '✓', medium: '◎', low: '⚠', 'very-low': '✗' }[tier];
  el.innerHTML = `<span class="mol-trust-signal mol-trust-signal--${tier}">${icon} ${esc(rep.domain)} · ${esc(rep.type)} · ${rep.trustScore}/100</span>`;
  el.hidden = false;
}

async function exportAnalysis() {
  if (!currentAnalysisData) return;
  const d = currentAnalysisData;
  const rep = d.capa_semantica?.domainReputation;
  const clickbait = d.capa_semantica?.clickbaitScore;
  const terms = (d.analisis_lexico?.topTerms || []).slice(0, 5).map((t) => t.term).join(', ');
  const lines = [
    `📰 ${d.meta?.title || '—'}`,
    `🔗 ${d.url || ''}`,
    '',
    `📊 ${d.estructura?.wordCount} palabras · ${d.estructura?.readingTimeMin} min · ${d.estructura?.paragraphCount} párrafos`,
    `   Tipo: ${d.capa_semantica?.structureKind} · Evidencia: ${d.capa_semantica?.evidenceLevel} · Tono: ${d.capa_semantica?.tonePolarity}`,
    rep ? `🏛 ${rep.domain} · ${rep.type} · ${rep.trustScore}/100` : '',
    clickbait > 0 ? `⚠ Clickbait ${clickbait}%` : '',
    terms ? `🔍 ${terms}` : '',
    '',
    '— Monitora',
  ].filter(Boolean);

  const btn = document.getElementById('btn-export');
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    if (btn) { const orig = btn.textContent; btn.textContent = '✓'; setTimeout(() => { btn.textContent = orig; }, 1500); }
  } catch {
    if (btn) { const orig = btn.textContent; btn.textContent = '!'; setTimeout(() => { btn.textContent = orig; }, 1500); }
  }
}

async function renderHistory() {
  const panel = document.getElementById('history-panel');
  const list = document.getElementById('history-list');
  const stats = document.getElementById('history-stats');
  if (!panel || !list) return;

  const [history, summary] = await Promise.all([getHistory(), getStats()]);

  if (summary) {
    const topDomain = summary.topDomains[0];
    stats.innerHTML = [
      `<span>${summary.total} artículos</span>`,
      summary.avgTrust !== null ? `<span>Trust medio: ${summary.avgTrust}/100</span>` : '',
      topDomain ? `<span>Fuente top: ${esc(topDomain.domain)} (${topDomain.count})</span>` : '',
    ].filter(Boolean).join('<span class="mol-history-sep">·</span>');
    stats.hidden = false;
  } else {
    stats.hidden = true;
  }

  if (!history.length) {
    list.innerHTML = '<p class="atom-txt atom-txt--muted atom-txt--sm">Aún no hay artículos analizados.</p>';
    return;
  }

  list.innerHTML = history.slice(0, 40).map((e) => {
    const date = new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const tier = e.trustTier || '';
    const icon = { high: '✓', medium: '◎', low: '⚠', 'very-low': '✗' }[tier] || '·';
    const toneIcon = { positive: '+', charged: '−', neutral: '~' }[e.tone] || '~';
    return `
      <div class="mol-history-item">
        <div class="mol-history-item__meta">
          <span class="mol-history-item__date">${esc(date)}</span>
          <span class="mol-history-item__domain">${esc(e.domain || '')}</span>
          ${tier ? `<span class="mol-trust-signal mol-trust-signal--${tier} mol-trust-signal--xs">${icon} ${e.trustScore ?? ''}</span>` : ''}
          <span class="mol-history-item__tone">${toneIcon}</span>
        </div>
        <a class="mol-history-item__title atom-link" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title || e.url)}</a>
      </div>`;
  }).join('');
}

function explainClickbait(title, wordCount, adjectiveDensity) {
  const reasons = [];
  const t = String(title || '');
  if (/[!?]{2,}/.test(t)) reasons.push('signos múltiples en título');
  else if (/[!?]/.test(t)) reasons.push('puntuación expresiva');
  if (/\b\d+\s+(razones?|formas?|cosas?|maneras?|tips?|ways?|reasons?|things?|errores?|secrets?|tricks?|facts?|signs?)\b/i.test(t)) reasons.push('formato de lista');
  if (/^(Por qué|Why|How to|Cómo|Así que|This is|What happens|Esto es|Lo que|Here's|Nunca|Never|Always|Siempre|Todo lo que|Everything you)/i.test(t)) reasons.push('inicio clickbait');
  if ((wordCount || 0) < 400 && (adjectiveDensity || 0) > 45) reasons.push('artículo corto muy adjetivado');
  if ((adjectiveDensity || 0) > 65) reasons.push('densidad adjetival extrema');
  return reasons;
}

function renderTrustSignals(trustSignals) {
  const el = document.getElementById('trust-signals');
  if (!el) return;
  const parts = [];

  if (trustSignals?.domainReputation) {
    const rep = trustSignals.domainReputation;
    const icon = { high: '✓', medium: '◎', low: '⚠', 'very-low': '✗' }[trustSignals.trustTier] || '·';
    parts.push(`<span class="mol-trust-signal mol-trust-signal--${trustSignals.trustTier}">${icon} ${esc(rep.domain)} · ${esc(rep.type)} · ${rep.trustScore}/100</span>`);
  }

  if (trustSignals?.clickbaitScore !== null && trustSignals?.clickbaitScore > 0) {
    const level = trustSignals.clickbaitLevel;
    const icon = level === 'high' ? '⚠' : level === 'medium' ? '↑' : '·';
    parts.push(`<span class="mol-trust-signal mol-trust-signal--clickbait-${level}">${icon} Clickbait ${trustSignals.clickbaitScore}%</span>`);
    const reasons = explainClickbait(
      currentAnalysisData?.meta?.title,
      currentAnalysisData?.estructura?.wordCount,
      currentAnalysisData?.analisis_lexico?.adjectiveDensity
    );
    if (reasons.length) {
      parts.push(`<span class="mol-clickbait-reasons">${reasons.map((r) => esc(r)).join(' · ')}</span>`);
    }
  }

  if (parts.length) {
    el.innerHTML = parts.join('');
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function renderAlerts(alerts) {
  const card = document.getElementById('card-alerts');
  const list = document.getElementById('alerts-list');
  if (!card || !list) return;
  if (!alerts || alerts.length === 0) {
    card.hidden = true;
    list.innerHTML = '';
    return;
  }
  list.innerHTML = alerts.map((a) => `
    <div class="mol-alert-item mol-alert-item--${a.level}">
      <span class="mol-alert-item__icon" aria-hidden="true">${esc(a.icon)}</span>
      <div class="mol-alert-item__content">
        <span class="mol-alert-item__label">${esc(a.label)}</span>
        ${a.detail ? `<span class="mol-alert-item__detail">${esc(a.detail)}</span>` : ''}
      </div>
    </div>
  `).join('');
  card.hidden = false;
}

function renderWorkflow(locale, analysisData) {
  const copy = getPanelCopy(locale);
  if (!analysisData) {
    renderWorkflowStep('extraction', copy.workflowExtractionTitle, copy.workflowStatusPending, copy.loadingExtracting, 'off');
    renderWorkflowStep('local', copy.workflowLocalTitle || PANEL_COPY.en.workflowLocalTitle || 'Local analysis', copy.workflowStatusPending, copy.loadingExtracting, 'off');
    renderWorkflowStep('translation', copy.workflowTranslationTitle, copy.workflowStatusPending, copy.workflowTranslationOff, 'off');
    renderWorkflowStep('semantic', copy.workflowSemanticTitle, copy.workflowStatusPending, copy.workflowSemanticOff, 'off');
    renderWorkflowStep('final', copy.workflowFinalTitle || PANEL_COPY.en.workflowFinalTitle || 'Final map', copy.workflowStatusPending, copy.workflowFinalLocal || 'Final map is local-first.', 'off');
    return;
  }

  const pipeline = analysisData.pipeline?.layers || {};

  const extractionWeak = pipeline.extraction?.status === 'partial' || Boolean(analysisData.capa_semantica?.extractionWarning);
  renderWorkflowStep(
    'extraction',
    copy.workflowExtractionTitle,
    extractionWeak ? copy.workflowStatusLimited : copy.workflowStatusReady,
    pipeline.extraction?.reason || (extractionWeak ? copy.workflowExtractionWeak : copy.workflowExtractionReady),
    extractionWeak ? 'limited' : 'ready'
  );

  renderWorkflowStep(
    'local',
    copy.workflowLocalTitle || PANEL_COPY.en.workflowLocalTitle || 'Local analysis',
    pipeline.local?.status === 'partial' ? copy.workflowStatusPartial : copy.workflowStatusReady,
    pipeline.local?.reason || (pipeline.local?.status === 'partial'
      ? (copy.workflowLocalPartial || PANEL_COPY.en.workflowLocalPartial)
      : (copy.workflowLocalReady || PANEL_COPY.en.workflowLocalReady)),
    pipeline.local?.status === 'partial' ? 'partial' : 'ready'
  );

  const translation = analysisData.capa_traduccion;
  let translationStatus = copy.workflowStatusDisabled;
  let translationText = copy.workflowTranslationOff;
  let translationLevel = 'off';
  if (translation?.status === 'direct' || translation?.coverage === 'native') {
    translationStatus = copy.workflowStatusReady;
    translationText = pipeline.translation?.reason || copy.workflowTranslationDirect;
    translationLevel = 'ready';
  } else if (translation?.available && translation?.status === 'partial') {
    translationStatus = copy.workflowStatusPartial;
    translationText = pipeline.translation?.reason || copy.workflowTranslationPartial;
    translationLevel = 'partial';
  } else if (translation?.available) {
    translationStatus = copy.workflowStatusReady;
    translationText = pipeline.translation?.reason || copy.workflowTranslationReady;
    translationLevel = 'ready';
  } else if (translation?.status === 'failed') {
    translationStatus = copy.workflowStatusLimited;
    translationText = [translation.reason, translation.actionable].filter(Boolean).join(' ');
    translationLevel = 'limited';
  } else if (translation?.status === 'disabled') {
    translationStatus = copy.workflowStatusDisabled;
    translationText = [copy.workflowTranslationOff, translation.actionable].filter(Boolean).join(' ');
  }
  renderWorkflowStep('translation', copy.workflowTranslationTitle, translationStatus, translationText, translationLevel);

  const semantic = analysisData.capa_semantica_ai;
  let semanticStatus = copy.workflowStatusDisabled;
  let semanticText = copy.workflowSemanticOff;
  let semanticLevel = 'off';
  if (semantic?.available && semantic?.status === 'partial') {
    semanticStatus = copy.workflowStatusPartial;
    semanticText = pipeline.semantic?.reason || copy.workflowSemanticPartial;
    semanticLevel = 'partial';
  } else if (semantic?.available) {
    semanticStatus = copy.workflowStatusReady;
    semanticText = pipeline.semantic?.reason || copy.workflowSemanticReady;
    semanticLevel = 'ready';
  } else if (semantic?.status === 'failed') {
    semanticStatus = copy.workflowStatusLimited;
    semanticText = [semantic.reason, semantic.actionable].filter(Boolean).join(' ');
    semanticLevel = 'limited';
  } else if (semantic?.status === 'disabled') {
    semanticStatus = copy.workflowStatusDisabled;
    semanticText = [copy.workflowSemanticOff, semantic.actionable].filter(Boolean).join(' ');
  }
  renderWorkflowStep('semantic', copy.workflowSemanticTitle, semanticStatus, semanticText, semanticLevel);

  const finalLayer = pipeline.final || {};
  const finalStatus = finalLayer.status === 'limited'
    ? copy.workflowStatusLimited
    : finalLayer.status === 'partial'
      ? copy.workflowStatusPartial
      : copy.workflowStatusReady;
  const finalText = finalLayer.mode === 'hybrid'
    ? (copy.workflowFinalHybrid || PANEL_COPY.en.workflowFinalHybrid)
    : finalLayer.mode === 'semantic'
      ? (copy.workflowFinalSemantic || PANEL_COPY.en.workflowFinalSemantic)
      : finalLayer.mode === 'translated'
        ? (copy.workflowFinalTranslated || PANEL_COPY.en.workflowFinalTranslated)
        : finalLayer.status === 'limited'
          ? (copy.workflowFinalLimited || PANEL_COPY.en.workflowFinalLimited)
          : (copy.workflowFinalLocal || PANEL_COPY.en.workflowFinalLocal);
  renderWorkflowStep(
    'final',
    copy.workflowFinalTitle || PANEL_COPY.en.workflowFinalTitle || 'Final map',
    finalStatus,
    finalLayer.reason || finalText,
    finalLayer.status === 'limited' ? 'limited' : finalLayer.status === 'partial' ? 'partial' : 'ready'
  );
}

async function rerenderCurrentAnalysis() {
  if (!currentAnalysisData) return;
  const locale = getOutputLanguagePreference();
  render(toViewModel(currentAnalysisData, { locale }));
  setTranslationStatus(translationStatusText(getPanelCopy(locale), currentAnalysisData?.capa_traduccion));
  setSemanticStatus(semanticStatusText(getPanelCopy(locale), currentAnalysisData?.capa_semantica_ai));
}

function renderComparison(locale) {
  const copy = getPanelCopy(locale);
  const compareCard = document.getElementById('card-compare');
  const compareSummary = document.getElementById('compare-summary');
  const comparePoints = document.getElementById('compare-points');
  const compareCurrentTitle = document.getElementById('compare-current-title');
  const compareReferenceTitle = document.getElementById('compare-reference-title');

  if (!currentAnalysisData || !compareReferenceData) {
    compareCard.hidden = true;
    compareSummary.textContent = '';
    comparePoints.innerHTML = '';
    compareCurrentTitle.textContent = '';
    compareReferenceTitle.textContent = '';
    return;
  }

  compareCard.hidden = false;
  compareCurrentTitle.textContent = currentAnalysisData.meta?.title || '';
  compareReferenceTitle.textContent = compareReferenceData.meta?.title || '';

  const comparison = buildComparison(currentAnalysisData, compareReferenceData, copy);
  compareSummary.textContent = comparison.summary;
  comparePoints.innerHTML = comparison.points.map((item) => `<li>${esc(item)}</li>`).join('');
}

function buildComparison(currentData, referenceData, copy) {
  const compareCopy = { ...PANEL_COPY.en, ...copy };
  const currentTerms = extractFocusTerms(currentData);
  const referenceTerms = extractFocusTerms(referenceData);
  const overlap = currentTerms.filter((term) => referenceTerms.includes(term)).slice(0, 3);

  const currentWords = currentData.estructura?.wordCount || 0;
  const referenceWords = referenceData.estructura?.wordCount || 0;
  const currentEvidence = (currentData.fuentes?.external || 0) + (currentData.estructura?.quoteCount || 0);
  const referenceEvidence = (referenceData.fuentes?.external || 0) + (referenceData.estructura?.quoteCount || 0);
  const currentTone = currentData.capa_semantica?.tonePolarity || 'neutral';
  const referenceTone = referenceData.capa_semantica?.tonePolarity || 'neutral';

  const points = [];
  points.push(currentWords >= referenceWords ? compareCopy.compareLengthMore : compareCopy.compareLengthLess);
  points.push(currentEvidence >= referenceEvidence ? compareCopy.compareEvidenceMore : compareCopy.compareEvidenceLess);
  points.push(currentTone === referenceTone ? compareCopy.compareToneSame : compareCopy.compareToneDifferent);
  points.push(
    overlap.length
      ? `${compareCopy.compareFocusOverlap} ${overlap.join(', ')}.`
      : compareCopy.compareFocusSplit
  );

  return {
    summary: overlap.length ? compareCopy.compareSummarySame : compareCopy.compareSummaryDifferent,
    points,
  };
}

function extractFocusTerms(data) {
  const termSet = new Set();
  (data.analisis_lexico?.topTerms || []).slice(0, 6).forEach((item) => {
    if (item?.term) termSet.add(String(item.term).toLowerCase());
  });
  (data.entidades_detectadas || []).slice(0, 4).forEach((item) => {
    if (item?.name) termSet.add(String(item.name).toLowerCase());
  });
  return [...termSet];
}

async function buildAnalysisData(extracted, sourceLanguage, outputLanguage, semanticConfig, translationConfig, comparativeConfig) {
  return runAnalysisPipeline({
    extracted,
    sourceLanguage,
    outputLanguage,
    semanticConfig,
    translationConfig,
    comparativeConfig,
    onStage(stage) {
      const panelCopy = getPanelCopy(outputLanguage);
      if (stage.layer === 'translation' && stage.state === 'running') {
        setLoadingCopy(panelCopy.loadingTranslating);
        setTranslationStatus(panelCopy.translationRunningStatus);
      }
      if (stage.layer === 'semantic' && stage.state === 'running') {
        setLoadingCopy(panelCopy.loadingSemantic);
        setSemanticStatus(panelCopy.semanticRunningStatus);
      }
    },
  });
}

async function runAnalysis() {
  setState('loading');
  btnAnalyze.disabled = true;

  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error('No hay ninguna pestana activa disponible.');

    const sourceLanguage = getSourceLanguagePreference();
    const outputLanguage = getOutputLanguagePreference();
    setLoadingCopy(getPanelCopy(outputLanguage).loadingExtracting);
    const semanticConfig = collectSemanticConfig();
    const translationConfig = collectTranslationConfig();
    const comparativeConfig = collectComparativeConfig();
    const cacheKey = buildCacheKey(tab.url, sourceLanguage, outputLanguage, semanticConfig, translationConfig, comparativeConfig);
    const cached = await cacheGet(cacheKey);

    if (cached) {
      currentAnalysisData = cached;
      await rerenderCurrentAnalysis();
      setState('ready');
      return;
    }

    const extracted = await extractFromTab(tab.id);
    const analysisData = await buildAnalysisData(extracted, sourceLanguage, outputLanguage, semanticConfig, translationConfig, comparativeConfig);
    currentAnalysisData = analysisData;

    await cacheSet(cacheKey, analysisData);
    await rerenderCurrentAnalysis();
    setState('ready');

    const rep = analysisData.capa_semantica?.domainReputation;
    const cs = analysisData.capa_semantica?.clickbaitScore ?? null;
    saveEntry({
      url: tab.url,
      title: analysisData.meta?.title || tab.title || '',
      domain: new URL(tab.url).hostname,
      language: analysisData.capa_semantica?.articleLanguage || 'unknown',
      outputLocale: outputLanguage,
      wordCount: analysisData.estructura?.wordCount || 0,
      readingTimeMin: analysisData.estructura?.readingTimeMin || 0,
      tone: analysisData.capa_semantica?.tonePolarity || 'neutral',
      structureKind: analysisData.capa_semantica?.structureKind || 'standard',
      evidenceLevel: analysisData.capa_semantica?.evidenceLevel || 'light',
      trustScore: rep?.trustScore ?? null,
      trustTier: rep ? (rep.trustScore >= 82 ? 'high' : rep.trustScore >= 62 ? 'medium' : rep.trustScore >= 40 ? 'low' : 'very-low') : null,
      clickbaitScore: cs,
      clickbaitLevel: cs === null ? null : cs >= 60 ? 'high' : cs >= 30 ? 'medium' : 'low',
    }).catch(() => {});
  } catch (err) {
    console.error('[Monitora]', err);
    errorMsg.textContent = err.message;
    setState('error');
  } finally {
    btnAnalyze.disabled = false;
  }
}

function countUp(el, target, displayValue, locale) {
  const duration = 600;
  const start = performance.now();
  const suffix = displayValue.replace(/[\d,.\s]/g, '').trim();
  const useLocale = displayValue.includes(',') || displayValue.includes('.') || target > 999;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(eased * target);
    el.textContent = useLocale
      ? current.toLocaleString(locale) + (suffix ? ` ${suffix}` : '')
      : current + (suffix ? ` ${suffix}` : '');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = displayValue;
  }

  requestAnimationFrame(step);
}

function setCardExpandedState(btn, expanded) {
  if (!btn) return;
  const bodyId = btn.getAttribute('aria-controls');
  const body = bodyId ? document.getElementById(bodyId) : null;
  const icon = btn.querySelector('.mol-reading-card__chevron');
  btn.setAttribute('aria-expanded', String(expanded));
  if (body) body.hidden = !expanded;
  icon?.classList.toggle('is-open', expanded);
}

function initCardToggles() {
  document.querySelectorAll('.mol-reading-card__toggle').forEach((btn) => {
    const startsOpen = btn.getAttribute('aria-expanded') === 'true';
    setCardExpandedState(btn, startsOpen);

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      setCardExpandedState(btn, !isOpen);
    });
  });
}

async function saveSemanticConfig() {
  const config = collectSemanticConfig();
  await savePreference(STORAGE_KEY_SEMANTIC_CONFIG, config);
  semanticAssistDismissed = false;
  setSemanticStatus(getPanelCopy(getOutputLanguagePreference()).semanticSavedStatus);
  void refreshSemanticAssist();
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
}

async function quickEnableSemantic() {
  const frameCopy = getActionPanelCopy(getOutputLanguagePreference(currentLocale));
  setSemanticStatus(frameCopy.semanticAssistWorking);
  analysisActionBusyKind = 'semantic';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  if (semanticQuickEnableButton) semanticQuickEnableButton.disabled = true;

  try {
    const currentConfig = normalizeSemanticConfig(collectSemanticConfig());
    const capability = await resolveSemanticCapability(currentConfig);
    const config = capability.recommended === 'remote'
      ? { enabled: true, provider: 'auto', endpoint: currentConfig.endpoint, model: currentConfig.model || '' }
      : getPreferredSemanticQuickConfig(capability.chromeAvailable);
    if (!config) {
      openSemanticSettings();
      return;
    }
    semanticAssistDismissed = false;
    populateSemanticConfig(config);
    updateSemanticProviderUI(config.provider);
    await savePreference(STORAGE_KEY_SEMANTIC_CONFIG, config);
    setSemanticStatus(getPanelCopy(getOutputLanguagePreference()).semanticSavedStatus);
    await refreshSemanticAssist();
    if (currentAnalysisData) {
      focusReadingMap();
      await runAnalysis();
    } else {
      setSemanticStatus(frameCopy.semanticAssistActivated);
    }
  } finally {
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    if (semanticQuickEnableButton) semanticQuickEnableButton.disabled = false;
  }
}

async function quickEnableTranslation() {
  const frameCopy = getActionPanelCopy(getOutputLanguagePreference(currentLocale));
  analysisActionBusyKind = 'translation';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  setTranslationStatus(frameCopy.actionWorking);
  const config = getPreferredTranslationQuickConfig();
  if (!config) {
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    openTranslationSettings();
    return;
  }
  populateTranslationConfig(config);
  updateTranslationProviderUI(config.provider);
  await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, config);
  setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationSavedStatus);
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function quickEnableTranslationDemo() {
  analysisActionBusyKind = 'translation';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const config = normalizeTranslationConfig({
    enabled: true,
    provider: 'mock',
    endpoint: '',
    userConfigured: true,
  });
  populateTranslationConfig(config);
  updateTranslationProviderUI(config.provider);
  await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, config);
  setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationSavedStatus);
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function quickEnableComparative() {
  analysisActionBusyKind = 'comparative';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const comparativeConfig = normalizeComparativeConfig(collectComparativeConfig());
  if (!comparativeConfig.apiKey) {
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    openComparativeSettings();
    return;
  }
  const frameCopy = getFrameCopy(getOutputLanguagePreference(currentLocale));
  if (comparativeStatus) comparativeStatus.textContent = frameCopy.actionWorking;
  const config = { ...comparativeConfig, enabled: true };
  populateComparativeConfig(config);
  await savePreference(STORAGE_KEY_COMPARATIVE_CONFIG, config);
  if (comparativeStatus) comparativeStatus.textContent = getPanelCopy(getOutputLanguagePreference()).comparativeSavedStatus;
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function disableSemanticFromActionPanel() {
  analysisActionBusyKind = 'semantic';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const currentConfig = normalizeSemanticConfig(collectSemanticConfig());
  const config = { ...currentConfig, enabled: false };
  populateSemanticConfig(config);
  updateSemanticProviderUI(config.provider);
  await savePreference(STORAGE_KEY_SEMANTIC_CONFIG, config);
  setSemanticStatus(getPanelCopy(getOutputLanguagePreference()).semanticDisabledStatus);
  await refreshSemanticAssist();
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function disableTranslationFromActionPanel() {
  analysisActionBusyKind = 'translation';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const currentConfig = normalizeTranslationConfig(collectTranslationConfig());
  const config = { ...currentConfig, enabled: false };
  populateTranslationConfig(config);
  updateTranslationProviderUI(config.provider);
  await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, config);
  setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationDisabledStatus);
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function disableComparativeFromActionPanel() {
  analysisActionBusyKind = 'comparative';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const currentConfig = normalizeComparativeConfig(collectComparativeConfig());
  const config = { ...currentConfig, enabled: false };
  populateComparativeConfig(config);
  await savePreference(STORAGE_KEY_COMPARATIVE_CONFIG, config);
  if (comparativeStatus) comparativeStatus.textContent = getPanelCopy(getOutputLanguagePreference()).comparativeSavedStatus;
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function saveInlineActionConfig(kind, root) {
  if (!root) return;

  if (kind === 'semantic') {
    analysisActionBusyKind = 'semantic';
    void rerenderCurrentAnalysis();
    const provider = root.querySelector('[data-inline-field="provider"]')?.value || 'remote';
    const endpoint = root.querySelector('[data-inline-field="endpoint"]')?.value || '';
    const model = root.querySelector('[data-inline-field="model"]')?.value || '';
    const config = normalizeSemanticConfig({ enabled: true, provider, endpoint, model });
    populateSemanticConfig(config);
    updateSemanticProviderUI(config.provider);
    await savePreference(STORAGE_KEY_SEMANTIC_CONFIG, config);
    setSemanticStatus(getPanelCopy(getOutputLanguagePreference()).semanticSavedStatus);
    await refreshSemanticAssist();
    analysisActionConfigKind = '';
    if (currentAnalysisData) {
      focusReadingMap();
      await runAnalysis();
    }
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    return;
  }

  if (kind === 'translation') {
    analysisActionBusyKind = 'translation';
    void rerenderCurrentAnalysis();
    const provider = root.querySelector('[data-inline-field="provider"]')?.value || 'remote';
    const endpoint = root.querySelector('[data-inline-field="endpoint"]')?.value || '';
    const config = normalizeTranslationConfig({ enabled: true, provider, endpoint, userConfigured: true });
    populateTranslationConfig(config);
    updateTranslationProviderUI(config.provider);
    await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, config);
    setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationSavedStatus);
    analysisActionConfigKind = '';
    if (currentAnalysisData) {
      focusReadingMap();
      await runAnalysis();
    }
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    return;
  }

  analysisActionBusyKind = 'comparative';
  void rerenderCurrentAnalysis();
  const apiKey = root.querySelector('[data-inline-field="apiKey"]')?.value || '';
  const config = normalizeComparativeConfig({ enabled: true, apiKey });
  populateComparativeConfig(config);
  await savePreference(STORAGE_KEY_COMPARATIVE_CONFIG, config);
  if (comparativeStatus) comparativeStatus.textContent = getPanelCopy(getOutputLanguagePreference()).comparativeSavedStatus;
  analysisActionConfigKind = '';
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

async function applyActionPreset(kind, presetId) {
  if (!presetId) return;

  if (kind === 'semantic') {
    analysisActionBusyKind = 'semantic';
    analysisActionConfigKind = '';
    void rerenderCurrentAnalysis();
    const current = normalizeSemanticConfig(collectSemanticConfig());
    const config = presetId === 'chrome-ai'
      ? { enabled: true, provider: 'chrome-ai', endpoint: '', model: '' }
      : presetId === 'remote'
        ? { enabled: true, provider: 'remote', endpoint: current.endpoint, model: '' }
        : { enabled: true, provider: 'ollama', endpoint: current.endpoint, model: current.model };
    populateSemanticConfig(config);
    updateSemanticProviderUI(config.provider);
    await savePreference(STORAGE_KEY_SEMANTIC_CONFIG, normalizeSemanticConfig(config));
    setSemanticStatus(getPanelCopy(getOutputLanguagePreference()).semanticSavedStatus);
    await refreshSemanticAssist();
    if (currentAnalysisData) {
      focusReadingMap();
      await runAnalysis();
    }
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    return;
  }

  if (kind === 'translation') {
    analysisActionBusyKind = 'translation';
    analysisActionConfigKind = '';
    void rerenderCurrentAnalysis();
    const current = normalizeTranslationConfig(collectTranslationConfig());
    const config = {
      enabled: true,
      provider: presetId === 'mock' ? 'mock' : presetId === 'libretranslate' ? 'libretranslate' : 'remote',
      endpoint: presetId === 'mock' ? '' : current.endpoint,
      userConfigured: true,
    };
    populateTranslationConfig(config);
    updateTranslationProviderUI(config.provider);
    await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, normalizeTranslationConfig(config));
    setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationSavedStatus);
    if (currentAnalysisData) {
      focusReadingMap();
      await runAnalysis();
    }
    analysisActionBusyKind = '';
    void rerenderCurrentAnalysis();
    return;
  }

  analysisActionBusyKind = 'comparative';
  analysisActionConfigKind = '';
  void rerenderCurrentAnalysis();
  const current = normalizeComparativeConfig(collectComparativeConfig());
  const config = { enabled: true, apiKey: current.apiKey };
  populateComparativeConfig(config);
  await savePreference(STORAGE_KEY_COMPARATIVE_CONFIG, config);
  if (comparativeStatus) comparativeStatus.textContent = getPanelCopy(getOutputLanguagePreference()).comparativeSavedStatus;
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
  analysisActionBusyKind = '';
  void rerenderCurrentAnalysis();
}

function openSemanticSettings() {
  semanticAssistDismissed = false;
  const semanticCardToggle = document.querySelector('#card-semantic-ai .mol-reading-card__toggle');
  setCardExpandedState(semanticCardToggle, true);
  semanticProviderInput?.focus();
  semanticProviderInput?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openTranslationSettings() {
  const semanticCardToggle = document.querySelector('#card-semantic-ai .mol-reading-card__toggle');
  setCardExpandedState(semanticCardToggle, true);
  translationProviderInput?.focus();
  translationProviderInput?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openComparativeSettings() {
  const semanticCardToggle = document.querySelector('#card-semantic-ai .mol-reading-card__toggle');
  setCardExpandedState(semanticCardToggle, true);
  comparativeApiKeyInput?.focus();
  comparativeApiKeyInput?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function handleAnalysisActionClick(event) {
  const actionButton = event.target.closest('[data-analysis-action]');
  const settingsButton = event.target.closest('[data-analysis-settings]');
  const inlineSaveButton = event.target.closest('[data-analysis-inline-save]');
  const inlineCancelButton = event.target.closest('[data-analysis-inline-cancel]');
  if (inlineSaveButton) {
    const kind = inlineSaveButton.getAttribute('data-analysis-inline-save');
    const root = inlineSaveButton.closest('[data-inline-config]');
    if (kind && !analysisActionBusyKind) void saveInlineActionConfig(kind, root);
    return;
  }
  if (inlineCancelButton) {
    analysisActionConfigKind = '';
    void rerenderCurrentAnalysis();
    return;
  }
  if (!actionButton && !settingsButton) return;

  const kind = actionButton?.getAttribute('data-analysis-action') || settingsButton?.getAttribute('data-analysis-settings');
  const actionState = actionButton?.getAttribute('data-analysis-state') || '';
  if (!kind) return;
  if (analysisActionBusyKind) return;

  if (settingsButton) {
    analysisActionConfigKind = analysisActionConfigKind === kind ? '' : kind;
    void rerenderCurrentAnalysis();
    return;
  }

  if (kind === 'semantic') {
    if (actionState === 'active') void disableSemanticFromActionPanel();
    else void quickEnableSemantic();
  }
  if (kind === 'translation') {
    if (actionState === 'active') void disableTranslationFromActionPanel();
    else if (resolveTranslationCapability(collectTranslationConfig()).recommended) void quickEnableTranslation();
    else void quickEnableTranslationDemo();
  }
  if (kind === 'comparative') {
    if (actionState === 'active') void disableComparativeFromActionPanel();
    else void quickEnableComparative();
  }
}

function continueWithLocalAnalysis() {
  semanticAssistDismissed = true;
  semanticAssist.hidden = true;
}

async function saveTranslationConfig() {
  const config = collectTranslationConfig();
  await savePreference(STORAGE_KEY_TRANSLATION_CONFIG, config);
  setTranslationStatus(getPanelCopy(getOutputLanguagePreference()).translationSavedStatus);
  if (currentAnalysisData) {
    focusReadingMap();
    await runAnalysis();
  }
}

async function saveCompareReference() {
  if (!currentAnalysisData) return;
  compareReferenceData = currentAnalysisData;
  await savePreference(STORAGE_KEY_COMPARE_REFERENCE, compareReferenceData);
  await rerenderCurrentAnalysis();
}

async function clearCompareReference() {
  compareReferenceData = null;
  await savePreference(STORAGE_KEY_COMPARE_REFERENCE, null);
  await rerenderCurrentAnalysis();
}

function updateSemanticProviderUI(provider) {
  const isChromeAI = provider === 'chrome-ai';
  const endpointRow = semanticEndpointInput?.closest('.mol-semantic-settings__row') || semanticEndpointInput?.parentElement;
  const modelRow = semanticModelInput?.closest('.mol-semantic-settings__row') || semanticModelInput?.parentElement;
  if (endpointRow) endpointRow.hidden = isChromeAI;
  if (modelRow) modelRow.hidden = isChromeAI;
}

function updateTranslationProviderUI(provider) {
  const endpointRow = translationEndpointInput?.closest('.mol-semantic-settings__row') || translationEndpointInput?.parentElement;
  const needsEndpoint = provider !== 'mock';
  if (endpointRow) endpointRow.hidden = !needsEndpoint;
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  semanticProviderInput?.addEventListener('change', () => updateSemanticProviderUI(semanticProviderInput.value));
  semanticProviderInput?.addEventListener('change', () => { semanticAssistDismissed = false; void refreshSemanticAssist(); });
  semanticEnabledInput?.addEventListener('change', () => { semanticAssistDismissed = false; void refreshSemanticAssist(); });
  semanticEndpointInput?.addEventListener('input', () => { void refreshCapabilityStatus(getOutputLanguagePreference(currentLocale)); });
  semanticModelInput?.addEventListener('input', () => { void refreshCapabilityStatus(getOutputLanguagePreference(currentLocale)); });
  translationEndpointInput?.addEventListener('input', () => { void refreshCapabilityStatus(getOutputLanguagePreference(currentLocale)); });
  semanticProviderInput?.addEventListener('change', () => { void refreshCapabilityStatus(getOutputLanguagePreference(currentLocale)); });
  translationProviderInput?.addEventListener('change', () => updateTranslationProviderUI(translationProviderInput.value));
  translationProviderInput?.addEventListener('change', () => { void refreshCapabilityStatus(getOutputLanguagePreference(currentLocale)); });
  semanticSaveButton.addEventListener('click', saveSemanticConfig);
  semanticQuickEnableButton?.addEventListener('click', quickEnableSemantic);
  semanticOpenSettingsButton?.addEventListener('click', openSemanticSettings);
  semanticLocalOnlyButton?.addEventListener('click', continueWithLocalAnalysis);
  analysisActionsList?.addEventListener('click', handleAnalysisActionClick);
  comparativeSaveButton?.addEventListener('click', saveComparativeConfig);
  translationSaveButton.addEventListener('click', saveTranslationConfig);
  compareSaveButton.addEventListener('click', saveCompareReference);
  compareClearButton.addEventListener('click', clearCompareReference);
  btnAnalyze.addEventListener('click', runAnalysis);
  btnRetry?.addEventListener('click', runAnalysis);

  document.getElementById('btn-export')?.addEventListener('click', exportAnalysis);

  const btnHistory = document.getElementById('btn-history');
  const historyPanel = document.getElementById('history-panel');
  const mainContent = document.getElementById('panel-content');
  btnHistory?.addEventListener('click', async () => {
    const isOpen = historyPanel?.hidden === false;
    if (historyPanel) historyPanel.hidden = isOpen;
    if (mainContent) mainContent.hidden = !isOpen;
    btnHistory.setAttribute('aria-pressed', String(!isOpen));
    if (!isOpen) await renderHistory();
  });

  document.getElementById('btn-history-close')?.addEventListener('click', () => {
    if (historyPanel) historyPanel.hidden = true;
    if (mainContent) mainContent.hidden = currentAnalysisData === null;
    btnHistory?.setAttribute('aria-pressed', 'false');
  });

  initCardToggles();
}

async function init() {
  ensurePanelScaffolding();
  bindEvents();

  try {
    const [semanticConfig, translationConfig, compareReference, comparativeConfig] = await Promise.all([
      readPreference(STORAGE_KEY_SEMANTIC_CONFIG, DEFAULT_SEMANTIC_CONFIG),
      readPreference(STORAGE_KEY_TRANSLATION_CONFIG, DEFAULT_TRANSLATION_CONFIG),
      readPreference(STORAGE_KEY_COMPARE_REFERENCE, null),
      readPreference(STORAGE_KEY_COMPARATIVE_CONFIG, DEFAULT_COMPARATIVE_CONFIG),
    ]);

    compareReferenceData = compareReference;
    populateLanguageSelects('auto', 'auto');

    // Auto-enable Chrome AI if available and user has never saved a semantic config
    const hasUserConfig = semanticConfig !== DEFAULT_SEMANTIC_CONFIG && semanticConfig?.provider;
    let effectiveSemanticConfig = ENABLE_EXPERIMENTAL_LAYERS ? semanticConfig : DEFAULT_SEMANTIC_CONFIG;
    if (ENABLE_EXPERIMENTAL_LAYERS && !hasUserConfig) {
      const chromeAIAvailable = await isChromeAIAvailable();
      if (chromeAIAvailable) {
        effectiveSemanticConfig = { enabled: true, provider: 'auto', endpoint: '', model: '' };
      }
    }
    populateSemanticConfig(effectiveSemanticConfig);
    updateSemanticProviderUI(effectiveSemanticConfig.provider);
    populateTranslationConfig(ENABLE_EXPERIMENTAL_LAYERS ? translationConfig : DEFAULT_TRANSLATION_CONFIG);
    updateTranslationProviderUI(normalizeTranslationConfig(ENABLE_EXPERIMENTAL_LAYERS ? translationConfig : DEFAULT_TRANSLATION_CONFIG).provider);
    populateComparativeConfig(ENABLE_EXPERIMENTAL_LAYERS ? comparativeConfig : DEFAULT_COMPARATIVE_CONFIG);
    applyStaticCopy(getOutputLanguagePreference());
    refreshPanelGroups();
    await refreshSemanticAssist();
    setTranslationStatus(
      normalizeTranslationConfig(translationConfig).enabled
        ? getPanelCopy(getOutputLanguagePreference()).translationSavedStatus
        : getPanelCopy(getOutputLanguagePreference()).translationDisabledStatus
    );
    setSemanticStatus(
      normalizeSemanticConfig(effectiveSemanticConfig).enabled
        ? getPanelCopy(getOutputLanguagePreference()).semanticSavedStatus
        : getPanelCopy(getOutputLanguagePreference()).semanticDisabledStatus
    );
  } catch (err) {
    console.error('[Monitora:init]', err);
    populateLanguageSelects('auto', 'auto');
    populateSemanticConfig(DEFAULT_SEMANTIC_CONFIG);
    populateTranslationConfig(DEFAULT_TRANSLATION_CONFIG);
    updateTranslationProviderUI(DEFAULT_TRANSLATION_CONFIG.provider);
    applyStaticCopy(getOutputLanguagePreference());
    refreshPanelGroups();
    await refreshSemanticAssist();
    setTranslationStatus(getPanelCopy('auto').translationSavedStatus);
    setSemanticStatus(getPanelCopy('auto').semanticDisabledStatus);
  }

  setState('idle');

  getActiveTab().then((tab) => {
    if (!tab?.url) return;
    try { renderProactiveDomainAlert(new URL(tab.url).hostname); } catch { /* non-fatal */ }
  });
}

init();
