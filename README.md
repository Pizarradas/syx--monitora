# Monitora

Extension de Chrome Manifest V3 para analizar articulos desde un panel lateral. El foco no es etiquetar ideologicamente una pieza, sino describir como esta construida: estructura, lenguaje, atribucion, fuentes, encuadre y señales retoricas.

## Estado actual

- Version: `0.2.0`
- Idioma de producto: espanol
- Entorno: extension local cargada como `unpacked`
- UI principal: `sidepanel.html`
- Analisis base: local
- Capas opcionales: traduccion y semantica asistida
- Visualizacion: bloques editoriales y `Chart.js`

## Que hace la extension

- Extrae contenido del articulo activo.
- Calcula estructura basica: palabras, parrafos, citas, enlaces, tiempos de lectura y densidades.
- Analiza lenguaje: repeticion, complejidad sintactica, facilidad de lectura, marcas de evasion y recursos de escritura.
- Estima balance argumental: evidencia, interpretacion y opinion.
- Detecta actores, atribucion, anatomia de fuentes, voces y marcos narrativos.
- Puede enriquecer el resultado con traduccion y una capa semantica opcional.
- Presenta todo en un sidepanel orientado a lectura editorial.

## Como esta organizado

### Flujo principal

1. `content-script.js` extrae el contenido visible.
2. `src/analyzer.js` ejecuta el analisis local.
3. `src/pipeline/analysis-orchestrator.js` combina analisis local, traduccion y semantica.
4. `src/ui-models.js` transforma la salida a un view model estable para la UI.
5. `sidepanel.js` renderiza tarjetas, estados, charts y acciones.

### Archivos clave

- `manifest.json`
  Registro de la extension, permisos, service worker y side panel.
- `sidepanel.html`
  Estructura del panel.
- `sidepanel.css`
  Sistema visual del panel.
- `sidepanel.js`
  Copy, render, estados y wiring de UI.
- `content-script.js`
  Extraccion del articulo en la pagina.
- `service-worker.js`
  Coordinacion MV3.
- `src/analyzer.js`
  Analisis local principal.
- `src/ui-models.js`
  Adaptacion de datos a UI.
- `src/charts.js`
  Render de charts con `Chart.js`.
- `src/translator.js`
  Proveedores de traduccion.
- `src/ai-analyzer.js`
  Proveedores de semantica asistida.

## Capas de analisis

### 1. Extraccion

Recoge:

- titulo
- autor
- fecha
- headings
- parrafos
- citas
- enlaces

Tambien calcula confianza de extraccion y señales de fragilidad.

### 2. Analisis local

No depende de red. Calcula:

- estructura del texto
- terminos frecuentes
- repeticion lexica
- densidad adjetival
- complejidad sintactica
- facilidad de lectura
- lenguaje evasivo
- perfil evidencia / interpretacion / opinion
- entidades detectadas
- anatomia de fuentes
- marcos narrativos
- mapa de perspectivas
- diagnostico por parrafos
- atribucion por actor

### 3. Traduccion opcional

Se usa cuando el idioma de salida no coincide con el texto o cuando conviene normalizar la lectura. Nunca bloquea el analisis local.

### 4. Semantica asistida opcional

Genera resumen, actores, eventos, puntos ciegos y apoyo editorial adicional. Si falla, el panel sigue funcionando con la capa local.

## Estructura actual del sidepanel

La UI se reorganizo para leer mejor el analisis en bloques editoriales:

- `Panorama`
- `Como esta construido`
- `Quien sostiene el texto`
- `Que encuadre domina`

Refactors UX relevantes ya aplicados:

- cabecera reforzada con mejor jerarquia y control de desbordes
- fusion de `Actores detectados` y `Atribucion por actor`
- fusion de `Red de fuentes` y `Anatomia de fuentes`
- fusion de `Mapa de voces` y `Marcos narrativos`
- eliminacion de numeracion tipo `Capa 2c`
- sustitucion de caracteres rotos y pseudo-emojis por iconos inline
- integracion de nuevas visualizaciones con `Chart.js`

## Sistema de visualizacion

Charts ya incorporados:

- perfil argumentativo
- progresion por parrafo
- peso de actores
- composicion de fuentes
- atribucion por actor
- cohesion y modalizacion
- balance de encuadres
- radar retorico

Criterio UX aplicado:

- los indices del bloque de lenguaje usan escala comun `0-100`
- los conteos se muestran como conteos, no como pseudo-puntuaciones
- las proporciones `evidencia / interpretacion / opinion` viven en `Balance argumental`, no mezcladas con los indices de estilo

## Proveedores

### Traduccion

Contrato comun:

- `validateConfig()`
- `isAvailable()`
- `run()`
- `normalizeResult()`
- `normalizeError()`

Implementaciones actuales:

- `libretranslate`
- `remote`
- `mock`

### Semantica

Implementaciones actuales:

- `chrome-ai`
- `ollama`
- `remote`

## Fallbacks

- Si la extraccion es debil, el panel sigue mostrando un mapa local con cautela.
- Si falla la traduccion, el analisis local permanece disponible.
- Si falla la semantica, no se rompe la UI.
- Si faltan datos, se prioriza ocultar o degradar bloques antes que mostrar ruido.

## Desarrollo y carga local

1. Abre `chrome://extensions/`.
2. Activa `Modo de desarrollador`.
3. Carga la carpeta `syx` como extension desempaquetada.
4. Abre cualquier articulo y despliega el sidepanel.

## Verificacion rapida

Checks utiles:

```powershell
node --check sidepanel.js
node --check src/ui-models.js
node --check src/analyzer.js
node --check src/charts.js
```

## Documentacion adicional

- [ARCHITECTURE.md](C:/Users/User/OneDrive/Escritorio/reading/syx/ARCHITECTURE.md)
- [QA.md](C:/Users/User/OneDrive/Escritorio/reading/syx/QA.md)
- [ROADMAP.md](C:/Users/User/OneDrive/Escritorio/reading/syx/ROADMAP.md)

## Siguientes pasos razonables

- validar visualmente la densidad final de algunas tarjetas
- afinar nombres editoriales y microcopy
- mejorar comparativa entre articulos
- endurecer deteccion de puntos ciegos y atribucion
- decidir si el producto seguira monolingue o si conviene internacionalizarlo de verdad
