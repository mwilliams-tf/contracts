import type { ChatContext } from "../models";
import { ACME_CONTRACT_ID, STANLEY_CONTRACT_ID } from "../data/seed-conversations";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isStanleyAnchored(ctx: ChatContext): boolean {
  if (ctx.conversationType !== "anchored" || !ctx.focusContractId) return false;
  if (ctx.focusContractId === STANLEY_CONTRACT_ID) return true;

  const focus = ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
  if (!focus) return false;
  const provider = normalize(focus.provider.name);
  const title = normalize(focus.title);
  return provider.includes("stanley") || title.includes("stanley");
}

export function isAcmeAnchored(ctx: ChatContext): boolean {
  if (ctx.conversationType !== "anchored" || !ctx.focusContractId) return false;
  if (ctx.focusContractId === ACME_CONTRACT_ID) return true;

  const focus = ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
  if (!focus) return false;
  const provider = normalize(focus.provider.name);
  const title = normalize(focus.title);
  return provider.includes("acme") || title.includes("acme");
}

/** Conversación/demo Stanley: foco Stanley o mención explícita en la pregunta actual */
export function isStanleyConversation(query: string, ctx: ChatContext): boolean {
  if (isStanleyAnchored(ctx)) return true;

  const cq = normalize(query);
  if (cq.includes("acme") && !cq.includes("stanley")) return false;
  return cq.includes("stanley");
}

/** Conversación Acme: foco Acme o mención en la pregunta actual (no por historial) */
export function isAcmeConversation(query: string, ctx: ChatContext): boolean {
  if (isStanleyAnchored(ctx)) return false;
  if (isAcmeAnchored(ctx)) return true;

  const cq = normalize(query);
  if (cq.includes("stanley")) return false;
  return cq.includes("acme");
}

export function threadMentionsClausula9(ctx: ChatContext): boolean {
  const text = (ctx.priorMessages ?? [])
    .map((m) => m.text)
    .join(" ");
  const q = normalize(text);
  return (
    q.includes("clausula 9") ||
    q.includes("objecion") ||
    q.includes("limitacion") ||
    q.includes("responsabilidad")
  );
}
