# Phase 1 — Data Model: MVP Demo Unificado CLM + Chat IA

**Feature**: `001-clm-chat-mvp` | **Date**: 2026-06-09

Modelo de dominio del prototipo. Las entidades se materializan como tipos TypeScript en
`src/models/index.ts` y como datos ficticios en `src/data/*.json`. Toda escritura sobre
el corpus está prohibida (solo lectura); la persistencia de demo (historial, solicitudes)
vive en `localStorage`.

## Entidades

### Contract

Contrato gestionado en el CLM lite. Entidad compartida entre los módulos CLM y Chat IA.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Identificador único |
| `title` | string | Nombre/descripción del contrato |
| `service` | string | Servicio/tipo (p. ej. "Servicios IT") |
| `providerId` | string | FK → Provider |
| `requestingArea` | string | Área solicitante |
| `stateId` | string | FK → WorkflowState (estado actual) |
| `documentOrigin` | `"PlantillaPropia" \| "ModeloDelProveedor"` | Origen documental (FR-009) |
| `parties` | string[] | Partes del contrato |
| `signatories` | Signatory[] | Firmantes (nombre, rol, firmado/pendiente) |
| `startDate` | ISO date | Fecha de alta/inicio |
| `signatureDate` | ISO date \| null | Fecha de firma |
| `expirationDate` | ISO date \| null | Vencimiento (FR-001) |
| `documentIds` | string[] | FK → Document[] |
| `sourceIds` | string[] | FK → Mail/Source[] |
| `stateHistory` | StateHistoryEntry[] | Historial de estados (FR-008) |

**Validation rules**:
- `expirationDate` < hoy ⇒ marcado como "Vencido" en UI.
- `documentOrigin` debe ser uno de los dos valores enumerados.
- `providerId` y `stateId` deben resolver a entidades existentes del corpus.

### Provider

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `name` | string | Nombre del proveedor (buscable, FR-003) |
| `taxId` | string | Identificación |
| `service` | string | Servicio asociado |

### Document

Documento simulado asociado a un contrato.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `contractId` | string | FK → Contract |
| `title` | string | Título |
| `type` | string | p. ej. "Contrato", "Anexo", "Borrador" |
| `date` | ISO date | Fecha del documento |
| `simulatedLink` | string | Link simulado (placeholder local) |

### Mail/Source

Fuente citable por el chat (mail u otro registro).

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `contractId` | string | FK → Contract |
| `kind` | `"mail" \| "documento" \| "nota"` | Tipo de fuente |
| `sender` | string | Remitente (FR-011) |
| `date` | ISO date | Fecha — usada para priorizar recencia (FR-012) |
| `subject` | string | Asunto/título |
| `excerpt` | string | Fragmento citado en la respuesta |
| `simulatedLink` | string | Link simulado |

### User

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `name` | string | Nombre visible |
| `role` | `"abogada" \| "solicitante"` | Determina alcance de visibilidad (FR-020/FR-021) |
| `area` | string | Área (para solicitantes) |

### Conversation

Historial de chat privado por usuaria. Persistido en `localStorage`, no en el corpus.

| Campo | Tipo | Notas |
|-------|------|-------|
| `userId` | string | Propietaria (FR-013) |
| `messages` | ChatMessage[] | Secuencia de mensajes |

`ChatMessage`: `{ role: "user" | "assistant"; text: string; citations?: Citation[]; timestamp: ISO date }`

`Citation`: `{ sourceId: string; sender: string; date: ISO date; subject: string; simulatedLink: string }`

### WorkflowState

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | Único |
| `name` | string | "Solicitado", "En curso", "Pendiente", "Cerrado", ... |
| `order` | number | Orden lógico del flujo |
| `active` | boolean | true para En curso/Pendiente (prioridad en tablero, FR-004) |

`StateHistoryEntry`: `{ stateId: string; date: ISO date; note?: string }`

## Relaciones

```text
Provider 1 ──< Contract >── 1 WorkflowState (estado actual)
Contract 1 ──< Document
Contract 1 ──< Mail/Source        (citadas por el chat)
Contract 1 ──< StateHistoryEntry  (historial de estados)
User 1 ──< Conversation           (privada, en localStorage)
Conversation.messages[].citations[] ──> Mail/Source
```

## Estados (WorkflowState) y transiciones de demo

Estados del corpus de demo (orden lógico): `Solicitado → En curso → Pendiente → Cerrado`.

- **MVP**: no se implementa el workflow completo ni alertas automáticas (fuera de alcance).
- **P4 (opcional)**: crear solicitud ⇒ nuevo Contract en estado `Solicitado`.
- Los estados `En curso` y `Pendiente` tienen `active: true` y se priorizan/destacan en el
  tablero.

## Persistencia de demo (no-corpus)

| Clave localStorage | Contenido |
|--------------------|-----------|
| `clm-chat:session` | id de la usuaria activa (identidad simulada) |
| `clm-chat:history:<userId>` | Conversation de esa usuaria (privacidad por usuaria) |
| `clm-chat:requests` | Solicitudes creadas en la demo (P4), fusionadas al tablero |
