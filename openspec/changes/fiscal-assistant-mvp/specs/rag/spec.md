# RAG Specification

## Purpose

Ingesta, indexación y recuperación del corpus curado de normativa AFIP/ARCA para monotributistas, sobre pgvector (Neon).

## Requirements

### Requirement: Ingesta desde corpus curado

El sistema MUST generar embeddings (`text-embedding-004`, Vertex AI) para cada ficha del corpus en `data/normativa/` y almacenarlos en pgvector.

#### Scenario: Ingesta inicial
- GIVEN un corpus de fichas markdown en `data/normativa/`
- WHEN se corre el script de ingesta
- THEN cada ficha queda embebida y almacenada con su metadata (título, RG/norma citada, fecha)

### Requirement: Retrieval por similitud

El sistema MUST recuperar las N fichas más relevantes (similitud coseno) para cada pregunta del usuario antes de generar la respuesta.

#### Scenario: Retrieval exitoso
- GIVEN una pregunta del usuario
- WHEN se ejecuta la búsqueda por similitud
- THEN el sistema devuelve las fichas con score por encima del umbral configurado

#### Scenario: Sin resultados relevantes
- GIVEN una pregunta fuera del dominio del corpus
- WHEN ninguna ficha supera el umbral de similitud
- THEN el retrieval devuelve una lista vacía (no fuerza una ficha poco relevante)

### Requirement: Trazabilidad de fuente

Cada fragmento recuperado MUST poder trazarse al documento/ficha de origen (para la cita en la respuesta y para los evals de "no alucina fuente").

#### Scenario: Cita verificable
- GIVEN una respuesta que cita una norma
- WHEN se audita esa respuesta
- THEN la norma citada MUST existir literalmente en el corpus curado
