# Arquitectura

## Vision general

Monitora esta construida como una extension MV3 con un sidepanel rico y un pipeline de analisis por capas. La idea central es desacoplar extraccion, analisis local, enriquecimiento opcional y render.

## Componentes principales

### Extension shell

- `manifest.json`
- `service-worker.js`
- `content-script.js`
- `sidepanel.html`
- `sidepanel.css`
- `sidepanel.js`

### Nucleo de analisis

- `src/analyzer.js`
- `src/ui-models.js`
- `src/charts.js`
- `src/pipeline/analysis-orchestrator.js`

### Integraciones opcionales

- `src/translator.js`
- `src/ai-analyzer.js`

## Pipeline

### Paso 1. Extraccion

El `content-script` intenta obtener el articulo activo y devolver una estructura uniforme:

- `meta`
- `url`
- `paragraphs`
- `quotes`
- `links`
- `fullText`
- `headings`

### Paso 2. Analisis local

`src/analyzer.js` trabaja sobre el texto extraido y devuelve:

- `estructura`
- `analisis_lexico`
- `capa_semantica`
- `fuentes`
- `entidades_detectadas`
- `sentimiento`
- `diagnostico_parrafos`
- `atribucion_actores`
- `anatomia_fuentes`
- `marcos_narrativos`
- `mapa_perspectivas`
- `perfil_estilo`

### Paso 3. Orquestacion

`analysis-orchestrator.js` decide:

- si basta con la salida local
- si hay que traducir
- si puede invocar capa semantica
- como combinar resultados sin bloquear el flujo

### Paso 4. Adaptacion a UI

`src/ui-models.js` convierte la salida del pipeline a un view model estable para tarjetas, barras, notas, listas y charts.

### Paso 5. Render

`sidepanel.js` hace:

- aplicacion de copy por locale
- wiring de botones y toggles
- render de estados
- render de tarjetas
- render de charts
- ocultacion inteligente de bloques vacios o irrelevantes

## Criterios de diseno tecnico

### Degradacion elegante

- el analisis local nunca depende de red
- la traduccion no rompe el panel
- la semantica es opcional
- los bloques vacios se ocultan

### Separacion de responsabilidades

- extraccion no decide copy ni UI
- el analizador no conoce el DOM
- `ui-models.js` es la frontera entre datos y presentacion
- `charts.js` encapsula la logica visual de `Chart.js`

### Orientacion editorial

La UI no esta pensada como un dashboard generico. Se ha ido moviendo hacia bloques que expliquen:

- como esta construido el texto
- quien sostiene sus afirmaciones
- que voces y encuadres dominan

## Bloques actuales del panel

### Panorama

- mapa de lectura
- resumen rapido
- workflow de capas activas

### Como esta construido

- base cuantitativa
- lenguaje
- terminos y foco
- arquitectura del texto
- perfil retorico

### Quien sostiene el texto

- actores y atribucion
- fuentes y apoyo

### Que encuadre domina

- voces y encuadre

## Heuristicas relevantes

### Lenguaje

- repeticion lexica
- densidad adjetival
- complejidad sintactica
- facilidad de lectura
- marcas de evasion

### Balance argumental

Heuristica local basada en patrones para:

- evidencia
- interpretacion
- opinion

### Perspectiva

- voces presentes
- angulos omitidos
- afirmaciones sin respaldo

## Deuda tecnica a vigilar

- coexistencia de copy historico con algunas cadenas antiguas
- necesidad de validacion visual final en extension real
- deteccion heuristica mejorable en textos muy cortos o muy atipicos
- algunos archivos muestran restos de codificacion legacy que conviene sanear en una pasada especifica

## Punto de entrada para retomar el proyecto

Si vuelves dentro de meses, el orden mas util para reengancharte es:

1. leer `README.md`
2. revisar `ARCHITECTURE.md`
3. abrir `src/analyzer.js`
4. abrir `src/ui-models.js`
5. abrir `sidepanel.js`
6. cargar la extension y recorrer `QA.md`
