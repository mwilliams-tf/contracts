# Contract — Bandeja y persistencia de conversaciones

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Contrato de la capa de persistencia de conversaciones en `src/lib/conversations.ts`.
Reemplaza el almacenamiento de hilo único de `001` (`lib/history.ts`) por una bandeja de
conversaciones por usuaria en `localStorage`. **Solo lectura sobre el corpus**; toda
escritura ocurre en `localStorage` namespaced por usuaria (privacidad, FR-004).

## Interfaz

```ts
import type { Conversation, Turn } from "../models";

/** Clave: clm-chat:conversations:<userId> */
function conversationsKey(userId: string): string;

/** Devuelve la bandeja de la usuaria; siembra las seeds la primera vez (FR-005). */
function loadInbox(userId: string): Conversation[];

/** Persiste la bandeja completa de la usuaria. */
function saveInbox(userId: string, conversations: Conversation[]): void;

/** Crea una conversación nueva (portfolio o anclada) y la agrega a la bandeja (FR-002). */
function createConversation(
  userId: string,
  input: { type: "portfolio" | "anchored"; focusContractId?: string; title?: string },
): Conversation;

/** Lee una conversación por id (privada de la usuaria). */
function getConversation(userId: string, conversationId: string): Conversation | null;

/** Agrega un turno a una conversación `live` y actualiza `updatedAt` (FR-003). */
function appendTurn(userId: string, conversationId: string, turn: Turn): Conversation;

/** Reabre/crea la conversación anclada a un contrato de foco (apertura contextual, FR-021). */
function openOrCreateAnchored(userId: string, focusContractId: string): Conversation;
```

## Comportamiento (invariantes)

1. **Privacidad** (FR-004, Principio VI): toda operación usa exclusivamente la clave del
   `userId` recibido; no existe lectura cruzada entre usuarias.
2. **Persistencia** (FR-003): el historial y la bandeja sobreviven a recargas; `loadInbox`
   tras un `appendTurn`/`createConversation` refleja el estado guardado.
3. **Seeds** (FR-005): en la primera carga de la usuaria abogada por defecto, si la bandeja
   está vacía, se siembran las tres conversaciones seed (Acme frozen, 2028 frozen, Stanley
   live) desde `data/seed-conversations.ts`. Las seeds no se duplican en cargas posteriores.
4. **Congeladas** (edge case): `appendTurn` sobre una conversación `frozen` es un no-op /
   rechazado; la UI no ofrece input en ese caso.
5. **Orden de bandeja**: por `updatedAt` descendente (conversación activa primero).
6. **Compatibilidad** (D8): si existe `clm-chat:history:<userId>` antiguo, no se rompe; se
   ignora o se ofrece como conversación portfolio adicional.

## Casos de prueba (smoke)

| Caso | Entrada | Salida esperada |
|------|---------|-----------------|
| Seeds visibles | `loadInbox(abogada)` primera vez | 3 conversaciones: Acme(frozen), 2028(frozen), Stanley(live) |
| Crear conversación | `createConversation(u, {type:"portfolio"})` | bandeja crece en 1; queda abierta y vacía |
| Persistencia | `appendTurn` → recargar → `loadInbox` | el turno persiste en esa conversación |
| Privacidad | `loadInbox(userA)` vs `loadInbox(userB)` | bandejas disjuntas; B no ve nada de A |
| Anclada por foco | `openOrCreateAnchored(u, "ctr-006")` | conversación `anchored` con `focusContractId="ctr-006"` |
| Congelada | `appendTurn` sobre Acme(frozen) | no agrega turno (no-op) |
