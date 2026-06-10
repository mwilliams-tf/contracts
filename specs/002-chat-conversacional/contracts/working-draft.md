# Contract — Acción simulada de redacción y borrador de trabajo

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Contrato de la acción de redacción simulada (`src/chat/drafting.ts`) y de la persistencia
del borrador local (`src/lib/working-drafts.ts`). Garantiza el Principio V (Solo Lectura en
Fuentes): la acción **nunca** modifica el corpus ni genera archivos reales; solo crea un
`WorkingDraft` local en `localStorage`.

## Interfaz

```ts
import type { DraftProposal, WorkingDraft, ChatContext } from "../models";

/** Detecta un pedido de redacción y arma la propuesta (sin aplicarla). FR-017 */
function proposeDraft(query: string, ctx: ChatContext): DraftProposal | null;

/** Clave: clm-chat:drafts:<contractId> */
function draftsKey(contractId: string): string;

/** Aplica la propuesta: crea un WorkingDraft local (versión nueva). FR-018 */
function applyDraft(proposal: DraftProposal, conversationId: string): WorkingDraft;

/** Lista los borradores locales de un contrato (para mostrarlos en la UI). */
function getWorkingDrafts(contractId: string): WorkingDraft[];
```

## Comportamiento (invariantes)

1. **Propuesta en español** (FR-017): `proposeDraft` devuelve `proposedText` redactado en
   español, con `clauseRef`, `contractId` (principal) y `basedOnContractIds` (precedentes).
2. **Solo borrador local** (FR-018): `applyDraft` escribe únicamente bajo
   `clm-chat:drafts:<contractId>` en `localStorage`; `version` se incrementa por aplicación.
3. **No modifica fuentes** (FR-019, Principio V): no escribe `contracts.json`,
   `documents.json`, ni el IndexedDB de documentos (`lib/document-store.ts`); no envía mails;
   no genera `.docx`.
4. **Marca de simulación** (FR-020): `WorkingDraft.simulated === true`; la UI
   (`DraftActionCard`) rotula "acción simulada — no modifica fuentes reales" y aclara el
   punto de sustitución (en producción → .docx en Drive).
5. **Idempotencia segura** (edge case): aplicar dos veces produce dos versiones del borrador
   local sin corromper ni duplicar documentos fuente.
6. **Trazabilidad**: `WorkingDraft.sourceConversationId` enlaza el borrador con la
   conversación que lo originó.

## Casos de prueba (smoke)

| Caso | Entrada | Salida esperada |
|------|---------|-----------------|
| Proponer redacción | "ampliá la cláusula 9" (anchored Stanley) | `DraftProposal` con `clauseRef="Cláusula 9"`, texto en español |
| Aplicar al borrador | `applyDraft(proposal, convId)` | `WorkingDraft v1` en `clm-chat:drafts:ctr-006`, `simulated:true` |
| Fuentes intactas | tras aplicar, leer corpus + IndexedDB | sin cambios en `contracts.json`/documentos; sin mail enviado |
| Aplicar dos veces | `applyDraft` x2 | dos versiones (v1, v2); corpus intacto |
