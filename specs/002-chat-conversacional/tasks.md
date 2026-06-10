---
description: "Task list for Asistente Legal Conversacional Multi-Conversación (Chat IA v2)"
---

# Tasks: Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Input**: Design documents from `/specs/002-chat-conversacional/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Opcionales — la spec no los exige; el plan los marca como smoke tests opcionales. Se incluyen unas pocas tareas de smoke test marcadas `(opcional)` en la validación final.

**Constitution**: MVP demo-first; bounded contexts (CLM vs Chat IA); fictitious data with real UX flow; Spanish UI; read-only on sources; per-user privacy; no real integrations. Stop at checkpoints to validate the ~3 min demo narrative before expanding scope.

**Organization**: Tasks are grouped by issue scope. Each top-level section maps to one GitHub issue for tracking and reporting.

**Base**: Esta feature evoluciona el Chat IA ya implementado en `001-clm-chat-mvp`. Las tareas modifican archivos existentes y agregan nuevos; no se reinicia el proyecto.

---

## Path Conventions

- **Web app (SPA frontend-only)**: `src/`, `tests/` at repository root per plan.md

---

## Issue 1: Multi-conversation foundation (bandeja, modelo y extension points)

**Scope**: Base de la multiplicidad de conversaciones (US1). Reemplaza el hilo único de `001` por una bandeja por usuaria: modelo de datos v2, capa de persistencia con seeds, y las superficies/extension points de UI (Bandeja, vista de Conversación, lista, burbuja v2) que consumen el resto de los issues. Bloquea todo el trabajo posterior.

**Independent test**: Abrir el asistente → ver la bandeja con las 3 conversaciones seed (Acme frozen, 2028 frozen, Stanley live) privadas de la usuaria; crear una conversación nueva; recargar y confirmar persistencia; cambiar de usuaria y confirmar bandejas disjuntas (SC-001, SC-006).

### Domain Models v2

- [x] Extend domain types in `src/models/index.ts`: change `Conversation` to `{ id, userId, title, type: "portfolio" | "anchored", focusContractId: string | null, status: "live" | "frozen", createdAt, updatedAt, messages: Turn[] }` per `data-model.md`
- [x] Add `Turn` type (extends previous `ChatMessage` with `principalContractId: string | null`, `referencedContractIds: string[]`, `proposedDraft?: DraftProposal | null`, `suggestions?: Suggestion[]`) in `src/models/index.ts`
- [x] Add `contractId` (contrato de origen) to the `Citation` type in `src/models/index.ts`
- [x] Add `DraftProposal`, `WorkingDraft`, and `Suggestion` types in `src/models/index.ts` per `data-model.md`
- [x] Extend `ChatAnswer` with `principalContractId: string | null`, `referencedContractIds: string[]`, optional `proposedDraft` and `suggestions`; extend `ChatContext` with `conversationType` and `focusContractId` in `src/models/index.ts` per `contracts/chat-engine-v2.md`

### Conversation Store & Seeds

- [x] Implement per-user inbox store in `src/lib/conversations.ts` per `contracts/conversation-store.md` (`loadInbox`, `saveInbox`, `createConversation`, `getConversation`, `appendTurn`, `openOrCreateAnchored`; key `clm-chat:conversations:<userId>`)
- [x] Implement seed scaffolding `src/data/seed-conversations.ts` exporting the three seed conversations (Acme anchored/frozen, "Contratos que vencen en 2028" portfolio/frozen, Stanley anchored/live); seed Acme/2028 content can start as placeholders to be finalized in Issue 4
- [x] Wire first-load seeding into `loadInbox` for the default abogada user (seed once; do not duplicate on later loads) in `src/lib/conversations.ts` (FR-005)
- [x] Keep backward compatibility with the legacy single-thread key `clm-chat:history:<userId>` (ignore or surface as one portfolio conversation; no data loss) in `src/lib/history.ts`

### Inbox & Conversation UI (extension points)

- [x] [P] Create conversation list item component in `src/chat/components/ConversationList.tsx` (título, tipo portfolio/anclada, estado live/frozen)
- [x] Create the inbox view in `src/chat/Inbox.tsx` (US1): list user conversations ordered by `updatedAt`, "nueva conversación" action, empty-state inviting first conversation (FR-001, FR-002, edge: bandeja vacía)
- [x] Upgrade `src/chat/components/MessageBubble.tsx` to render a `Turn`: principal contract label, referenced contracts list, citations, and slots for `proposedDraft` and `suggestions` (props-driven; rendering only)
- [x] Create the conversation view shell in `src/chat/ConversationView.tsx` (US2/US3/US4 host): header with focus/tipo, message list via MessageBubble, input area; disable input and show read-only notice when `status === "frozen"` (edge: conversación congelada)
- [x] Refactor `src/chat/ChatView.tsx` into a dispatcher that mounts `Inbox` at `/chat` and `ConversationView` at `/chat/c/:conversationId` (preserve abogada-only guard and FictitiousDataBadge)
- [x] Update routes in `src/App.tsx` to add `/chat/c/:conversationId` alongside `/chat`

**Checkpoint**: `npm run dev` shows the inbox with 3 seed conversations; opening one renders its (possibly empty) thread; creating and reloading persists; switching usuaria shows isolated inboxes.

---

## Issue 2: Conversational assistant — citations, thread memory & cross-reference

**Scope**: Núcleo de valor (US2 + US3). Evoluciona el motor determinista para operar por conversación (foco + memoria de hilo), responder consultas portfolio y ancladas con citas y prioridad por recencia, y producir referencia cruzada declarando contrato principal + referenciados. Conecta la respuesta a `ConversationView`.

**Independent test**: En una conversación portfolio preguntar "¿qué contratos vencen en 2028?" → listado con citas; en Stanley preguntar la objeción de la cláusula 9 → respuesta con cita; preguntar "¿cómo se resolvió en Acme?" → principal Stanley + referenciado Acme citando ambos; seguimiento "¿y los firmantes?" resuelto por memoria de hilo (SC-002, SC-003, SC-004).

### Engine v2

- [x] Extend `src/chat/engine.ts` so `ChatContext` uses `conversationType` and `focusContractId`; default `principalContractId` to the focus contract in anchored conversations (FR-008, FR-014, `contracts/chat-engine-v2.md`)
- [x] Populate `principalContractId` and `referencedContractIds` on every `ChatAnswer` builder in `src/chat/engine.ts` (FR-016); attach `contractId` of origin to each `Citation`
- [x] Reinforce thread-memory follow-up resolution (e.g. "¿y los firmantes?", "esa cláusula") using `priorMessages` + focus in `src/chat/engine.ts` (FR-011)
- [x] Ensure honest fallback paths set `principalContractId: null` / `referencedContractIds: []` and explicit Spanish text when out of corpus or unsupported (FR-012, edge cases)

### Cross-reference

- [x] [P] Create `src/chat/cross-reference.ts` to detect precedent/comparison requests ("cómo resolvimos", "como en Acme", "comparar") and build answers that bring another contract's clause/source while keeping the focus as principal (FR-014, FR-015, FR-016)
- [x] Handle "no comparable precedent in corpus" with honest fallback in `src/chat/cross-reference.ts` (US3 edge case)

### Scenarios routing & scripted demo content

- [x] Route scenario resolution by `conversationType`/`focusContractId` in `src/chat/scenarios.ts` so anchored Stanley/Acme and portfolio queries pick the right scripts (extend existing scenario engine)
- [x] Add the portfolio "vencen en 2028" scripted answer (monitoreo perimetral + locación Quilmes, each with citation) in `src/data/chat-scenarios.json` and `src/chat/scenarios.ts` (FR-008); verify those contracts exist in `src/data/contracts.json` with 2028 expiration (add/adjust corpus entries if missing — read-only at runtime, edited at authoring time only)
- [x] Extend `src/chat/stanley-demo.ts` with the Acme cross-reference turn (principal Stanley + referenced Acme, citing both) and the redaction request turn that yields a `proposedDraft` (content consumed by Issue 3)
- [x] Tolerate ≥2 phrasings per key intent (objeción cláusula 9, cruce con Acme, redacción) in `src/chat/stanley-demo.ts` / `src/chat/scenarios.ts` (FR-013, SC-009)

### Wire-up

- [x] Call the engine/scenarios from `src/chat/ConversationView.tsx` on send, passing `conversationType`, `focusContractId`, and `priorMessages`; append both user and assistant `Turn`s via `appendTurn` (FR-007)

**Checkpoint**: Stanley conversation answers cláusula 9 with citation, returns a cross-reference turn citing Stanley + Acme, and a portfolio conversation lists 2028 contracts with citations.

---

## Issue 3: Simulated drafting action and local working drafts

**Scope**: Acción simulada de redacción (US4). Propone una redacción y la aplica a un borrador de trabajo local del contrato principal, sin tocar fuentes ni enviar nada. Se conecta a los extension points de `MessageBubble`/`ConversationView` de Issue 1.

**Independent test**: En Stanley pedir "ampliá la cláusula 9" → propuesta de redacción + botón "aplicar al borrador"; aplicar → se crea un WorkingDraft local de Stanley con marca de simulación; inspeccionar corpus/IndexedDB y confirmar que las fuentes quedan intactas (SC-005).

### Drafting & persistence

- [x] [P] Create `src/chat/drafting.ts` with `proposeDraft(query, ctx)` that detects redaction requests ("ampliá", "redactá", "nueva redacción") and returns a Spanish `DraftProposal` with `clauseRef`, `contractId` (principal) and `basedOnContractIds` (FR-017, `contracts/working-draft.md`)
- [x] [P] Create `src/lib/working-drafts.ts` with `applyDraft` / `getWorkingDrafts` persisting to `clm-chat:drafts:<contractId>` with incremental `version` and `simulated: true` (FR-018; never writes corpus/IndexedDB — FR-019)

### UI & wire-up

- [x] Create `src/chat/components/DraftActionCard.tsx` showing the proposed redaction, an "aplicar al borrador" button, and an explicit "acción simulada — no modifica fuentes reales; en producción → .docx en Drive" notice (FR-020, SC-008)
- [x] Render `DraftActionCard` for assistant turns carrying `proposedDraft` and handle "aplicar al borrador" (call `applyDraft`, confirm result, show created/updated draft version) in `src/chat/ConversationView.tsx`
- [x] Surface existing working drafts of the focus contract (read via `getWorkingDrafts`) in `src/chat/ConversationView.tsx` (and/or `src/clm/ContractDetail.tsx`), clearly labeled as simulated drafts; applying twice yields a new version without corrupting sources (edge case)

**Checkpoint**: Applying a redaction in Stanley creates `clm-chat:drafts:ctr-006` v1 (then v2 on re-apply); `contracts.json`, documents and IndexedDB remain unchanged; no mail sent.

---

## Issue 4: Contextual integration, suggestion chips, workflow hints, seeds & demo validation

**Scope**: Integración con el resto del MVP y refinamientos de demo (US5) más el contenido final de las seeds y la validación del recorrido de 3 minutos. Las tareas de chips/integración/seeds congeladas son independientes; la validación final converge con Issues 2 y 3.

**Independent test**: Desde el detalle de un contrato abrir el asistente con ese contrato como foco (sin quedar limitado a él); ver chips coherentes con el estado del foco; pulsar un chip envía la consulta; el asistente sugiere —no ejecuta— una transición de estado; recorrido completo de demo en ≤3 min (SC-007).

### Suggestion chips (US5)

- [x] [P] Create `src/chat/suggestions.ts` deriving chips from `conversationType`, focus contract state, and last turn (e.g. en "Revisión del proveedor" → objeción cláusula 9) (FR-022)
- [x] [P] Create `src/chat/components/SuggestionChips.tsx` rendering clickable chips
- [x] Render chips in `src/chat/ConversationView.tsx` and send the chip's `query` through the same submit flow as the text input (FR-022)

### Contextual open & workflow coexistence (US5)

- [x] Add a "Consultar al asistente" action in `src/clm/ContractDetail.tsx` that calls `openOrCreateAnchored(userId, contractId)` and navigates to `/chat/c/:conversationId` (FR-021)
- [x] Add workflow-transition suggestion text in assistant responses (e.g. via `src/chat/suggestions.ts` or scenario content) that recommends the relevant transition but never executes it; execution stays in `src/clm/components/WorkflowActions.tsx` (FR-023, FR-024)

### Finalize seed content

- [x] Finalize the Acme seed in `src/data/seed-conversations.ts`: full frozen history with the vencimiento mail conflict resolved by recency (01/03/2027 prevails) and pending signatory (María López) (FR-005)
- [x] Finalize the "Contratos que vencen en 2028" portfolio seed (frozen) with the answered listing (monitoreo perimetral + locación Quilmes) and citations in `src/data/seed-conversations.ts` (FR-005)
- [x] Verify the Stanley live seed reproduces the full demo on demand (cláusula 9 → cruce Acme → redacción aplicada al borrador), coordinating with Issues 2 and 3; reuse `src/lib/stanley-demo-reset.ts` pattern for reset (FR-005)

### Polish & demo validation

- [x] [P] Ensure FictitiousDataBadge and the "no modifica fuentes reales" notice are visible across Inbox, ConversationView and DraftActionCard (SC-008)
- [x] [P] Review Spanish UI copy across `src/chat/` for non-technical lawyers (Principio VIII)
- [x] Run the 3-minute demo walkthrough per `quickstart.md` (bandeja → Stanley: cláusula 9 → cruce Acme → borrador) and fix blockers (SC-001…SC-009)
- [x] Verify no write actions touch corpus sources or send mail anywhere in chat/drafting (FR-019; constitution gate 5)
- [x] (opcional) Add smoke test for the inbox store (seed/create/persist/privacy) in `tests/conversations.test.ts`
- [x] (opcional) Add smoke test for cross-reference (principal + referenced, Acme precedent) in `tests/cross-reference.test.ts`
- [x] (opcional) Add smoke test asserting `applyDraft` does not modify sources in `tests/working-draft.test.ts`
- [x] Update `quickstart.md` if setup steps or demo script changed during implementation

**Checkpoint**: Full demo path validated end-to-end; contextual open and chips work; workflow only suggested, never auto-executed; sources untouched.

---

## Dependencies & Execution Order

### Issue Dependencies

```text
Issue 1 (multi-conversation foundation: models v2, store, seeds, UI extension points)
  ↓ blocks
Issue 2 (assistant: engine + cross-reference)        ←─┐
Issue 3 (drafting action + working drafts)             ←─┤ parallel after Issue 1
Issue 4 (chips, integration, frozen seeds)             ←─┘ independent parts parallel; final validation converges with Issues 2 & 3
```

### Execution Rules

- Issue 1 MUST complete before Issues 2, 3, and 4 (it defines the data model and UI extension points)
- Issues 2 and 3 are independent (engine/cross-reference vs drafting/working-drafts; distinct files; both plug into Issue 1 props)
- Issue 4 chips/integration/frozen-seeds are independent of Issues 2 & 3; the Stanley live-seed verification and demo validation converge after 2 & 3
- Models/types and store before UI wire-up; engine before ConversationView wire-up; `proposeDraft` before DraftActionCard wire-up

### Parallel Opportunities

- Within Issue 1: `ConversationList` and the model changes are parallelizable before store/UI wire-up
- After Issue 1: **Issue 2, Issue 3 and the independent parts of Issue 4 run in parallel** — minimal cross-lane blocking
- Within Issue 2: `cross-reference.ts` parallel to engine builder edits
- Within Issue 3: `drafting.ts` and `working-drafts.ts` parallelizable before the card/wire-up
- Within Issue 4: `suggestions.ts` and `SuggestionChips.tsx` parallelizable; badge/copy reviews parallelizable

---

## Parallel Example: after Issue 1

```bash
# Contributor A — assistant lane (Issue 2):
Task: "Extend engine v2 with principal/referenced + focus in src/chat/engine.ts"
Task: "Create cross-reference detection in src/chat/cross-reference.ts"

# Contributor B — drafting lane (Issue 3, no dependency on A):
Task: "Create proposeDraft in src/chat/drafting.ts"
Task: "Create local working-drafts store in src/lib/working-drafts.ts"

# Contributor C — integration & chips lane (Issue 4 independent parts):
Task: "Create suggestion chips in src/chat/suggestions.ts and src/chat/components/SuggestionChips.tsx"
Task: "Add 'Consultar al asistente' contextual open in src/clm/ContractDetail.tsx"
Task: "Finalize Acme and 2028 frozen seeds in src/data/seed-conversations.ts"
```

---

## Implementation Strategy

### MVP First (Issue 1 + Issue 2)

1. Complete Issue 1: foundation (bandeja + extension points)
2. Complete Issue 2: assistant with citations, thread memory and cross-reference
3. **STOP and VALIDATE**: inbox with seeds + Stanley cláusula 9 (cita) + cruce con Acme (principal + referenciado); confirm *datos ficticios* marker (SC-001…SC-004, SC-008)
4. Demo to Legal stakeholders if ready; defer product integrations to IT phase

### Incremental Delivery

1. Issue 1 → inbox + seeds visible, conversations persist privately
2. Issue 2 → conversational answers with citations + cross-reference (core demo)
3. Issue 3 → simulated drafting "aplicar al borrador" (closes the consultar→comparar→actuar arc)
4. Issue 4 → chips, contextual open, finalized seeds + 3-min demo validation

### Parallel Team Strategy (3 Contributors)

This project has **3 contributors** working in parallel. Assignment minimizes cross-contributor blocking.

**Principles**:
- No contributor idles waiting for another's incomplete issue
- Shared dependencies (data model + UI extension points) live in Issue 1 only

**Assignment pattern**:

1. **All contributors** collaborate on Issue 1 (short, blocking foundation that defines models, store and the `MessageBubble`/`ConversationView` extension points)
2. Once Issue 1 is done:
   - **Contributor A**: Issue 2 (engine + cross-reference) — self-contained module lane
   - **Contributor B**: Issue 3 (drafting + working drafts) — self-contained module lane
   - **Contributor C**: Issue 4 independent parts (chips, ContractDetail integration, frozen Acme/2028 seeds) — no dependency on A or B
3. All contributors converge on the Stanley live-seed verification and demo validation (the only Issue 4 tasks that need A + B merged)

**Anti-pattern avoided**: Contributor B does NOT wait for Contributor A — `proposeDraft`/working-drafts and `DraftActionCard` plug into Issue 1's `MessageBubble` `proposedDraft` slot, not into Issue 2's engine internals.

### Single-Contributor Fallback

If working solo: Issue 1 → Issue 2 → Issue 3 → Issue 4, validating the demo path after Issue 2 (cross-reference) and again after Issue 3 (drafting).

---

## Issue Mapping for GitHub

> Guides `speckit.taskstoissues` on how to create GitHub issues from this document.

| Issue Title | Scope | Priority |
|-------------|-------|----------|
| Multi-conversation foundation | Models v2 (Conversation/Turn/Citation/DraftProposal/WorkingDraft/Suggestion), per-user inbox store + seeds, Inbox/ConversationView/list/bubble extension points, routes | P1 — blocking |
| Conversational assistant with citations and cross-reference | Engine v2 (focus + thread memory + principal/referenced), cross-reference module, portfolio 2028 + Stanley scripted content, ConversationView wire-up | P1 — core value (US2 + US3) |
| Simulated drafting action and local working drafts | proposeDraft, local working-drafts store, DraftActionCard, apply-to-draft wire-up, sources untouched | P4 — actionable value (US4) |
| Contextual integration, chips, seeds and demo validation | Suggestion chips, contextual open from detail, workflow suggestion (no execution), finalized frozen seeds, polish, 3-min demo validation, optional smoke tests | P5 — finish and verify |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same issue
- This feature **evolves** `001`; reuse the existing deterministic engine, demo scripts and corpus — do not rebuild them
- Drafting writes only a local `WorkingDraft`; never modify corpus sources, documents (IndexedDB), generate real .docx, or send mail (Principio V)
- The engine remains isolated for future LLM substitution by IT without UI changes
- Do not add real integrations (Drive, Gmail, SSO); keep all responses and UI in Spanish
