import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import { detectIntent } from "./engine";

/** Guion demo Acme — prioridad fija cuando la conversación es sobre Acme */
export type AcmeDemoQuestionId =
  | "acme-firmantes"
  | "acme-mails"
  | "acme-vencimiento"
  | "acme-estado";

const ACME_RESPONSES: Record<
  AcmeDemoQuestionId,
  { text: string; citationSourceIds: string[] }
> = {
  "acme-estado": {
    text:
      "El contrato «Contrato de servicios cloud — Acme» (Acme Cloud S.A.) está en «Pendiente de firma».\n\nRecorrió Solicitado → Revisión de legales → Revisión del área solicitante → Revisión del proveedor → Revisión legales final. Desde el 01/03/2026 aguarda firma del Banco.\n\nÚltima observación: «A la espera de firma del Banco — Compras gestiona». Carlos Acme (proveedor) figura firmado; María López (Banco) pendiente.",
    citationSourceIds: ["src-002"],
  },
  "acme-vencimiento": {
    text:
      "Vencimiento — Contrato Acme:\n\n• CLM: 01/03/2027\n• Mail más reciente (02/03/2026, María López): confirma vencimiento al 01/03/2027; firma del Banco pendiente.\n• Mail anterior del proveedor (25/02/2026) mencionaba 01/03/2026 — prevalece la fuente más reciente.\n\nRecomendación: priorizar cierre de firma interna (Compras) dado el estado Pendiente de firma.",
    citationSourceIds: ["src-002", "src-001"],
  },
  "acme-firmantes": {
    text:
      "Firmantes — Contrato Acme:\n\n• Carlos Acme (Apoderado Proveedor) — firmado\n• María López (Apoderada Banco) — pendiente\n\nEstado: Pendiente de firma. Compras gestiona el registro del PDF firmado en el CLM.",
    citationSourceIds: ["src-002"],
  },
  "acme-mails": {
    text:
      "Mails relevantes — Contrato Acme:\n\n1. 25/02/2026 — acme.legal@example.com: vencimiento con renovación automática (menciona 01/03/2026).\n\n2. 02/03/2026 — maria.lopez@banco.example: confirma vencimiento al 01/03/2027 y firma del Banco pendiente.\n\nPara vencimiento, prevalece el mail más reciente (marzo 2027).",
    citationSourceIds: ["src-001", "src-002"],
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildSearchText(query: string, ctx: ChatContext): string {
  const prior = ctx.priorMessages
    ?.filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.text)
    .join(" ");
  return prior ? `${prior} ${query}` : query;
}

export function mentionsAcme(text: string): boolean {
  return normalize(text).includes("acme");
}

export function resolveAcmeContractId(ctx: ChatContext): string {
  const contract = ctx.corpus.contracts.find(
    (c) =>
      normalize(c.provider.name).includes("acme") || normalize(c.title).includes("acme"),
  );
  return contract?.id ?? "ctr-001";
}

function resolveCitations(sourceIds: string[], ctx: ChatContext): Citation[] {
  return sourceIds
    .map((id) => ctx.corpus.sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s))
    .map((source) => ({
      sourceId: source.id,
      sender: source.sender,
      date: source.date,
      subject: source.subject,
      simulatedLink: source.simulatedLink,
    }));
}

export function isAcmeConversation(query: string, ctx: ChatContext): boolean {
  const cq = normalize(query);
  const sq = normalize(buildSearchText(query, ctx));
  if (cq.includes("stanley")) return false;
  return cq.includes("acme") || (sq.includes("acme") && !sq.includes("stanley"));
}

export function matchAcmeDemoQuestion(
  query: string,
  ctx: ChatContext,
): AcmeDemoQuestionId | null {
  if (!isAcmeConversation(query, ctx)) return null;

  const q = normalize(buildSearchText(query, ctx));

  const isFirmantes =
    q.includes("firmante") ||
    q.includes("firmado") ||
    q.includes("firma") ||
    q.includes("apoderado") ||
    q.includes("quien falta");

  const isMails =
    q.includes("mail") ||
    q.includes("correo") ||
    q.includes("intercambio");

  const isVencimiento =
    q.includes("venc") ||
    q.includes("termina") ||
    q.includes("finaliza") ||
    q.includes("renovacion") ||
    q.includes("vigencia") ||
    q.includes("plazo");

  const isEstado =
    q.includes("estado") ||
    q.includes("situacion") ||
    q.includes("como esta") ||
    q.includes("en que esta");

  if (isFirmantes) return "acme-firmantes";
  if (isMails) return "acme-mails";
  if (isVencimiento) return "acme-vencimiento";
  if (isEstado) return "acme-estado";

  return null;
}

export function tryAcmeDemoAnswer(query: string, ctx: ChatContext): ChatAnswer | null {
  const questionId = matchAcmeDemoQuestion(query, ctx);
  if (!questionId) return null;

  const scripted = ACME_RESPONSES[questionId];

  return {
    text: scripted.text,
    citations: resolveCitations(scripted.citationSourceIds, ctx),
    matchedContractIds: [resolveAcmeContractId(ctx)],
    intent: detectIntent(query, ctx.priorMessages),
  };
}
