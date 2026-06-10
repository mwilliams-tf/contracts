# Contract — Motor de Chat IA v2 (referencia cruzada + principal/referenciados)

**Feature**: `002-chat-conversacional` | **Date**: 2026-06-09

Evolución del contrato del motor de `001` (`contracts/chat-engine.md`). Mantiene la
naturaleza **determinista y de solo lectura** (Principios V/VII) y agrega: foco de
conversación, referencia cruzada entre contratos, y declaración explícita de contrato
principal y contratos referenciados. La interfaz sigue **aislada** para que IT la sustituya
por un LLM real sin cambiar la UI.

## Interfaz

```ts
interface ChatContext {
  corpus: Corpus;                 // contratos, proveedores, documentos, sources, estados
  userId: string;                 // usuaria activa (privacidad)
  conversationType: "portfolio" | "anchored";
  focusContractId?: string;       // contrato de foco (solo anchored)
  priorMessages?: Turn[];         // memoria de hilo de ESA conversación (FR-011)
}

interface Citation {
  sourceId: string;
  contractId: string;             // contrato de origen de la fuente (soporta cruce)
  sender: string;
  date: string;                   // ISO
  subject: string;
  simulatedLink: string;
}

interface ChatAnswer {
  text: string;                   // respuesta en español
  citations: Citation[];          // 0..n; vacío solo si no hay fuente (se indica en text)
  principalContractId: string | null;   // contrato sobre el que se actúa (FR-016)
  referencedContractIds: string[];      // contratos traídos como referencia (FR-016)
  proposedDraft?: DraftProposal;  // si la consulta pide redacción (FR-017)
  suggestions?: Suggestion[];     // chips de seguimiento (FR-022)
  intent: ChatIntent;
}

declare function answer(query: string, ctx: ChatContext): ChatAnswer;
```

## Comportamiento (invariantes)

1. **Solo lectura** (FR-019, Principio V): `answer` nunca modifica el corpus ni envía mails;
   sin efectos secundarios salvo lectura.
2. **Idioma** (FR-007): `text` siempre en español, comprensible para no técnicos.
3. **Citas** (FR-009): cuando hay fuente que respalda la respuesta, `citations` incluye al
   menos una con `sender`, `date`, `subject`, `simulatedLink` y `contractId` de origen.
4. **Recencia ante conflicto** (FR-010): ante valores en conflicto, refleja y cita primero
   la fuente de mayor `date`.
5. **Fallback honesto** (FR-012): sin respaldo ⇒ `citations: []` y `text` lo dice
   explícitamente; consulta fuera del corpus ⇒ `principalContractId: null`,
   `referencedContractIds: []` y aclaración.
6. **Memoria de hilo** (FR-011): resuelve seguimientos ("¿y los firmantes?", "esa cláusula")
   usando `priorMessages` + `focusContractId` de la conversación.
7. **Foco no excluyente** (FR-014): en `anchored`, el foco es el principal por defecto, pero
   la consulta puede traer cualquier otro contrato como referencia.
8. **Principal + referenciados** (FR-016): toda respuesta declara `principalContractId`
   (el de foco salvo que la consulta indique otro) y `referencedContractIds` con todos los
   contratos citados de otros expedientes.
9. **Portfolio** (FR-008): en `portfolio` sin foco, consultas transversales (p. ej. "¿qué
   contratos vencen en 2028?") devuelven varios contratos; `principalContractId` puede ser
   `null` y los resultados se citan individualmente.

## Detección de referencia cruzada (heurística, `chat/cross-reference.ts`)

| Señal | Ejemplos | Efecto |
|-------|----------|--------|
| Mención de otro contrato | "...en Acme", "como en Stanley" | agrega ese contrato a `referencedContractIds` |
| Pedido de precedente | "cómo resolvimos", "qué hicimos antes", "precedente" | busca contrato comparable y trae su cláusula/fuente |
| Comparación | "comparar", "diferencia con", "versus" | respuesta con ambos contratos citados |

Si no hay contrato comparable en el corpus ⇒ fallback honesto (FR-012, edge case).

## Casos de prueba (smoke)

| Caso | Entrada (conversación) | Salida esperada |
|------|------------------------|-----------------|
| Portfolio 2028 | "¿qué contratos vencen en 2028?" (portfolio) | lista monitoreo perimetral + locación Quilmes, cada uno con cita |
| Cruce Acme | "¿cómo se resolvió en Acme?" (anchored Stanley) | `principalContractId` = Stanley; `referencedContractIds` incluye Acme; cita fuentes de ambos |
| Seguimiento | "¿y los firmantes?" tras hablar de Acme (anchored) | responde firmantes de Acme por memoria de hilo |
| Conflicto recencia | vencimiento Acme con `src-001` (25/02) y `src-002` (02/03) | refleja `src-002` y la cita primero |
| Sin precedente | "cómo se resolvió en [contrato inexistente]" | fallback honesto, sin inventar referenciado |
| Fuera del corpus | "¿cuándo vence mi seguro de auto?" | `principalContractId: null`, aclaración |
