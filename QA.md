# QA Manual

## QA manual

Guia de validacion manual para Monitora.

## Antes de probar

- Carga la extension en Chrome como `unpacked`.
- Abre el sidepanel.
- Mantén abiertas las DevTools del panel y del service worker en la primera pasada.
- Si usas proveedores locales:
  - LibreTranslate: `http://127.0.0.1:5000`
  - Ollama: `http://127.0.0.1:11434`

## Escenarios base

### 1. Ruta local en el mismo idioma

- Entrada: articulo en espanol
- Idioma de salida: `ES`
- Traduccion: desactivada
- Semantica: desactivada

Esperado:

- el workflow muestra extraccion y analisis local listos
- el mapa final se resuelve como local
- el panel sigue siendo util sin proveedores externos

### 2. Ruta con traduccion

- Entrada: articulo en frances, aleman o ingles
- Idioma de salida: `ES`
- Traduccion: activada
- Semantica: desactivada

Esperado:

- la traduccion se ejecuta cuando origen y salida difieren
- el panel informa proveedor y cobertura
- si falla la traduccion, el panel conserva la capa local

### 3. Traduccion mas semantica

- Entrada: articulo en ingles
- Idioma de salida: `ES`
- Traduccion: activada
- Semantica: activada

Esperado:

- workflow con todas las capas activas
- bloque semantico con resumen, actores, eventos y señales editoriales
- modo final `hibrido` si ambas capas aportan al resultado

### 4. Extraccion debil

- Entrada: articulo con carga diferida, preview de muro o contenido incompleto

Esperado:

- la extraccion cae en `partial` o `limited`
- el panel no se rompe
- el mapa se muestra con cautela y el workflow lo deja claro

## Escenarios UX que conviene revisar

### Cabecera

- no debe desbordar el titulo en la derecha
- `Historial` debe mantenerse legible o colapsar a icono en estrecho
- la jerarquia visual debe ser clara entre kicker, titulo y subtitulo

### Bloques editoriales

- `Como esta construido` no debe sentirse como dashboard caotico
- `Quien sostiene el texto` debe evitar duplicidades
- `Que encuadre domina` debe agrupar voces y framing con claridad

### Bloque de lenguaje

Esperado:

- indices superiores en escala comun `0-100`
- sin mezcla de `%`, `pt` y conteos en la misma lista
- `evidencia / interpretacion / opinion` solo en `Balance argumental`

## Fallos a simular

### Endpoint de traduccion caido

- configura `LibreTranslate`
- usa un endpoint invalido

Esperado:

- la capa de traduccion falla con mensaje accionable
- el panel sigue mostrando analisis local

### Proveedor semantico mal configurado

- configura `Ollama`
- quita modelo o endpoint

Esperado:

- la capa semantica falla sin romper la UI
- el panel explica el problema

## Checklist de regresion

- los toggles guardan configuracion
- el historial sigue guardando analisis
- exportar sigue funcionando
- los charts renderizan sin errores
- las tarjetas vacias se ocultan
- no reaparecen caracteres rotos ni iconos degradados a texto
