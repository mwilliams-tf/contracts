import { STANLEY_CLAUSE_13_TERMINACION } from "../data/stanley-clause-13";
import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import {
  isStanleyAnchored,
  isStanleyConversation,
  threadMentionsClausula9,
} from "./conversation-context";
import { detectIntent, finalizeAnswer, toCitation } from "./engine";

/** Guion demo Stanley — prioridad fija, se evalúa antes del matcher genérico */
export type StanleyDemoQuestionId =
  | "stanley-rescision"
  | "stanley-clausula-9"
  | "stanley-estado"
  | "stanley-cross-acme"
  | "stanley-redaccion";

const STANLEY_DRAFT_TEXT =
  "Limitación de responsabilidad (Cláusula 9 — redacción propuesta):\n\n" +
  "Salvo dolo o culpa grave, la responsabilidad total acumulada del Proveedor no excederá el veinte por ciento (20%) del fee anual del contrato. " +
  "Se excluyen expresamente lucro cesante e indirectos, salvo pérdida de datos personales por incumplimiento de medidas de seguridad acordadas. " +
  "El Proveedor mantendrá cobertura de seguro de responsabilidad civil por un monto no inferior al fee anual. " +
  "Esta redacción incorpora el precedente de negociación del contrato Acme (priorización de fuente reciente y carve-out para datos personales).";

const STANLEY_RESPONSES: Record<
  StanleyDemoQuestionId,
  {
    text: string | (() => string);
    citationSourceIds: string[];
    referencedContractIds?: string[];
    proposedDraft?: boolean;
  }
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
  "stanley-cross-acme": {
    text:
      "Sobre el contrato principal Stanley, traigo el precedente de Acme:\n\nEn Acme resolvimos el conflicto de vencimiento priorizando la fuente más reciente (01/03/2027 prevalece). Para la cláusula 9, recomiendo aplicar el mismo criterio de negociación: subir el tope de responsabilidad y acotar exclusiones, inspirándose en cómo cerramos el expediente Acme con firma del Banco pendiente (María López).",
    citationSourceIds: ["src-007", "src-002"],
    referencedContractIds: ["ctr-001"],
  },
  "stanley-redaccion": {
    text:
      "Propongo una redacción ampliada para la Cláusula 9 del contrato Stanley, incorporando el precedente de Acme. Podés aplicarla al documento con control de cambios habilitado.",
    citationSourceIds: ["src-007"],
    proposedDraft: true,
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export { isStanleyConversation, isStanleyAnchored };

export function resolveStanleyContractId(ctx: ChatContext): string {
  if (ctx.focusContractId) {
    const focus = ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
    if (focus) return focus.id;
    if (isStanleyAnchored(ctx)) return ctx.focusContractId;
  }
  const contract = ctx.corpus.contracts.find(
    (c) =>
      normalize(c.provider.name).includes("stanley") ||
      normalize(c.title).includes("stanley"),
  );
  return contract?.id ?? "ctr-006";
}

export function resolveStanleyTitle(ctx: ChatContext): string {
  const id = resolveStanleyContractId(ctx);
  return ctx.corpus.contracts.find((c) => c.id === id)?.title ?? "Contrato Servicios IT — Stanley";
}

function resolveCitations(sourceIds: string[], ctx: ChatContext): Citation[] {
  return sourceIds
    .map((id) => ctx.corpus.sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s))
    .map(toCitation);
}

function isRedactionRequest(query: string, ctx: ChatContext): boolean {
  const cq = normalize(query);
  return (
    cq.includes("amplia") ||
    cq.includes("ampliar") ||
    cq.includes("redacta") ||
    cq.includes("redactar") ||
    cq.includes("nueva redaccion") ||
    cq.includes("contrapropuesta") ||
    cq.includes("solucion") ||
    cq.includes("propones") ||
    cq.includes("propone") ||
    cq.includes("propuesta") ||
    (cq.includes("esa clausula") && threadMentionsClausula9(ctx))
  );
}

function isCrossAcmeRequest(query: string): boolean {
  const cq = normalize(query);
  return (
    cq.includes("como en acme") ||
    cq.includes("como se resolvio") ||
    cq.includes("como resolvimos") ||
    cq.includes("cómo se resolvió") ||
    cq.includes("cómo resolvimos") ||
    cq.includes("precedente") ||
    cq.includes("comparar") ||
    cq.includes("en acme") ||
    cq.includes("con acme")
  );
}

export function matchStanleyDemoQuestion(
  query: string,
  ctx: ChatContext,
): StanleyDemoQuestionId | null {
  if (!isStanleyConversation(query, ctx)) return null;

  const cq = normalize(query);

  const isRescision =
    cq.includes("causales") ||
    cq.includes("resci") ||
    cq.includes("resision") ||
    cq.includes("terminacion") ||
    cq.includes("clausula 13");

  const isClausula9 =
    cq.includes("clausula 9") ||
    cq.includes("limitacion") ||
    cq.includes("responsabilidad") ||
    cq.includes("objecion") ||
    cq.includes("desacuerdo") ||
    cq.includes("de acuerdo") ||
    cq.includes("por que") ||
    cq.includes("porque") ||
    cq.includes("no estan de acuerdo");

  const isEstado =
    cq.includes("estado") ||
    cq.includes("situacion") ||
    cq.includes("como esta") ||
    cq.includes("en que esta");

  if (isRedactionRequest(query, ctx)) return "stanley-redaccion";
  if (isCrossAcmeRequest(query)) return "stanley-cross-acme";
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
  const stanleyId = resolveStanleyContractId(ctx);

  const base = finalizeAnswer(
    {
      text,
      citations: resolveCitations(scripted.citationSourceIds, ctx),
      matchedContractIds: [stanleyId, ...(scripted.referencedContractIds ?? [])],
      intent: detectIntent(query, ctx.priorMessages),
      principalContractId: stanleyId,
      referencedContractIds: scripted.referencedContractIds ?? [],
    },
    ctx,
  );

  if (scripted.proposedDraft) {
    return {
      ...base,
      proposedDraft: {
        contractId: stanleyId,
        clauseRef: "Cláusula 9",
        proposedText: STANLEY_DRAFT_TEXT,
        basedOnContractIds: ["ctr-001"],
      },
    };
  }

  return base;
}
