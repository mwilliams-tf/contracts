import type { ChatAnswer, ChatContext, Suggestion } from "../models";
import { getContractById } from "../lib/corpus";

export function deriveSuggestions(ctx: ChatContext, lastAnswer?: ChatAnswer): Suggestion[] {
  const chips: Suggestion[] = [];

  if (ctx.conversationType === "portfolio") {
    chips.push({
      id: "portfolio-2028",
      label: "¿Qué contratos vencen en 2028?",
      query: "¿Qué contratos vencen en 2028?",
      visibleWhen: { conversationType: "portfolio" },
    });
  }

  if (ctx.conversationType === "anchored" && ctx.focusContractId) {
    const focus = getContractById(ctx.corpus, ctx.focusContractId);
    if (focus?.stateId === "st-rev-proveedor") {
      chips.push({
        id: "stanley-clausula-9",
        label: "Objeción cláusula 9",
        query: "¿Cuál es la objeción del proveedor sobre la cláusula 9?",
        visibleWhen: { conversationType: "anchored", focusStateId: "st-rev-proveedor" },
      });
      chips.push({
        id: "stanley-cross-acme",
        label: "¿Cómo se resolvió en Acme?",
        query: "¿Cómo se resolvió en Acme?",
        visibleWhen: { conversationType: "anchored", focusStateId: "st-rev-proveedor" },
      });
      chips.push({
        id: "stanley-redactar",
        label: "Ampliar cláusula 9",
        query: "Ampliá la cláusula 9 con una contrapropuesta",
        visibleWhen: { conversationType: "anchored", focusStateId: "st-rev-proveedor" },
      });
    }
  }

  if (lastAnswer?.intent === "clausula" && ctx.conversationType === "anchored") {
    chips.push({
      id: "follow-cross",
      label: "Comparar con Acme",
      query: "¿Cómo se resolvió en Acme?",
    });
  }

  return chips;
}
