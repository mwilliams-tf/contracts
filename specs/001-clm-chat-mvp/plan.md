# Implementation Plan: MVP Demo Unificado CLM + Chat IA (Legales Banco)

**Branch**: `001-clm-chat-mvp` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-clm-chat-mvp/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Prototipo web demostrable (no productivo) para el área de Legales de un banco que unifica
un **CLM lite** (tablero + detalle de contratos) y un **Chat IA** de consultas sobre un
corpus ficticio, con citas de fuente. La aplicación es **frontend-only**: todos los datos
(contratos, documentos, mails) viven en archivos JSON locales versionados, y el chat
responde mediante un motor de **recuperación determinista** sobre ese corpus (sin LLM
externo, sin claves, sin SSO), priorizando la fuente más reciente ante conflictos. El
historial de chat es privado por usuaria (almacenado en `localStorage` por identidad
simulada). El objetivo es una demo creíble de 3 minutos: tablero → detalle → chat con
fuente citada, con marcador permanente de "datos ficticios".

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: React 18, Vite 5, React Router 6, Tailwind CSS 3

**Storage**: Archivos JSON locales en `src/data/` (corpus ficticio, solo lectura) + `localStorage` del navegador (historial de chat y solicitudes creadas en la demo)

**Testing**: Vitest + React Testing Library (opcional — solo smoke tests del motor de recuperación y del filtrado; las pruebas exhaustivas quedan fuera del MVP)

**Target Platform**: Navegador moderno (desktop), ejecutado localmente con `vite dev`

**Project Type**: Web application (frontend-only / SPA, sin backend)

**Performance Goals**: Carga e interacción instantáneas para un corpus de demo (~20–50 contratos). Tablero filtra/busca en <100 ms; respuesta de chat en <500 ms (recuperación local).

**Constraints**: Sin integraciones reales (Drive, Gmail, SSO, notificaciones); sin envío de mails; sin escritura sobre documentos fuente; sin generación real de .docx. UI y respuestas en español. Marcador de "datos ficticios" visible en pantallas principales.

**Scale/Scope**: Demo de 3 minutos. 4 user stories (P1–P4, P4 opcional), ~4 vistas (tablero, detalle, chat, formulario de solicitud), 7 entidades, corpus ficticio reducido.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| # | Gate | Pass criteria | Status |
|---|------|---------------|--------|
| 1 | MVP Demostrable Primero | Scope fits a ~3 min demo; no product-only requirements without explicit agreement | ✅ Alcance acotado a tablero/detalle/chat; P4 opcional |
| 2 | Dominio Legal Fiel | Uses Legales terminology, contract types, and states from existing business specs | ✅ Estados y origen documental tomados del dominio (Solicitado/En curso/Pendiente/Cerrado, Plantilla Propia/Modelo del Proveedor) |
| 3 | Datos Ficticios, Flujo Real | Data is local/JSON/static; user journey feels production-real | ✅ Corpus JSON local; recorrido real tablero→detalle→chat |
| 4 | Módulos Delimitados | Feature maps to CLM or Chat IA bounded context; shared `Contract` model only where needed | ✅ Módulos `clm/` y `chat/` separados; modelo `Contract` compartido vía `data/` |
| 5 | Solo Lectura en Fuentes | Chat does not write to or send mail; read-only on sources (FR-015/FR-016) | ✅ Motor de recuperación de solo lectura; sin acciones de escritura |
| 6 | Privacidad de Historial | Per-user chat history isolation; shared contractual corpus for Legales | ✅ Historial en `localStorage` namespaced por usuaria; corpus común |
| 7 | Simplicidad sobre Integración | No Drive, Gmail, SSO, real docx, notifications, or bank permissions in scope | ✅ Sin integraciones; identidad y links simulados |
| 8 | Español y Claridad | UI copy and chat responses in Spanish for non-technical lawyers | ✅ Toda la UI/copy/respuestas en español |

**Prototype markers**: El plan incluye un banner/badge permanente de "Datos ficticios"
(componente compartido) presente en tablero, detalle y chat (FR-005, SC-006). El tablero
prioriza y destaca contratos En curso/Pendiente (FR-004). **Sin violaciones** → no se
requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-clm-chat-mvp/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── data-files.md    # Esquema de los JSON del corpus ficticio
│   └── chat-engine.md   # Contrato del motor de consulta/respuesta con citas
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx                 # Bootstrap React + Router
├── App.tsx                  # Layout + rutas + banner "Datos ficticios"
├── data/                    # Corpus ficticio (solo lectura)
│   ├── contracts.json
│   ├── providers.json
│   ├── documents.json
│   ├── sources.json         # Mails/fuentes citables
│   └── users.json
├── models/                  # Tipos TypeScript de las entidades (Contract, Provider, ...)
│   └── index.ts
├── lib/                     # Lógica compartida sin UI
│   ├── corpus.ts            # Carga/normaliza el corpus desde data/
│   ├── history.ts          # Historial de chat por usuaria (localStorage)
│   └── session.ts          # Identidad simulada (usuaria activa, rol)
├── clm/                     # Bounded context: CLM lite
│   ├── Board.tsx            # US1 — tablero (listado, filtros, búsqueda, prioridad)
│   ├── ContractDetail.tsx   # US2 — detalle (partes, firmantes, docs, historial)
│   ├── RequestForm.tsx      # US4 (opcional) — solicitud simplificada
│   └── components/          # Tarjetas, badges de estado/origen documental
├── chat/                    # Bounded context: Chat IA
│   ├── ChatView.tsx         # US3 — UI de chat + historial privado
│   ├── engine.ts            # Motor de recuperación + ranking por recencia + citas
│   └── components/          # Burbujas de mensaje, tarjeta de cita de fuente
├── components/              # UI compartida
│   ├── FictitiousDataBadge.tsx
│   └── ...
└── styles/                  # Tailwind / estilos globales

tests/                       # (opcional)
├── chat-engine.test.ts      # Recuperación, citas, prioridad por recencia
└── board-filter.test.ts     # Filtros y búsqueda del tablero
```

**Structure Decision**: SPA frontend-only con Vite + React. Se eligen dos carpetas de
módulo (`clm/` y `chat/`) como **bounded contexts** (Principio IV), compartiendo modelos
y corpus a través de `models/` y `lib/corpus.ts`. No hay backend: el "Chat IA" es un
motor de recuperación local sobre JSON, lo que satisface Simplicidad sobre Integración
(Principio VII) y Solo Lectura en Fuentes (Principio V) sin claves ni servicios externos.

## Complexity Tracking

> No hay violaciones de la Constitution Check. Sección no aplica.
