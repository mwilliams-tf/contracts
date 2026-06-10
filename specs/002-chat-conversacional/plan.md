# Implementation Plan: Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Branch**: `002-chat-conversacional` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-chat-conversacional/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Evolución del Chat IA del MVP (`001-clm-chat-mvp`) de **un único hilo por usuaria** a un
**asistente legal conversacional con múltiples conversaciones**. Se reemplaza el modelo
`Conversation = { userId, messages }` por una **bandeja** de conversaciones por usuaria,
cada una con tipo (portfolio / anclada a un contrato de foco opcional), estado
(en vivo / congelada) y memoria de hilo. El asistente mantiene el enfoque **frontend-only,
determinista y guionado** sobre el corpus JSON local: extiende el motor de recuperación
existente (`chat/engine.ts` + `chat/scenarios.ts` + guiones demo) para soportar
**referencia cruzada entre contratos** (citar el contrato principal y todos los
referenciados) y una **acción simulada de redacción** que genera un **borrador de trabajo
local** sin tocar documentos fuente. Tres conversaciones seed (Acme congelada, "2028"
portfolio congelada, Stanley en vivo) conducen una demo de 3 minutos. Se agrega apertura
contextual desde el detalle del contrato (foco precargado), chips de sugerencia y
sugerencia —no ejecución— de transiciones de workflow. Sin LLM, SSO, Drive, Gmail ni
escritura sobre fuentes.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: React 18, Vite 5, React Router 6, Tailwind CSS 3 (stack ya
existente de `001`; no se agregan dependencias nuevas)

**Storage**: Corpus ficticio en `src/data/*.json` (solo lectura) + `localStorage` del
navegador para la bandeja de conversaciones por usuaria y los borradores de trabajo
locales; IndexedDB (`lib/document-store.ts`) ya existente se mantiene para documentos
subidos. No hay backend.

**Testing**: Vitest + React Testing Library (opcional; smoke tests del motor con
referencia cruzada, de la persistencia de la bandeja y de la acción de borrador)

**Target Platform**: Navegador moderno (desktop), ejecutado localmente con `vite dev`

**Project Type**: Web application (frontend-only / SPA, sin backend) — continúa la
estructura de `001`

**Performance Goals**: Interacción instantánea para un corpus de demo (~20–50 contratos).
Apertura de bandeja <5 s (SC-001); respuesta del asistente <500 ms (recuperación local).

**Constraints**: Sin integraciones reales (Drive, Gmail, SSO, notificaciones reales);
sin envío de mails; sin escritura sobre documentos fuente del corpus; sin generación real
de .docx; sin LLM externo ni claves. UI y respuestas en español. Marcador de "datos
ficticios" y aclaración de "no modifica fuentes reales" visibles en el asistente.

**Scale/Scope**: Demo de 3 minutos. 5 user stories (P1–P5), 3 conversaciones seed,
~3 vistas/superficies nuevas o modificadas (Bandeja, Conversación, integración en Detalle),
nuevas entidades (Conversation v2, Message/Turn enriquecido, WorkingDraft, Suggestion).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| # | Gate | Pass criteria | Status |
|---|------|---------------|--------|
| 1 | MVP Demostrable Primero | Scope fits a ~3 min demo; no product-only requirements without explicit agreement | ✅ Recorrido bandeja → Stanley (cláusula 9 → cruce Acme → borrador) en 3 min (SC-007); P5 es refinamiento |
| 2 | Dominio Legal Fiel | Uses Legales terminology, contract types, and states from existing business specs | ✅ Reutiliza corpus, estados y terminología de `001` (Stanley/Acme/cláusula 9, Revisión del proveedor, etc.) |
| 3 | Datos Ficticios, Flujo Real | Data is local/JSON/static; user journey feels production-real | ✅ Corpus JSON local + seeds guionadas; recorrido real consultar→comparar→actuar |
| 4 | Módulos Delimitados | Feature maps to CLM or Chat IA bounded context; shared `Contract` model only where needed | ✅ Todo en el bounded context `chat/`; consume `models/` y `lib/corpus.ts`; integración mínima con `clm/` (botón en detalle) |
| 5 | Solo Lectura en Fuentes | Chat does not write to or send mail; read-only on sources | ✅ La acción de redacción crea un WorkingDraft local; NO modifica documentos fuente ni envía mails (FR-018/FR-019) |
| 6 | Privacidad de Historial | Per-user chat history isolation; shared contractual corpus for Legales | ✅ Bandeja namespaced por usuaria en `localStorage` (FR-004); corpus común |
| 7 | Simplicidad sobre Integración | No Drive, Gmail, SSO, real docx, notifications, or bank permissions in scope | ✅ Sin integraciones; el borrador aclara el punto de sustitución (.docx en Drive) sin implementarlo (FR-020) |
| 8 | Español y Claridad | UI copy and chat responses in Spanish for non-technical lawyers | ✅ Toda la UI/copy/respuestas en español |

**Prototype markers**: Se mantiene el `FictitiousDataBadge` compartido en el layout y en
el encabezado del asistente; la acción de redacción y el borrador rotulan explícitamente
"acción simulada — no modifica fuentes reales" y el punto de sustitución a Drive (FR-006,
FR-020, SC-008). Las conversaciones/contratos En curso/Pendiente se siguen priorizando en
chips y respuestas. **Sin violaciones** → no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-chat-conversacional/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── conversation-store.md  # Contrato de la bandeja/persistencia por usuaria
│   ├── chat-engine-v2.md      # Motor con referencia cruzada + principal/referenciados
│   └── working-draft.md       # Acción simulada de redacción → borrador local
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Continúa la estructura existente de `001`. **Nuevos** archivos marcados con `(+)`,
**modificados** con `(~)`.

```text
src/
├── App.tsx                     # (~) Rutas: /chat (bandeja), /chat/c/:conversationId
├── data/
│   ├── contracts.json          # Corpus (sin cambios de esquema; puede sumar seeds 2028)
│   ├── sources.json            # Fuentes citables (sin cambios de esquema)
│   ├── chat-scenarios.json     # (~) Escenarios + nuevos para portfolio/cruce/redacción
│   └── seed-conversations.ts   # (+) Tres conversaciones seed (Acme, 2028, Stanley)
├── models/
│   └── index.ts                # (~) ConversationV2, Turn, WorkingDraft, Suggestion, ...
├── lib/
│   ├── corpus.ts               # Carga del corpus (sin cambios)
│   ├── conversations.ts        # (+) Bandeja por usuaria en localStorage + seeds
│   ├── working-drafts.ts       # (+) Borradores de trabajo locales (versión nueva)
│   ├── session.ts              # Identidad simulada (sin cambios)
│   └── history.ts              # (~) Migración/compat del modelo de hilo único anterior
├── chat/
│   ├── Inbox.tsx               # (+) US1 — bandeja de conversaciones de la usuaria
│   ├── ConversationView.tsx    # (+) US2/US3/US4 — vista de una conversación (reemplaza el hilo único de ChatView)
│   ├── ChatView.tsx            # (~) Punto de entrada que monta Inbox / ConversationView
│   ├── engine.ts               # (~) Soporte de contrato principal + referenciados
│   ├── cross-reference.ts      # (+) US3 — precedentes y comparación entre contratos
│   ├── drafting.ts             # (+) US4 — propuesta de redacción + aplicar al borrador
│   ├── suggestions.ts          # (+) US5 — chips según estado/tipo de conversación
│   ├── scenarios.ts            # (~) Enrutado por tipo de conversación y foco
│   ├── stanley-demo.ts         # (~) Turnos de cruce con Acme y redacción aplicada
│   ├── acme-demo.ts            # (~) Conversación Acme congelada/resuelta
│   └── components/
│       ├── ConversationList.tsx   # (+) Ítems de la bandeja (título, tipo, estado)
│       ├── MessageBubble.tsx      # (~) Muestra principal + referenciados + acción
│       ├── CitationCard.tsx       # (~) Cita con contrato de origen
│       ├── SuggestionChips.tsx    # (+) Chips clicables
│       └── DraftActionCard.tsx    # (+) Propuesta de redacción + "aplicar al borrador"
├── clm/
│   └── ContractDetail.tsx      # (~) Botón "Consultar al asistente" con foco precargado
└── components/
    └── FictitiousDataBadge.tsx # Marcador de datos ficticios (sin cambios)

tests/                          # (opcional)
├── conversations.test.ts       # (+) Bandeja: crear/abrir/persistir/privacidad
├── cross-reference.test.ts     # (+) Principal + referenciados, precedente Acme
└── working-draft.test.ts       # (+) Aplicar borrador no modifica fuentes
```

**Structure Decision**: Se mantiene la SPA frontend-only de `001` y el bounded context
`chat/` (Principio IV). La evolución es **aditiva**: se introduce un nivel de "bandeja"
sobre el hilo único existente, conservando el motor determinista (`engine.ts`/`scenarios.ts`)
y los guiones demo (`stanley-demo.ts`/`acme-demo.ts`) como base, ahora enrutados por
conversación y foco. La persistencia sigue en `localStorage` namespaced por usuaria
(Principio VI). La acción de redacción escribe solo un `WorkingDraft` **local**, nunca el
corpus (Principio V), dejando explícito el punto de sustitución a Drive (Principio VII).

## Complexity Tracking

> No hay violaciones de la Constitution Check. Sección no aplica.
