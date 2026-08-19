# Fiscal Assistant Specification

## Purpose

Agente conversacional que responde dudas fiscales genéricas de monotributistas argentinos, usando exclusivamente su base de conocimiento curada (RAG), y deriva a un humano cuando la pregunta excede lo genérico.

## Requirements

### Requirement: Grounding obligatorio

El sistema MUST responder únicamente con información recuperada del corpus de normativa (RAG). El sistema MUST NOT responder una pregunta fiscal usando solo su conocimiento paramétrico si el retrieval no devolvió una fuente relevante.

#### Scenario: Pregunta con fuente disponible
- GIVEN el usuario pregunta "¿qué es una factura C?"
- WHEN el retrieval encuentra una ficha relevante en el corpus
- THEN el sistema responde citando esa ficha (nombre/RG de la norma)

#### Scenario: Pregunta sin fuente disponible
- GIVEN el usuario pregunta algo fuera del corpus curado
- WHEN el retrieval no devuelve ninguna ficha con similitud suficiente
- THEN el sistema responde que no tiene información verificada sobre eso, sin inventar una respuesta

### Requirement: Human-in-the-loop ante pregunta específica del usuario

El sistema MUST usar `askUser`/derivar a humano cuando la pregunta requiere datos personales del monotributista (su categoría actual, su facturación real) que el sistema no tiene.

#### Scenario: Pregunta genérica
- GIVEN el usuario pregunta "¿cuáles son las categorías de monotributo?"
- WHEN es una pregunta genérica cubierta por el corpus
- THEN el sistema responde directo, sin derivar

#### Scenario: Pregunta que requiere dato personal
- GIVEN el usuario pregunta "¿tengo que recategorizarme?"
- WHEN la respuesta depende de su facturación real (dato que el sistema no tiene)
- THEN el sistema NUNCA asume una categoría y SIEMPRE indica que debe consultarlo con su contador con sus datos reales

### Requirement: Fecha de corte visible

El sistema MUST mostrar al usuario la fecha de corte del corpus de normativa en cada respuesta o en la UI.

#### Scenario: Respuesta mostrada
- GIVEN el sistema responde cualquier pregunta
- THEN la fecha de corte del corpus MUST ser visible en la respuesta o en la interfaz
