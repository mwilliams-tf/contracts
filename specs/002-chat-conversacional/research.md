# Phase 0 — Research: Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Esta feature evoluciona el Chat IA ya implementado en `001-clm-chat-mvp`. El stack y las
decisiones de base (React/Vite/TS/Tailwind, corpus JSON local, motor de recuperación
determinista, identidad simulada, `localStorage`) se heredan y **no se reabren**. No hubo
marcadores `NEEDS CLARIFICATION` en el Technical Context. Esta investigación documenta solo
las decisiones nuevas que introduce la multiplicidad de conversaciones, la referencia
cruzada y la acción de redacción simulada.

## D1 — Modelo de multiplicidad: bandeja de conversaciones por usuaria

- **Decision**: Reemplazar el modelo de hilo único (`Conversation = { userId, messages }`)
  por una **lista de conversaciones** por usuaria. Cada `Conversation` gana `id`, `title`,
  `type` (`portfolio | anchored`), `focusContractId?`, `status` (`live | frozen`),
  `createdAt`, `updatedAt` y `messages` (turnos). La bandeja se persiste bajo
  `clm-chat:conversations:<userId>` en `localStorage`.
- **Rationale**: Corrige el malentendido conceptual central (el chat no pertenece a un
  contrato; la usuaria tiene varias conversaciones). Mantiene la privacidad por usuaria
  (Principio VI) reusando el namespacing existente. Sin backend.
- **Alternatives considered**: Mantener un solo hilo con "secciones" (no demuestra
  multiplicidad ni bandeja); IndexedDB para conversaciones (innecesario para el volumen de
  demo; `localStorage` ya se usa para historial y es suficiente).

## D2 — Conversaciones seed (Acme congelada, 2028 portfolio, Stanley en vivo)

- **Decision**: Definir las tres conversaciones seed en `data/seed-conversations.ts` y
  sembrarlas en la bandeja de la usuaria abogada por defecto la primera vez (si no existen
  ya en `localStorage`). Acme y 2028 nacen con `status: "frozen"` y su historial completo
  pre-cargado; Stanley nace `live` y vacía (o con un primer turno), reproducible on demand.
- **Rationale**: FR-005 exige las tres conversaciones visibles al abrir la bandeja. Sembrar
  en código (no en el corpus JSON de solo lectura) respeta el Principio V y permite
  reproducir/resetear la demo (consistente con `lib/stanley-demo-reset.ts` ya existente).
- **Alternatives considered**: Hardcodear las seeds en el corpus `contracts.json` (mezcla
  datos de conversación con datos de contrato; no corresponde); generar las seeds en runtime
  con el motor (frágil y no determinista para una conversación "congelada ya resuelta").

## D3 — Memoria de hilo por conversación

- **Decision**: La memoria de hilo se mantiene **por conversación**: el motor recibe
  `priorMessages` de esa conversación (ya soportado en `ChatContext`) más el `focusContractId`
  de la conversación. Las referencias de seguimiento ("¿y los firmantes?", "esa cláusula")
  se resuelven contra el foco y los turnos previos de esa misma conversación.
- **Rationale**: FR-011 y el ya implementado `buildSearchText`/`conversationContextText` en
  `engine.ts` (usa los últimos 3 turnos del usuario). Aislar por conversación evita
  contaminación entre hilos.
- **Alternatives considered**: Memoria global por usuaria (rompe el aislamiento entre
  conversaciones y produce respuestas incoherentes al cambiar de hilo).

## D4 — Referencia cruzada: contrato principal + contratos referenciados

- **Decision**: Extender `ChatAnswer` con `principalContractId` y `referencedContractIds`
  (además del actual `matchedContractIds`). Un módulo nuevo `chat/cross-reference.ts`
  detecta pedidos de precedente/comparación ("cómo se resolvió en Acme", "comparar con")
  y construye una respuesta que (a) actúa sobre el foco (principal) y (b) cita fuentes de
  los contratos referenciados, indicando el contrato de origen en cada cita.
- **Rationale**: FR-014/FR-015/FR-016 exigen traer precedentes de cualquier contrato y
  declarar principal + referenciados. Reutiliza el corpus completo (ya disponible en
  `ChatContext.corpus`) y el ranking por proveedor de `engine.ts`.
- **Alternatives considered**: Limitar el motor al contrato de foco (contradice el concepto
  clave de la spec: el foco es punto de partida, no encierro); un índice semántico/embeddings
  (complejidad innecesaria para un corpus pequeño y guionado).

## D5 — Acción simulada de redacción → borrador de trabajo local

- **Decision**: Un módulo `chat/drafting.ts` detecta pedidos de redacción ("ampliá la
  cláusula", "redactá") y produce una **propuesta** de texto. La UI (`DraftActionCard`)
  ofrece "aplicar al borrador"; al confirmarse, `lib/working-drafts.ts` guarda un
  `WorkingDraft` (versión nueva) bajo `clm-chat:drafts:<contractId>` en `localStorage`, sin
  tocar el corpus ni IndexedDB de documentos. La tarjeta rotula "acción simulada" y aclara
  el punto de sustitución (en producción → .docx en Drive).
- **Rationale**: FR-017–FR-020 y Principio V (solo lectura en fuentes). `localStorage`
  separado de los documentos reales (IndexedDB `document-store.ts`) deja claro que es un
  artefacto de demo. Determinista y reproducible.
- **Alternatives considered**: Escribir en IndexedDB junto a documentos subidos (riesgo de
  confundir borrador simulado con documento fuente); generar un `.docx` real (viola
  Principios V y VII); modificar `contracts.json`/`documents.json` (prohibido, solo lectura).

## D6 — Sugerencias clicables (chips) por estado y tipo de conversación

- **Decision**: `chat/suggestions.ts` deriva un conjunto de chips a partir del tipo de
  conversación (portfolio vs anclada), el estado del contrato de foco y el último turno.
  `SuggestionChips` los renderiza; al pulsar uno se envía la consulta correspondiente
  (mismo flujo que el input de texto).
- **Rationale**: FR-022 y guía de demo (reducir texto libre en vivo, SC-009). Determinista
  y alineado con el dominio (p. ej. en "Revisión del proveedor" sugerir la objeción de
  cláusula 9).
- **Alternatives considered**: Chips estáticos fijos (no se adaptan al estado y rompen la
  narrativa); generación libre por NLP (no determinista).

## D7 — Apertura contextual desde el detalle e integración con workflow

- **Decision**: En `clm/ContractDetail.tsx` agregar "Consultar al asistente" que navega a
  `/chat/c/:conversationId` creando (o reabriendo) una conversación **anclada** con
  `focusContractId` = ese contrato, sin restringir la consulta a él. El asistente puede
  **sugerir** una transición de workflow pertinente (texto/atajo), pero la ejecución sigue
  exclusivamente en `clm/components/WorkflowActions.tsx` (no se ejecuta desde el chat).
- **Rationale**: FR-021/FR-023/FR-024. Mantiene el bounded context CLM dueño de las
  transiciones (Principio IV) y evita acciones automáticas sobre el expediente.
- **Alternatives considered**: Ejecutar la transición desde el chat (acopla módulos y
  contradice "no ejecutarla automáticamente"); abrir el chat como modal exclusivo del
  contrato (reintroduce el malentendido del diseño anterior).

## D8 — Compatibilidad con el hilo único anterior (`001`)

- **Decision**: `lib/history.ts` se conserva como capa de compatibilidad: si existe un
  historial antiguo (`clm-chat:history:<userId>`), se migra/ofrece como una conversación
  más en la bandeja (tipo portfolio) o simplemente se ignora a favor de las seeds. No se
  rompe el almacenamiento previo.
- **Rationale**: Evita pérdida de datos de demos previas y simplifica la transición. Bajo
  costo.
- **Alternatives considered**: Borrar el historial anterior (innecesariamente destructivo).

## D9 — Sin nuevas dependencias ni servicios

- **Decision**: No se agregan librerías. Toda la lógica nueva es TypeScript determinista
  sobre el corpus y `localStorage`.
- **Rationale**: Principio VII (Simplicidad sobre Integración). La interfaz del motor sigue
  aislada para que IT la sustituya por un LLM real sin cambiar la UI.

**Output**: Sin `NEEDS CLARIFICATION` pendientes. Listo para Phase 1.
