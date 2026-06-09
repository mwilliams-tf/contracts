---
description: "Task list for MVP Demo Unificado CLM + Chat IA (Legales Banco)"
---

# Tasks: MVP Demo Unificado CLM + Chat IA (Legales Banco)

**Input**: Design documents from `/specs/001-clm-chat-mvp/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No incluidos — la spec no los solicita; el plan los marca como opcionales.

**Constitution**: MVP demo-first; bounded contexts (CLM vs Chat IA); fictitious data with
real UX flow; Spanish UI; no real integrations. Stop at checkpoints to validate the
~3 min demo narrative before expanding scope.

**Organization**: Tasks are grouped by issue scope. Each top-level section maps to one GitHub issue for tracking and reporting.

---

## Path Conventions

- **Web app (SPA frontend-only)**: `src/`, `tests/` at repository root per plan.md

---

## Issue 1: Project setup and shared foundation

**Scope**: Inicialización del proyecto Vite + React + TypeScript + Tailwind, tipos de
dominio, corpus ficticio JSON, librerías compartidas (corpus, sesión, historial), shell
de la app con rutas y badge de datos ficticios. Bloquea todo el trabajo posterior.

### Setup

- [x] Initialize Vite + React + TypeScript project with `package.json`, `vite.config.ts`, `tsconfig.json`, and `index.html` at repository root
- [x] [P] Configure Tailwind CSS 3 in `tailwind.config.js`, `postcss.config.js`, and `src/styles/index.css`
- [x] [P] Add React Router 6 dependency and configure base routes in `src/main.tsx`

### Domain Models & Corpus

- [x] Define TypeScript types for Contract, Provider, Document, Source, User, Conversation, WorkflowState, Signatory, StateHistoryEntry, ChatMessage, and Citation in `src/models/index.ts`
- [x] [P] Create fictitious corpus JSON files per `contracts/data-files.md`: `src/data/providers.json`, `src/data/users.json`, `src/data/workflow-states.json`, `src/data/contracts.json`, `src/data/documents.json`, `src/data/sources.json` (include at least one active/pending contract, both document origins, and conflicting sources for recency demo)
- [x] Implement corpus loader and normalizer with FK resolution in `src/lib/corpus.ts` (read-only; exports typed `Corpus` object)

### Shared Libraries & Shell

- [x] Implement simulated user session (active user id, role) with persistence in `src/lib/session.ts`
- [x] Implement per-user chat history storage namespaced by userId in `src/lib/history.ts` (`clm-chat:history:<userId>`)
- [x] Create permanent "Datos ficticios" badge component in `src/components/FictitiousDataBadge.tsx`
- [x] Build app layout with navigation, user selector, and badge in `src/App.tsx` (routes: `/`, `/contratos/:id`, `/chat`, `/solicitud`)
- [x] Add empty-state placeholder pages so routes resolve before feature work in `src/clm/Board.tsx`, `src/clm/ContractDetail.tsx`, `src/chat/ChatView.tsx`

**Checkpoint**: `npm run dev` starts; user can select a usuaria; badge visible; corpus loads without errors.

---

## Issue 2: CLM tablero and contract detail

**Scope**: Tablero CLM (P1) y vista de detalle (P2) en el bounded context `clm/`.
Listado con filtros/búsqueda, prioridad de contratos activos, navegación al detalle con
partes, firmantes, documentos simulados, historial de estados y marca de origen
documental.

**Independent test**: Abrir tablero → filtrar/buscar contrato pendiente → abrir detalle →
ver documentos, historial y origen documental (SC-001, SC-002, SC-006).

### CLM Components

- [x] [P] Create workflow state badge component in `src/clm/components/StateBadge.tsx` (color by state; highlight active states)
- [x] [P] Create document origin badge component in `src/clm/components/DocumentOriginBadge.tsx` ("Plantilla Propia" vs "Modelo del Proveedor")
- [x] [P] Create contract row/card component in `src/clm/components/ContractCard.tsx` (estado, proveedor, área, vencimiento; expired visual distinction)

### Tablero (P1)

- [x] Implement contract list with active/pending prioritization and sort in `src/clm/Board.tsx` (FR-001, FR-004)
- [x] Add state filter dropdown populated from workflow states in `src/clm/Board.tsx` (FR-002)
- [x] Add search input filtering by provider name and service in `src/clm/Board.tsx` (FR-003)
- [x] Add empty-state message "Sin contratos para estos criterios" when filters yield no results in `src/clm/Board.tsx`
- [x] Wire board route `/` in `src/App.tsx` and link each card to `/contratos/:id`

### Detalle (P2)

- [x] Implement contract detail view with state, parties, signatories, and dates in `src/clm/ContractDetail.tsx` (FR-006)
- [x] List associated simulated documents with simulated links in `src/clm/ContractDetail.tsx` (FR-007); show "Sin documentos asociados" when empty
- [x] Render state history timeline in `src/clm/ContractDetail.tsx` (FR-008); show explicit empty state when no history
- [x] Display document origin badge in `src/clm/ContractDetail.tsx` (FR-009)
- [x] Mark expired contracts visually in `src/clm/ContractDetail.tsx` (edge case: vencimiento pasado)
- [x] Add back-navigation to tablero and ensure FictitiousDataBadge is visible in `src/clm/ContractDetail.tsx` (SC-006)

**Checkpoint**: Demo path tablero → detalle works in ≤2 clicks; pending contract findable in <30 s.

---

## Issue 3: Chat IA with source citations

**Scope**: Motor de recuperación local de solo lectura (P3) y UI de chat con historial
privado por usuaria. Respuestas en español con citas, prioridad por recencia ante
conflicto, sin escritura sobre fuentes.

**Independent test**: Preguntar vencimiento de Acme → respuesta en español con cita de
fuente más reciente; cambiar usuaria → historial distinto (SC-003, SC-004, SC-007).

### Chat Engine

- [x] Implement intent detection and contract matching per `contracts/chat-engine.md` in `src/chat/engine.ts`
- [x] Implement Spanish response builder with citation extraction in `src/chat/engine.ts` (FR-011, FR-014)
- [x] Implement recency-based source ranking for conflicting data in `src/chat/engine.ts` (FR-012)
- [x] Handle no-source and out-of-corpus queries with explicit Spanish messages in `src/chat/engine.ts` (edge cases; FR-015, FR-016 read-only invariant)

### Chat UI

- [x] [P] Create citation card component showing sender, date, subject, and simulated link in `src/chat/components/CitationCard.tsx`
- [x] [P] Create message bubble components for user and assistant messages in `src/chat/components/MessageBubble.tsx`
- [x] Implement chat view with input, message list, and citation rendering in `src/chat/ChatView.tsx` (FR-010)
- [x] Load and persist per-user conversation via `src/lib/history.ts` in `src/chat/ChatView.tsx` (FR-013)
- [x] Show empty-state prompt inviting first query when history is empty in `src/chat/ChatView.tsx`
- [x] Wire chat route `/chat` in `src/App.tsx` with FictitiousDataBadge visible (SC-006)

**Checkpoint**: Chat answers "¿Cuándo vence el contrato de Acme?" with `src-002` citation; switching users shows isolated histories.

---

## Issue 4: Optional request form and demo validation

**Scope**: Formulario de solicitud simplificada (P4 — opcional), persistencia en
localStorage fusionada al tablero, pulido cross-cutting y validación del recorrido de
demo de 3 minutos contra quickstart.md y Success Criteria.

**Independent test**: (P4) Crear solicitud → aparece en tablero como "Solicitado";
(validación) recorrido completo tablero → detalle → chat en ≤3 min con badge visible.

### Solicitud Simplificada (P4 — opcional)

- [x] Implement short request form for "Servicios IT" with document origin selector in `src/clm/RequestForm.tsx` (FR-017, FR-018)
- [x] Add Spanish validation messages for required fields in `src/clm/RequestForm.tsx`
- [x] Persist new requests to `localStorage` key `clm-chat:requests` and merge into board data in `src/lib/corpus.ts` or a dedicated `src/lib/requests.ts` (FR-019)
- [x] Wire request route `/solicitud` in `src/App.tsx`

### Polish & Demo Validation

- [x] [P] Ensure all primary screens (tablero, detalle, chat) display FictitiousDataBadge consistently in `src/App.tsx` and feature views (SC-006)
- [x] [P] Review and complete Spanish UI copy across `src/clm/` and `src/chat/` for non-technical lawyer audience (Principio VIII)
- [x] Run full 3-minute demo walkthrough per `quickstart.md` and fix any blockers (SC-001 through SC-007)
- [x] Verify no write actions exist in chat engine or UI (FR-015, FR-016; constitution gate 5)
- [x] Update `quickstart.md` if setup steps or demo script changed during implementation

**Checkpoint**: Full demo path validated; P4 deliverable if time permits; ready for stakeholder demo.

---

## Dependencies & Execution Order

### Issue Dependencies

```text
Issue 1 (setup + foundation)
  ↓ blocks
Issue 2 (CLM tablero + detalle)  ←─┐
Issue 3 (Chat IA)                  ←─┤ parallel after Issue 1
Issue 4 (solicitud + validación)   ←─┘ after Issues 2 & 3 (validation); P4 form can start after Issue 1
```

### Execution Rules

- Issue 1 MUST complete before Issues 2, 3, and 4
- Issues 2 and 3 are independent of each other (different bounded contexts; shared foundation only)
- Issue 4 validation SHOULD wait until Issues 2 and 3 are demo-ready
- Models and corpus before UI features
- Chat engine (`src/chat/engine.ts`) before chat UI (`src/chat/ChatView.tsx`)

### Parallel Opportunities

- Within Issue 1: Tailwind config, React Router setup, and JSON data files can run in parallel
- After Issue 1: **Issue 2 (CLM) and Issue 3 (Chat) in parallel** — zero cross-lane blocking
- Within Issue 2: badge and card components parallelizable before Board integration
- Within Issue 3: CitationCard and MessageBubble parallelizable before ChatView integration
- Within Issue 4: badge review and Spanish copy review parallelizable

---

## Parallel Example: Issues 2 & 3 (after Issue 1)

```bash
# Contributor A — CLM lane:
Task: "Implement contract list with active/pending prioritization in src/clm/Board.tsx"
Task: "Implement contract detail view in src/clm/ContractDetail.tsx"

# Contributor B — Chat lane (no dependency on CLM UI):
Task: "Implement intent detection and contract matching in src/chat/engine.ts"
Task: "Implement chat view with input and citation rendering in src/chat/ChatView.tsx"

# Contributor C — finish Issue 1 gaps or prep Issue 4:
Task: "Create fictitious corpus JSON files in src/data/"
Task: "Review Spanish UI copy across src/clm/ and src/chat/"
```

---

## Implementation Strategy

### MVP First (Issues 1 + 2 + 3)

1. Complete Issue 1: Foundation ready
2. Complete Issues 2 and 3 **in parallel**: CLM demo path + Chat demo path
3. **STOP and VALIDATE**: Run 3-minute demo (tablero → detalle → chat with citation); confirm *datos ficticios* marker (SC-005, SC-006)
4. Demo to Legal stakeholders if ready; defer product integrations to IT phase

### Incremental Delivery

1. Issue 1 → App boots with corpus and user selector
2. Issue 2 → Tablero + detalle demo-ready (MVP slice 1)
3. Issue 3 → Chat with citations demo-ready (MVP slice 2 — full core demo)
4. Issue 4 → Optional solicitud + final polish and validation

### Parallel Team Strategy (3 Contributors)

**Principles**: No contributor idles waiting for another's incomplete issue; shared
dependencies live in Issue 1 only.

1. **All contributors** collaborate on Issue 1 (short, blocking foundation)
2. Once Issue 1 is done:
   - **Contributor A**: Issue 2 (CLM tablero + detalle) — self-contained lane
   - **Contributor B**: Issue 3 (Chat engine + UI) — self-contained lane, no CLM dependency
   - **Contributor C**: Corpus data polish, Spanish copy pass, prep Issue 4 validation checklist
3. All contributors converge on Issue 4 demo validation

**Anti-pattern avoided**: Contributor B does NOT wait for Contributor A's CLM detail —
chat only needs `src/lib/corpus.ts` and `src/lib/session.ts` from Issue 1.

### Single-Contributor Fallback

If working solo: Issue 1 → Issue 2 → Issue 3 → Issue 4, validating the demo path after Issue 3 before starting P4.

---

## Issue Mapping for GitHub

> Guides `speckit.taskstoissues` on how to create GitHub issues from this document.

| Issue Title | Scope | Priority |
|-------------|-------|----------|
| Project setup and shared foundation | Vite/React/TS/Tailwind init, domain types, corpus JSON, session/history libs, app shell, routes, datos ficticios badge | P1 — blocking |
| CLM tablero and contract detail | Board with filters/search/priority, contract detail with documents/history/origin badges | P1 — core demo (steps 1–2) |
| Chat IA with source citations | Read-only retrieval engine, Spanish responses with citations, recency ranking, private per-user history | P1 — core demo (step 3) |
| Optional request form and demo validation | P4 solicitud form, localStorage merge, Spanish polish, 3-min demo validation | P4 — finish and verify |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same issue
- P4 (solicitud) is optional — skip if time-constrained; Issues 1–3 deliver the 3-minute demo
- Chat engine is intentionally isolated in `src/chat/engine.ts` for future LLM substitution by IT
- Do not add real integrations (Drive, Gmail, SSO) or write actions on corpus sources
