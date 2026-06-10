import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import { detectIntent, finalizeAnswer, toCitation } from "./engine";

/** Guion demo Stanley — prioridad fija, se evalúa antes del matcher genérico */
export type StanleyDemoQuestionId =
  | "stanley-rescision"
  | "stanley-clausula-9"
  | "stanley-estado"
  | "stanley-cross-acme"
  | "stanley-redaccion";

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
      `El contrato dice lo siguiente sobre las causales de rescisión y terminación de la vigencia (Cláusula 13 — Terminación de la vigencia del Contrato):\n\nConsultá el borrador en el repositorio del contrato Stanley.`,
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
      "Propongo una redacción ampliada para la Cláusula 9 del contrato Stanley, incorporando el precedente de Acme. Podés aplicarla al borrador de trabajo local (acción simulada).",
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

function buildSearchText(query: string, ctx: ChatContext): string {
  const prior = ctx.priorMessages
    ?.filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.text)
    .join(" ");
  return prior ? `${prior} ${query}` : query;
}

export function isStanleyConversation(query: string, ctx: ChatContext): boolean {
  if (ctx.conversationType === "anchored" && ctx.focusContractId) {
    const focus = ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
    if (
      focus &&
      (normalize(focus.provider.name).includes("stanley") ||
        normalize(focus.title).includes("stanley"))
    ) {
      return true;
    }
  }

  const cq = normalize(query);
  const sq = normalize(buildSearchText(query, ctx));
  if (cq.includes("acme")) return false;
  return cq.includes("stanley") || (sq.includes("stanley") && !sq.includes("acme"));
}

export function resolveStanleyContractId(ctx: ChatContext): string {
  if (ctx.focusContractId) {
    const focus = ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
    if (focus) return focus.id;
  }
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
    .map(toCitation);
}

export function matchStanleyDemoQuestion(
  query: string,
  ctx: ChatContext,
): StanleyDemoQuestionId | null {
  if (!isStanleyConversation(query, ctx)) return null;

  const q = normalize(buildSearchText(query, ctx));

  const isRedaccion =
    q.includes("amplia") ||
    q.includes("ampliar") ||
    q.includes("redacta") ||
    q.includes("redactar") ||
    q.includes("nueva redaccion") ||
    q.includes("contrapropuesta");

  const isCrossAcme =
    q.includes("como en acme") ||
    q.includes("como se resolvio") ||
    q.includes("como resolvimos") ||
    q.includes("cómo se resolvió") ||
    q.includes("en acme") ||
    q.includes("con acme") ||
    q.includes("precedente");

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

  if (isRedaccion) return "stanley-redaccion";
  if (isCrossAcme && !isRedaccion) return "stanley-cross-acme";
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
        proposedText:
          "Limitación de responsabilidad (Cláusula 9 — redacción propuesta):\n\n" +
          "Salvo dolo o culpa grave, la responsabilidad total acumulada del Proveedor no excederá el veinte por ciento (20%) del fee anual del contrato. " +
          "Se excluyen expresamente lucro cesante e indirectos, salvo pérdida de datos personales por incumplimiento de medidas de seguridad acordadas.",
        basedOnContractIds: ["ctr-001"],
      },
    };
  }

  return base;
}
