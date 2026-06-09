import { STANLEY_CLAUSE_13_TERMINACION } from "../data/stanley-clause-13";
import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import { detectIntent } from "./engine";

/** Guion demo Stanley — prioridad fija, se evalúa antes del matcher genérico */
export type StanleyDemoQuestionId =
  | "stanley-rescision"
  | "stanley-clausula-9"
  | "stanley-estado";

const STANLEY_RESPONSES: Record<
  StanleyDemoQuestionId,
  { text: string | (() => string); citationSourceIds: string[] }
> = {
  "stanley-estado": {
    text:
      "El contrato «Contrato Servicios IT — Stanley» (Stanley Tech S.A.) figura en estado «Revisión del proveedor».\n\nImportante: en esta etapa el proveedor responde por mail u otro canal externo; el área solicitante (Compras) registra esa respuesta en el CLM.\n\nÚltima novedad: mail de stanley@stanley.com (05/06/2026) — no están de acuerdo con la cláusula 9 (limitación de responsabilidad) y solicitan revisión antes de continuar.\n\nResponsable interno del expediente: área solicitante (Compras).",
    citationSourceIds: ["src-007", "src-008"],
  },
  "stanley-clausula-9": {
    text:
      "Objeción del proveedor — Cláusula 9 (Contrato Stanley):\n\nSegún el mail de stanley@stanley.com (05/06/2026), Stanley Tech no acepta la redacción actual de limitación de responsabilidad porque:\n\n• Consideran que el tope del 10% del fee anual es insuficiente para un servicio crítico de infraestructura IT.\n• Sostienen que no cubre daños indirectos ni lucro cesante ante indisponibilidad prolongada.\n• Cuestionan que la exclusión de responsabilidad por datos alojados en sus servidores resulta demasiado amplia a favor del Banco.\n\nNo rechazan el contrato en su totalidad: piden revisión de la cláusula 9 antes de avanzar a firma.\n\nLegales puede evaluar contrapropuesta (p. ej. subir el tope, acotar exclusiones o carve-out para datos personales) y registrar la decisión en el CLM.",
    citationSourceIds: ["src-007"],
  },
  "stanley-rescision": {
    text: () =>
      `El contrato dice lo siguiente sobre las causales de rescisión y terminación de la vigencia (Cláusula 13 — Terminación de la vigencia del Contrato):\n\n${STANLEY_CLAUSE_13_TERMINACION}`,
    citationSourceIds: ["src-009"],
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

export function isStanleyConversation(query: string, ctx: ChatContext): boolean {
  const cq = normalize(query);
  const sq = normalize(buildSearchText(query, ctx));
  if (cq.includes("acme")) return false;
  return cq.includes("stanley") || (sq.includes("stanley") && !sq.includes("acme"));
}

export function resolveStanleyContractId(ctx: ChatContext): string {
  const contract = ctx.corpus.contracts.find(
    (c) =>
      normalize(c.provider.name).includes("stanley") ||
      normalize(c.title).includes("stanley"),
  );
  return contract?.id ?? "ctr-006";
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

/**
 * Matcher determinista para el guion demo de Stanley (3 preguntas).
 * Requiere "stanley" en la pregunta actual o en mensajes previos del usuario.
 */
export function matchStanleyDemoQuestion(
  query: string,
  ctx: ChatContext,
): StanleyDemoQuestionId | null {
  if (!isStanleyConversation(query, ctx)) return null;

  const q = normalize(buildSearchText(query, ctx));

  const isRescision =
    q.includes("causales") ||
    q.includes("resci") ||
    q.includes("resision") ||
    q.includes("terminacion") ||
    q.includes("clausula 13");

  const isClausula9 =
    q.includes("clausula 9") ||
    q.includes("limitacion") ||
    q.includes("responsabilidad") ||
    q.includes("objecion") ||
    q.includes("desacuerdo") ||
    q.includes("de acuerdo") ||
    q.includes("por que") ||
    q.includes("porque") ||
    q.includes("no estan de acuerdo");

  const isEstado =
    q.includes("estado") ||
    q.includes("situacion") ||
    q.includes("como esta") ||
    q.includes("en que esta");

  if (isRescision) return "stanley-rescision";
  if (isClausula9 && !isRescision) return "stanley-clausula-9";
  if (isEstado) return "stanley-estado";

  return null;
}

export function tryStanleyDemoAnswer(query: string, ctx: ChatContext): ChatAnswer | null {
  const questionId = matchStanleyDemoQuestion(query, ctx);
  if (!questionId) return null;

  const scripted = STANLEY_RESPONSES[questionId];
  const text = typeof scripted.text === "function" ? scripted.text() : scripted.text;

  return {
    text,
    citations: resolveCitations(scripted.citationSourceIds, ctx),
    matchedContractIds: [resolveStanleyContractId(ctx)],
    intent: detectIntent(query, ctx.priorMessages),
  };
}
