# Contract — Archivos de datos del corpus ficticio

**Feature**: `001-clm-chat-mvp` | **Date**: 2026-06-09

Define el formato de los JSON locales en `src/data/`. Son **solo lectura** en runtime.
Toda fecha en formato ISO `YYYY-MM-DD`. Estos archivos son el "contrato de datos" entre
el corpus y la UI/motor de chat.

## `providers.json`

```json
[
  {
    "id": "prov-001",
    "name": "Acme Cloud S.A.",
    "taxId": "30-11111111-1",
    "service": "Servicios IT"
  }
]
```

## `users.json`

```json
[
  { "id": "u-ana", "name": "Ana Pérez", "role": "abogada", "area": "Legales" },
  { "id": "u-juan", "name": "Juan Díaz", "role": "solicitante", "area": "Tecnología" }
]
```

## `workflow-states.json`

```json
[
  { "id": "st-solicitado", "name": "Solicitado", "order": 1, "active": false },
  { "id": "st-encurso",    "name": "En curso",   "order": 2, "active": true  },
  { "id": "st-pendiente",  "name": "Pendiente",  "order": 3, "active": true  },
  { "id": "st-cerrado",    "name": "Cerrado",    "order": 4, "active": false }
]
```

## `contracts.json`

```json
[
  {
    "id": "ctr-001",
    "title": "Contrato de servicios cloud — Acme",
    "service": "Servicios IT",
    "providerId": "prov-001",
    "requestingArea": "Tecnología",
    "stateId": "st-pendiente",
    "documentOrigin": "ModeloDelProveedor",
    "parties": ["Banco XYZ", "Acme Cloud S.A."],
    "signatories": [
      { "name": "María López", "role": "Apoderada Banco", "signed": false },
      { "name": "Acme Rep", "role": "Apoderado Proveedor", "signed": true }
    ],
    "startDate": "2026-03-01",
    "signatureDate": null,
    "expirationDate": "2027-03-01",
    "documentIds": ["doc-001"],
    "sourceIds": ["src-001", "src-002"],
    "stateHistory": [
      { "stateId": "st-solicitado", "date": "2026-02-10" },
      { "stateId": "st-encurso", "date": "2026-02-20" },
      { "stateId": "st-pendiente", "date": "2026-03-01", "note": "A la espera de firma del Banco" }
    ]
  }
]
```

## `documents.json`

```json
[
  {
    "id": "doc-001",
    "contractId": "ctr-001",
    "title": "Contrato marco Acme (borrador v3)",
    "type": "Contrato",
    "date": "2026-02-28",
    "simulatedLink": "#/sim/doc/doc-001"
  }
]
```

## `sources.json` (Mail/Source — citables por el chat)

```json
[
  {
    "id": "src-001",
    "contractId": "ctr-001",
    "kind": "mail",
    "sender": "acme.legal@example.com",
    "date": "2026-02-25",
    "subject": "Cláusula de vencimiento y renovación",
    "excerpt": "El contrato vence el 01/03/2027 con renovación automática salvo aviso.",
    "simulatedLink": "#/sim/mail/src-001"
  },
  {
    "id": "src-002",
    "contractId": "ctr-001",
    "kind": "mail",
    "sender": "maria.lopez@banco.example",
    "date": "2026-03-02",
    "subject": "Actualización de vencimiento",
    "excerpt": "Confirmamos vencimiento al 01/03/2027; firma del Banco pendiente.",
    "simulatedLink": "#/sim/mail/src-002"
  }
]
```

## Reglas de integridad del corpus

- Cada `providerId` / `stateId` referenciado por un Contract DEBE existir.
- Cada `Document.contractId` / `Source.contractId` DEBE resolver a un Contract.
- Para demostrar la prioridad por recencia (FR-012), al menos un contrato DEBE tener dos
  `sources` con el mismo dato y distinta `date` (p. ej. `src-001` y `src-002`).
- El corpus DEBE incluir al menos un contrato `Plantilla Propia` y uno `Modelo del
  Proveedor` (FR-009), y al menos un contrato `En curso`/`Pendiente` (FR-004).
