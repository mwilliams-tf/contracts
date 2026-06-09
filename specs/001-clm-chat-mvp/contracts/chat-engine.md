# Contract — Motor de Chat IA (recuperación local)

**Feature**: `001-clm-chat-mvp` | **Date**: 2026-06-09

Contrato de la interfaz del motor de chat en `src/chat/engine.ts`. Define entradas,
salidas e invariantes. La implementación es de **solo lectura** sobre el corpus
(FR-015/FR-016) y aísla la lógica para que IT pueda sustituirla por un LLM real en fase
productiva sin cambiar la UI.

## Interfaz

```ts
type Intent =
  | "vencimiento"
  | "firmantes"
  | "clausula"
  | "partes"
  | "estado"
  | "general";

interface ChatContext {
  corpus: Corpus;        // contratos, proveedores, documentos, sources, estados
  userId: string;        // usuaria activa (para historial privado)
}

interface Citation {
  sourceId: string;
  sender: string;
  date: string;          // ISO
  subject: string;
  simulatedLink: string;
}

interface ChatAnswer {
  text: string;          // respuesta en español
  citations: Citation[]; // 0..n; vacío solo si no hay fuente (se indica en text)
  matchedContractIds: string[];
  intent: Intent;
}

declare function answer(query: string, ctx: ChatContext): ChatAnswer;
```

## Comportamiento (invariantes)

1. **Solo lectura**: `answer` NUNCA modifica el corpus, documentos ni envía mails
   (FR-015/FR-016). No produce efectos secundarios salvo lectura.
2. **Idioma**: `text` SIEMPRE en español, comprensible para no técnicos (FR-014).
3. **Citas**: cuando exista una fuente que respalde la respuesta, `citations` incluye al
   menos una entrada con `sender`, `date`, `subject` y `simulatedLink` (FR-011).
4. **Recencia ante conflicto**: si múltiples `sources` responden el mismo dato con valores
   distintos, la respuesta refleja la de mayor `date` y la cita primero (FR-012).
5. **Sin fuente**: si no hay fuente que respalde la respuesta, `citations` queda vacío y
   `text` indica explícitamente que no hay respaldo documental (edge case).
6. **Fuera del corpus**: si la consulta no coincide con ningún contrato,
   `matchedContractIds` queda vacío y `text` indica que no hay información en el corpus.

## Detección de intención (heurística)

| Intent | Palabras clave (ejemplos) |
|--------|---------------------------|
| `vencimiento` | "vence", "vencimiento", "expira", "renovación" |
| `firmantes` | "firma", "firmante", "firmado", "apoderado" |
| `clausula` | "cláusula", "clausula", "condición", "penalidad" |
| `partes` | "parte", "partes", "contraparte", "proveedor" |
| `estado` | "estado", "situación", "en qué está" |
| `general` | (fallback) |

El motor resuelve el contrato objetivo por coincidencia de proveedor/servicio/título en la
consulta; si hay ambigüedad, elige el contrato `active` (En curso/Pendiente) más reciente
y lo aclara en `text`.

## Casos de prueba (smoke)

| Caso | Entrada | Salida esperada |
|------|---------|-----------------|
| Vencimiento con cita | "¿Cuándo vence el contrato de Acme?" | `text` con fecha; `citations[0]` = fuente más reciente (`src-002`) |
| Conflicto por recencia | corpus con `src-001` (25/02) y `src-002` (02/03) | refleja `src-002` y la cita primero |
| Sin fuente | dato sin source asociada | `citations: []` y `text` lo aclara |
| Fuera del corpus | "¿Cuándo vence mi seguro de auto?" | `matchedContractIds: []` y aclaración |
