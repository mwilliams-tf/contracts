# Quickstart — Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Evolución del Chat IA del prototipo de Legales (`001-clm-chat-mvp`): de un hilo único a un
asistente con múltiples conversaciones, memoria de hilo, referencia cruzada y acción de
redacción simulada. Frontend-only, datos ficticios locales, sin LLM/SSO/Drive/Gmail.

## Requisitos

- Node.js 20+
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev
```

Abrir la URL que imprime Vite (por defecto `http://localhost:5173`). Arranca con la usuaria
abogada por defecto y el banner "Datos ficticios" siempre visible.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción (estático) |
| `npm run preview` | Previsualiza el build |
| `npm test` | Smoke tests (bandeja, referencia cruzada, borrador) — opcional |

## Recorrido de la demo (3 minutos)

1. **Bandeja (US1)**: abrir el asistente y ver la bandeja con las tres conversaciones seed
   privadas de la usuaria: **Acme Cloud** (anclada, congelada/resuelta), **Contratos que
   vencen en 2028** (portfolio, congelada) y **Stanley Tech** (anclada, en vivo).
2. **Stanley — objeción (US2)**: abrir Stanley y preguntar por la objeción de la **cláusula
   9** → respuesta en español con **cita** de la fuente (mail de Stanley, 05/06/2026).
3. **Stanley — referencia cruzada (US3)**: preguntar "¿cómo lo resolvimos en **Acme**?" →
   respuesta que declara **principal: Stanley** y **referenciado: Acme**, citando fuentes de
   ambos contratos.
4. **Stanley — redacción aplicada (US4)**: pedir una **redacción ampliada** de la cláusula 9
   y pulsar **"aplicar al borrador"** → se genera un **borrador de trabajo local** de
   Stanley; la tarjeta aclara que es una acción simulada (en producción iría a un .docx en
   Drive) y que **no modifica las fuentes**.
5. **Integración (US5, opcional)**: desde el **detalle** de un contrato, abrir el asistente
   con ese contrato precargado como foco; usar **chips** de sugerencia; observar que el
   asistente puede **sugerir** una transición de estado pero **no la ejecuta**.

## Validación rápida (mapeo a Success Criteria)

- [ ] Bandeja con las 3 conversaciones seed visible en <5 s (SC-001).
- [ ] Respuestas con respaldo incluyen ≥1 cita; sin respaldo, fallback honesto (SC-002).
- [ ] Ante conflicto, refleja la fuente más reciente (SC-003).
- [ ] Las respuestas de cruce declaran principal + referenciados (SC-004).
- [ ] "Aplicar al borrador" crea versión local sin tocar fuentes (SC-005).
- [ ] Una usuaria no ve las conversaciones de otra (SC-006).
- [ ] Recorrido completo en ≤3 minutos (SC-007).
- [ ] Marcador "datos ficticios" + "no modifica fuentes reales" visibles (SC-008).
- [ ] ≥2 variantes de redacción por intención clave responden correctamente (SC-009).

## Notas

- El asistente es un **motor de recuperación determinista** sobre el corpus JSON + guiones
  demo; no usa LLM externo ni red. IT podrá sustituir `chat/engine.ts` y los módulos
  `cross-reference.ts`/`drafting.ts` por un LLM real sin cambiar la UI.
- La bandeja y los borradores se persisten en `localStorage` namespaced por usuaria; el
  corpus es de **solo lectura** y las acciones de redacción no modifican fuentes ni envían
  mails.
- No hay integraciones reales (Drive, Gmail, SSO) en esta fase.
