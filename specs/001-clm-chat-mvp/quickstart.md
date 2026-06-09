# Quickstart — MVP Demo Unificado CLM + Chat IA

**Feature**: `001-clm-chat-mvp` | **Date**: 2026-06-09

Prototipo web (no productivo) para el área de Legales. Datos ficticios locales.

## Requisitos

- Node.js 20+
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev
```

Abrir la URL que imprime Vite (por defecto `http://localhost:5173`).

La aplicación arranca con una usuaria abogada seleccionada por defecto (Ana Pérez).
El selector de usuaria en la barra superior permite cambiar de sesión simulada.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción (estático) |
| `npm run preview` | Previsualiza el build |
| `npm test` | Smoke tests (motor de chat + filtros de tablero) — opcional |

## Recorrido de la demo (3 minutos)

1. **Identidad**: seleccionar la usuaria abogada (p. ej. "Ana Pérez"). El banner "Datos
   ficticios" está siempre visible.
2. **Tablero (US1)**: filtrar por estado "Pendiente" o buscar el proveedor "Acme"; los
   contratos En curso/Pendiente aparecen priorizados.
3. **Detalle (US2)**: abrir el contrato; ver partes, firmantes, fechas, documentos
   simulados, historial de estados y la marca "Plantilla Propia"/"Modelo del Proveedor".
4. **Chat IA (US3)**: preguntar "¿Cuándo vence el contrato de Acme?" → respuesta en
   español con la cita de la fuente más reciente; el historial es privado de Ana.
5. **(Opcional) Solicitud (US4)**: crear una solicitud "Servicios IT" con origen
   documental → aparece en el tablero en estado "Solicitado".

## Validación rápida (mapeo a Success Criteria)

- [ ] Encontrar un contrato pendiente por proveedor en <30 s (SC-001).
- [ ] Detalle accesible en ≤2 clics desde el tablero (SC-002).
- [ ] Respuesta de chat con ≥1 cita de fuente (SC-003).
- [ ] Ante conflicto, refleja la fuente más reciente (SC-004).
- [ ] Recorrido completo en ≤3 minutos (SC-005).
- [ ] Banner "datos ficticios" visible en tablero/detalle/chat (SC-006).
- [ ] El historial de una usuaria no es visible para otra (SC-007).

## Notas

- El "Chat IA" es un motor de recuperación local sobre el corpus JSON; no usa LLM externo
  ni red. IT podrá sustituir `chat/engine.ts` por un LLM real en la fase productiva.
- No hay integraciones reales (Drive, Gmail, SSO) ni envío de mails en esta fase.
