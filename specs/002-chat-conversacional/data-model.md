# Phase 1 — Data Model: Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Modelo de la evolución del chat. Las entidades del **corpus** (Contract, Provider, Document,
Source, User, WorkflowState) se reutilizan **sin cambios de esquema** desde `001`
(`src/models/index.ts`, `src/data/*.json`) y son de **solo lectura**. Este documento define
las entidades **nuevas o modificadas** de la capa de conversación, que viven en
`localStorage` por usuaria (nunca en el corpus).

## Entidades nuevas / modificadas

### Conversation (modificada — reemplaza el hilo único de `001`)

Hilo de diálogo propiedad de una usuaria. En `001` era `{ userId, messages }`; ahora es una
entidad identificable dentro de una bandeja.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Identificador único de la conversación |
| `userId` | string | Propietaria (privacidad por usuaria, FR-004) |
| `title` | string | Título visible en la bandeja |
| `type` | `"portfolio" \| "anchored"` | Transversal o con contrato de foco (FR-008) |
| `focusContractId` | string \| null | FK → Contract; solo en `anchored` (FR-021) |
| `status` | `"live" \| "frozen"` | `frozen` = archivada/congelada (solo lectura) |
| `createdAt` | ISO datetime | Alta de la conversación |
| `updatedAt` | ISO datetime | Última actividad (orden de la bandeja) |
| `messages` | Turn[] | Secuencia de turnos (memoria de hilo) |

**Validation rules**:
- `type === "anchored"` ⇒ `focusContractId` debe resolver a un Contract del corpus.
- `type === "portfolio"` ⇒ `focusContractId` es `null`.
- `status === "frozen"` ⇒ la UI no permite agregar turnos (FR-005, edge case).
- Las conversaciones son privadas: solo se leen/escriben bajo la clave de su `userId`.

### Turn / Message (modificada — antes `ChatMessage`)

Turno individual. Extiende el `ChatMessage` de `001` con metadatos de principal/referenciados
y acción propuesta.

| Campo | Tipo | Notas |
|-------|------|-------|
| `role` | `"user" \| "assistant"` | Autor del turno |
| `text` | string | Contenido en español |
| `timestamp` | ISO datetime | Momento del turno |
| `principalContractId` | string \| null | Contrato sobre el que se actúa (FR-016) |
| `referencedContractIds` | string[] | Contratos traídos como referencia (FR-016) |
| `citations` | Citation[] | 0..n citas de fuente (FR-009) |
| `proposedDraft` | DraftProposal \| null | Acción de redacción ofrecida (FR-017) |
| `suggestions` | Suggestion[] | Chips ofrecidos tras la respuesta (FR-022) |

**Validation rules**:
- Turno `assistant` con respaldo ⇒ `citations.length >= 1`; sin respaldo ⇒ `citations: []`
  y `text` aplica fallback honesto (FR-012).
- Turno de referencia cruzada ⇒ `principalContractId` definido y `referencedContractIds`
  lista todos los contratos citados de otros expedientes (FR-016).

### Citation (modificada — agrega contrato de origen)

| Campo | Tipo | Notas |
|-------|------|-------|
| `sourceId` | string | FK → Source del corpus |
| `contractId` | string | Contrato de origen de la fuente (nuevo; soporta cruce) |
| `sender` | string | Remitente (FR-009) |
| `date` | ISO date | Fecha — prioriza recencia ante conflicto (FR-010) |
| `subject` | string | Asunto/título |
| `simulatedLink` | string | Link simulado (placeholder local) |

### DraftProposal

Propuesta de redacción generada por la acción simulada (antes de aplicarse).

| Campo | Tipo | Notas |
|-------|------|-------|
| `contractId` | string | Contrato principal destino del borrador |
| `clauseRef` | string | Cláusula/sección objetivo (p. ej. "Cláusula 9") |
| `proposedText` | string | Redacción propuesta en español |
| `basedOnContractIds` | string[] | Precedentes que inspiran la redacción (FR-015) |

### WorkingDraft

Borrador de trabajo local generado al "aplicar al borrador". **Nunca** modifica el corpus.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `contractId` | string | FK → Contract (principal) |
| `version` | number | Versión incremental del borrador local |
| `clauseRef` | string | Cláusula/sección modificada |
| `text` | string | Texto aplicado |
| `simulated` | `true` | Marca de artefacto de demo (FR-020) |
| `createdAt` | ISO datetime | Momento de aplicación |
| `sourceConversationId` | string | Conversación que originó el borrador |

**Validation rules**:
- Aplicar nunca escribe en `contracts.json`/`documents.json` ni en IndexedDB de documentos
  (FR-018/FR-019); solo agrega/incrementa el `WorkingDraft` en `localStorage`.
- Aplicar dos veces incrementa `version`, no corrompe ni duplica fuentes (edge case).

### Suggestion / Chip

Sugerencia clicable mostrada en una conversación.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único en el contexto |
| `label` | string | Texto visible del chip |
| `query` | string | Consulta que se envía al pulsarlo (FR-022) |
| `visibleWhen` | objeto | Condición (tipo de conversación, estado del foco) |

## Relaciones

```text
User 1 ──< Conversation            (bandeja privada, en localStorage por userId)
Conversation 1 ──< Turn            (memoria de hilo)
Conversation.focusContractId ──> Contract        (solo si type = anchored)
Turn.principalContractId      ──> Contract
Turn.referencedContractIds[]  ──> Contract        (referencia cruzada)
Turn.citations[]              ──> Source (+ contractId de origen)
Turn.proposedDraft            ──> DraftProposal ──> Contract (principal)
"aplicar al borrador"         ──> WorkingDraft  ──> Contract (local, no corpus)
Contract / Provider / Document / Source / WorkflowState  = corpus de `001` (solo lectura)
```

## Persistencia de demo (no-corpus)

| Clave localStorage | Contenido |
|--------------------|-----------|
| `clm-chat:session` | id de la usuaria activa (identidad simulada) — existente |
| `clm-chat:conversations:<userId>` | Bandeja (lista de Conversations) de esa usuaria — **nuevo** |
| `clm-chat:drafts:<contractId>` | WorkingDraft[] del contrato — **nuevo** |
| `clm-chat:history:<userId>` | Hilo único de `001` — conservado para compatibilidad (D8) |
| `clm-chat:requests` | Solicitudes creadas en demo (P4 de `001`) — existente |

## Conversaciones seed (FR-005)

| Seed | type | focus | status | Contenido pre-cargado |
|------|------|-------|--------|------------------------|
| Acme Cloud | anchored | Acme (`ctr-001`) | frozen | Historial completo: vencimiento con conflicto de mails resuelto por recencia (01/03/2027 prevalece) y firmantes pendientes (María López) |
| Contratos que vencen en 2028 | portfolio | — | frozen | Respuesta ya dada: listado del corpus que vence en 2028 (monitoreo perimetral y locación Quilmes), con citas |
| Stanley Tech | anchored | Stanley (`ctr-006`) | live | Reproducible: objeción cláusula 9 (cita), cruce con Acme (principal Stanley + referenciado Acme), redacción ampliada aplicada al borrador de Stanley |
