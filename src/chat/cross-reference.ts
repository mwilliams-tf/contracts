import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import { tryAcmeDemoAnswer, resolveAcmeContractId } from "./acme-demo";
import { detectIntent, finalizeAnswer, toCitation } from "./engine";
import { resolveStanleyContractId } from "./stanley-demo";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveCitations(sourceIds: string[], ctx: ChatContext): Citation[] {
  return sourceIds
    .map((id) => ctx.corpus.sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s))
    .map(toCitation);
}

function mentionsCrossReference(query: string): boolean {
  const q = normalize(query);
  return (
    q.includes("como en acme") ||
    q.includes("como en stanley") ||
    q.includes("como resolvimos") ||
    q.includes("como se resolvio") ||
    q.includes("cómo se resolvió") ||
    q.includes("cómo resolvimos") ||
    q.includes("precedente") ||
    q.includes("comparar") ||
    q.includes(" versus ") ||
    q.includes(" vs ") ||
    q.includes("en acme") ||
    q.includes("con acme")
  );
}

function detectReferencedContractIds(query: string, ctx: ChatContext): string[] {
  const q = normalize(query);
  const ids: string[] = [];

  if (q.includes("acme")) {
    ids.push(resolveAcmeContractId(ctx));
  }
  if (q.includes("stanley")) {
    ids.push(resolveStanleyContractId(ctx));
  }

  return [...new Set(ids)].filter((id) => id !== ctx.focusContractId);
}

export function tryCrossReferenceAnswer(
  query: string,
  ctx: ChatContext,
): ChatAnswer | null {
  if (!mentionsCrossReference(query)) return null;
  if (ctx.conversationType !== "anchored" || !ctx.focusContractId) return null;

  const principalId = ctx.focusContractId;
  const referencedIds = detectReferencedContractIds(query, ctx);

  if (referencedIds.length === 0) {
    return null;
  }

  const principal = ctx.corpus.contracts.find((c) => c.id === principalId);
  const referenced = referencedIds
    .map((id) => ctx.corpus.contracts.find((c) => c.id === id))
    .filter(Boolean);

  if (!principal || referenced.length === 0) {
    return finalizeAnswer(
      {
        text: "No encontré un precedente comparable en el corpus ficticio para esa consulta. Probá mencionar un contrato concreto (p. ej. Acme o Stanley).",
        citations: [],
        matchedContractIds: principal ? [principal.id] : [],
        intent: detectIntent(query, ctx.priorMessages),
        principalContractId: principal?.id ?? null,
        referencedContractIds: [],
      },
      ctx,
    );
  }

  const acmeId = resolveAcmeContractId(ctx);
  if (referencedIds.includes(acmeId)) {
    const acmeAnswer = tryAcmeDemoAnswer("vencimiento acme", ctx);
    const acmeCitations = acmeAnswer?.citations ?? resolveCitations(["src-002"], ctx);

    return finalizeAnswer(
      {
        text:
          `Sobre el contrato principal «${principal.title}», traigo el precedente de Acme:\n\n` +
          `En Acme resolvimos el conflicto de vencimiento priorizando la fuente más reciente (01/03/2027 prevalece sobre el mail anterior del proveedor). ` +
          `Podés aplicar el mismo criterio de recencia y negociación de limitación de responsabilidad en Stanley.\n\n` +
          `Referencia Acme: ${acmeAnswer?.text ?? "vencimiento confirmado al 01/03/2027 con firma del Banco pendiente (María López)."}`,
        citations: [
          ...resolveCitations(["src-007"], ctx),
          ...acmeCitations,
        ],
        matchedContractIds: [principalId, acmeId],
        intent: "clausula",
        principalContractId: principalId,
        referencedContractIds: [acmeId],
      },
      ctx,
    );
  }

  return null;
}
