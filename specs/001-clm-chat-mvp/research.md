# Phase 0 — Research: MVP Demo Unificado CLM + Chat IA

**Feature**: `001-clm-chat-mvp` | **Date**: 2026-06-09

El alcance del prototipo es deliberadamente acotado, por lo que no hubo marcadores
`NEEDS CLARIFICATION` en el Technical Context. Esta investigación documenta las
decisiones técnicas tomadas para satisfacer la spec y la constitution con la menor
complejidad posible.

## D1 — Stack de UI

- **Decision**: SPA con React 18 + Vite 5 + TypeScript + Tailwind CSS 3, React Router 6.
- **Rationale**: Arranque rápido, hot-reload para iterar la demo, tipado para reflejar
  el modelo de dominio, y Tailwind para una UI clara en español con poco esfuerzo. No
  requiere backend ni infraestructura.
- **Alternatives considered**: Next.js (innecesario sin SSR/backend, agrega complejidad);
  HTML/JS vanilla (más lento de iterar, peor DX para 4 vistas y estado de chat).

## D2 — Origen de datos (corpus ficticio)

- **Decision**: Archivos JSON locales en `src/data/`, importados estáticamente y
  normalizados en `lib/corpus.ts`. Solo lectura.
- **Rationale**: Cumple "Datos Ficticios, Flujo Real" (Principio III) y "Solo Lectura en
  Fuentes" (Principio V). Versionable, fácil de editar para ajustar la narrativa de la
  demo. Sin base de datos ni servidor.
- **Alternatives considered**: SQLite/IndexedDB (sobredimensionado para ~20–50 contratos);
  API mock con servidor (viola Simplicidad sobre Integración).

## D3 — "Chat IA": motor de recuperación local (sin LLM externo)

- **Decision**: Motor de recuperación determinista en `chat/engine.ts` que: (1) tokeniza
  la consulta, (2) detecta intención básica por palabras clave (vencimiento, firmantes,
  cláusula, partes, estado), (3) recupera el/los contratos y fuentes relevantes del
  corpus, (4) construye una respuesta en español con plantilla, (5) adjunta citas de
  fuente, (6) ante datos en conflicto, ordena fuentes por fecha y prioriza la más
  reciente.
- **Rationale**: Evita claves de API, costos y dependencia de red (Principio VII), es
  100% determinista para una demo confiable, y garantiza citas de fuente (FR-011) y
  prioridad por recencia (FR-012) por construcción. Es estrictamente de solo lectura
  (FR-015/FR-016).
- **Alternatives considered**: LLM real vía API (requiere clave/red/SSO, no determinista,
  riesgo de alucinación de citas — viola Principios V y VII); embeddings locales
  (complejidad innecesaria para un corpus pequeño y consultas acotadas).
- **Nota**: La interfaz del motor (`answer(query, context)`) queda aislada para que IT
  pueda sustituir la implementación por un LLM real en la fase productiva sin cambiar la
  UI (punto de sustitución explícito).

## D4 — Privacidad del historial de chat

- **Decision**: Identidad simulada (selección de usuaria al inicio) en `lib/session.ts`;
  historial persistido en `localStorage` bajo una clave namespaced por id de usuaria
  (`clm-chat:history:<userId>`), gestionado en `lib/history.ts`.
- **Rationale**: Cumple "Privacidad de Historial" (Principio VI / FR-013) de forma simple
  y demostrable: cambiar de usuaria muestra otro historial; no hay fuga cruzada. Sin SSO.
- **Alternatives considered**: Backend con sesiones (viola Simplicidad sobre Integración);
  estado solo en memoria (no demuestra persistencia/privacidad al recargar).

## D5 — Marcador de "datos ficticios"

- **Decision**: Componente compartido `FictitiousDataBadge` montado en el layout (`App.tsx`)
  y reforzado en encabezados de tablero, detalle y chat.
- **Rationale**: FR-005 y SC-006 exigen visibilidad permanente; un componente compartido
  garantiza presencia en el 100% de pantallas principales.

## D6 — Prioridad de contratos En curso / Pendiente

- **Decision**: `WorkflowState` incluye una marca `active` (en curso/pendiente). El
  tablero ordena estos primero y los destaca visualmente (badge de color).
- **Rationale**: FR-004 y criterio de demo (encontrar un pendiente rápido). Orden estable
  y predecible para la narrativa.

## D7 — Modelo de identidad y roles

- **Decision**: `users.json` define usuarias con `role` (`abogada` | `solicitante`).
  Abogadas ven todo el corpus (FR-020); solicitantes (opcional, FR-021) ven solo sus
  solicitudes. El selector de usuaria simula el login.
- **Rationale**: Suficiente para demostrar alcance por rol y privacidad sin SSO bancario.

## D8 — Persistencia de solicitudes creadas (P4 opcional)

- **Decision**: Las solicitudes creadas en la demo se guardan en `localStorage`
  (`clm-chat:requests`) y se fusionan con el corpus al renderizar el tablero, en estado
  "Solicitado".
- **Rationale**: Permite mostrar el alta sin escribir en los JSON fuente (solo lectura del
  corpus) y sin backend. P4 sigue siendo opcional.

## D9 — Testing

- **Decision**: Vitest + RTL, limitado a smoke tests del motor de recuperación (citas,
  recencia) y del filtrado/búsqueda del tablero.
- **Rationale**: La spec marca tests como opcionales; se priorizan los dos puntos de
  mayor riesgo de demo (respuesta del chat con cita correcta y filtros del tablero).

**Output**: Sin `NEEDS CLARIFICATION` pendientes. Listo para Phase 1.
