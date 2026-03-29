# Roadmap

## Ya implementado

### Base del producto

- extraccion local del articulo
- sidepanel MV3
- analisis estructural y lexico
- proveedores opcionales de traduccion
- proveedores opcionales de semantica

### Evolucion del analisis

- balance `evidencia / interpretacion / opinion`
- anatomia de fuentes
- peso de actores
- progresion por parrafo
- atribucion por actor
- cohesion y modalizacion
- balance de encuadres
- radar retorico

### Evolucion UX

- cabecera reforzada
- iconografia inline
- fusion de tarjetas redundantes
- renombrado editorial de bloques
- eliminacion de numeracion tecnica visible
- unificacion del sistema de indices del bloque de lenguaje

## Siguiente fase recomendable

### 1. Validacion visual real

- revisar densidad de tarjetas en sidepanel cargado
- ajustar alturas de charts
- simplificar donde haya exceso de scroll

### 2. Saneado de texto y encoding

- eliminar restos de mojibake
- revisar cadenas historicas con acentos rotos
- decidir una politica clara de codificacion UTF-8

### 3. Endurecer heuristicas

- mejorar `evidence / interpretation / opinion`
- afinar atribucion por actor
- mejorar puntos ciegos y voces omitidas
- detectar mejor framing y adjetivacion aplicada a actores

### 4. Comparativa entre articulos

- alinear focos tematicos entre dos piezas
- comparar distribucion de voces
- comparar fuentes y apoyo
- comparar framing dominante

### 5. Decision de producto

Elegir una de estas dos vias:

- mantener producto monolingue en espanol y limpiar copy
- abrir de verdad la internacionalizacion y ordenar todas las cadenas

## Tareas de mantenimiento

- pasar `node --check` sobre los JS principales antes de cada release
- validar carga de extension desempacada en Chrome
- revisar `QA.md`
- mantener README y roadmap sincronizados con el estado real
