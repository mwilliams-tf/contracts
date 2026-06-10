import type {
  ChatAnswer,
  ChatContext,
  ChatIntent,
  Citation,
  EnrichedContract,
  Source,
} from "../models";
import { formatDate } from "../lib/corpus";

const INTENT_KEYWORDS: Record<Exclude<ChatIntent, "general">, string[]> = {
  vencimiento: [
    "vence",
    "vencimiento",
    "expira",
    "renovación",
    "renovacion",
    "vigencia",
    "termina",
    "terminación",
    "terminacion",
    "finaliza",
    "finalización",
    "finalizacion",
    "fecha fin",
    "fecha de fin",
    "cuando acaba",
    "hasta cuando",
    "hasta cuándo",
    "plazo",
    "duración",
    "duracion",
    "cuanto dura",
    "cuánto dura",
    "2028",
  ],
  firmantes: ["firma", "firmante", "firmado", "firmantes", "apoderado", "apoderada"],
  clausula: ["cláusula", "clausula", "condición", "condicion", "penalidad", "clausulas"],
  partes: ["parte", "partes", "contraparte", "proveedor"],
  estado: [
    "estado",
    "situación",
    "situacion",
    "en qué está",
    "en que esta",
    "en que estado",
    "cómo está",
    "como esta",
  ],
};

function conversationContextText(priorMessages?: ChatContext["priorMessages"]): string {
  if (!priorMessages?.length) return "";
  return priorMessages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.text)
    .join(" ");
}

export function detectIntent(query: string, priorMessages?: ChatContext["priorMessages"]): ChatIntent {
  const context = conversationContextText(priorMessages);
  const q = `${context} ${query}`.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    Exclude<ChatIntent, "general">,
    string[],
  ][]) {
    if (keywords.some((kw) => q.includes(kw))) return intent;
  }
  return "general";
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function scoreContract(contract: EnrichedContract, query: string): number {
  const q = normalize(query);
  let score = 0;
  const fields = [
    contract.title,
    contract.provider.name,
    contract.service,
    contract.requestingArea,
    contract.id,
    ...contract.parties,
  ];
  for (const field of fields) {
    const n = normalize(field);
    if (!n) continue;
    if (q.includes(n)) {
      score += 5;
      continue;
    }
    for (const word of n.split(/[\s—–-]+/)) {
      if (word.length > 2 && q.includes(word)) score += 2;
    }
  }
  if (contract.state.active) score += 1;
  return score;
}

function buildSearchText(query: string, ctx: ChatContext): string {
  const prior = conversationContextText(ctx.priorMessages);
  return prior ? `${prior} ${query}` : query;
}

export function resolveContracts(ctx: ChatContext, query: string): EnrichedContract[] {
  const searchText = buildSearchText(query, ctx);
  const matches = matchContracts(ctx, searchText);
  if (matches.length > 0) return matches;
  return matchContracts(ctx, query);
}

export function matchContracts(ctx: ChatContext, query: string): EnrichedContract[] {
  const scored = ctx.corpus.contracts
    .map((c) => ({ contract: c, score: scoreContract(c, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];
  return scored.map((s) => s.contract);
}

export function filterContractsByProviderMention(
  contracts: EnrichedContract[],
  searchText: string,
): EnrichedContract[] {
  const q = normalize(searchText);
  if (q.includes("stanley")) {
    const stanley = contracts.filter(
      (c) =>
        normalize(c.provider.name).includes("stanley") ||
        normalize(c.title).includes("stanley"),
    );
    if (stanley.length > 0) return stanley;
  }
  if (q.includes("acme")) {
    const acme = contracts.filter(
      (c) =>
        normalize(c.provider.name).includes("acme") || normalize(c.title).includes("acme"),
    );
    if (acme.length > 0) return acme;
  }
  return contracts;
}

function sourcesByRecency(sources: Source[]): Source[] {
  return [...sources].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function toCitation(source: Source): Citation {
  return {
    sourceId: source.id,
    contractId: source.contractId,
    sender: source.sender,
    date: source.date,
    subject: source.subject,
    simulatedLink: source.simulatedLink,
  };
}

export function defaultPrincipalId(
  ctx: ChatContext,
  matchedContractIds: string[],
): string | null {
  if (ctx.conversationType === "anchored" && ctx.focusContractId) {
    return ctx.focusContractId;
  }
  if (matchedContractIds.length === 1) return matchedContractIds[0];
  return null;
}

export function finalizeAnswer(
  partial: Omit<ChatAnswer, "principalContractId" | "referencedContractIds"> &
    Partial<Pick<ChatAnswer, "principalContractId" | "referencedContractIds">>,
  ctx: ChatContext,
): ChatAnswer {
  const principal =
    partial.principalContractId !== undefined
      ? partial.principalContractId
      : defaultPrincipalId(ctx, partial.matchedContractIds);

  const referenced =
    partial.referencedContractIds ??
    partial.matchedContractIds.filter((id) => id !== principal);

  return {
    ...partial,
    principalContractId: principal,
    referencedContractIds: referenced,
    citations: partial.citations.map((c) =>
      c.contractId ? c : { ...c, contractId: partial.matchedContractIds[0] ?? "" },
    ),
  };
}

function buildVencimientoAnswer(
  contract: EnrichedContract,
  sources: Source[],
  ctx: ChatContext,
): ChatAnswer {
  const sorted = sourcesByRecency(sources);
  const latest = sorted[0];

  if (latest) {
    return finalizeAnswer(
      {
        text: `El contrato "${contract.title}" con ${contract.provider.name} vence el ${formatDate(contract.expirationDate)}. Según la fuente más reciente (${formatDate(latest.date)}, ${latest.sender}): ${latest.excerpt}`,
        citations: [toCitation(latest)],
        matchedContractIds: [contract.id],
        intent: "vencimiento",
      },
      ctx,
    );
  }

  if (contract.expirationDate) {
    return finalizeAnswer(
      {
        text: `El contrato "${contract.title}" tiene fecha de vencimiento registrada: ${formatDate(contract.expirationDate)}. No encontré una fuente documental adicional que respalde este dato.`,
        citations: [],
        matchedContractIds: [contract.id],
        intent: "vencimiento",
      },
      ctx,
    );
  }

  return finalizeAnswer(
    {
      text: `No encontré información de vencimiento para el contrato "${contract.title}". No hay respaldo documental disponible en el corpus.`,
      citations: [],
      matchedContractIds: [contract.id],
      intent: "vencimiento",
    },
    ctx,
  );
}

function buildFirmantesAnswer(
  contract: EnrichedContract,
  sources: Source[],
  ctx: ChatContext,
): ChatAnswer {
  const sorted = sourcesByRecency(sources);
  const pending = contract.signatories.filter((s) => !s.signed);
  const signed = contract.signatories.filter((s) => s.signed);

  let text = `Firmantes del contrato "${contract.title}": `;
  if (contract.signatories.length === 0) {
    text += "no hay firmantes registrados en el sistema.";
  } else {
    const parts: string[] = [];
    if (signed.length) {
      parts.push(
        `firmados: ${signed.map((s) => `${s.name} (${s.role})`).join(", ")}`,
      );
    }
    if (pending.length) {
      parts.push(
        `pendientes: ${pending.map((s) => `${s.name} (${s.role})`).join(", ")}`,
      );
    }
    text += parts.join("; ") + ".";
  }

  const citations: Citation[] = [];
  const firmanteSource = sorted.find(
    (s) =>
      normalize(s.excerpt).includes("firma") ||
      normalize(s.subject).includes("firma"),
  );
  if (firmanteSource) {
    text += ` Fuente más reciente: ${firmanteSource.excerpt}`;
    citations.push(toCitation(firmanteSource));
  } else if (sorted.length > 0) {
    citations.push(toCitation(sorted[0]));
  }

  return finalizeAnswer(
    {
      text,
      citations,
      matchedContractIds: [contract.id],
      intent: "firmantes",
    },
    ctx,
  );
}

function buildClausulaAnswer(
  contract: EnrichedContract,
  sources: Source[],
  ctx: ChatContext,
): ChatAnswer {
  const sorted = sourcesByRecency(sources);
  const clausulaSource = sorted.find(
    (s) =>
      normalize(s.excerpt).includes("clausula") ||
      normalize(s.excerpt).includes("penalidad") ||
      normalize(s.subject).includes("clausula"),
  );

  if (clausulaSource) {
    return finalizeAnswer(
      {
        text: `Sobre el contrato "${contract.title}": ${clausulaSource.excerpt}`,
        citations: [toCitation(clausulaSource)],
        matchedContractIds: [contract.id],
        intent: "clausula",
      },
      ctx,
    );
  }

  return finalizeAnswer(
    {
      text: `No encontré una cláusula específica citada en las fuentes del contrato "${contract.title}". Podés consultar los documentos asociados en el detalle del contrato.`,
      citations: [],
      matchedContractIds: [contract.id],
      intent: "clausula",
    },
    ctx,
  );
}

function buildPartesAnswer(contract: EnrichedContract, ctx: ChatContext): ChatAnswer {
  return finalizeAnswer(
    {
      text: `Las partes del contrato "${contract.title}" son: ${contract.parties.join(" y ")}. El proveedor es ${contract.provider.name} (${contract.provider.service}).`,
      citations: [],
      matchedContractIds: [contract.id],
      intent: "partes",
    },
    ctx,
  );
}

function buildEstadoAnswer(
  contract: EnrichedContract,
  sources: Source[],
  ctx: ChatContext,
): ChatAnswer {
  const sorted = sourcesByRecency(sources);
  const latestHistory = contract.stateHistory[contract.stateHistory.length - 1];

  let text = `El contrato "${contract.title}" se encuentra en estado "${contract.state.name}".`;
  if (latestHistory?.note) {
    text += ` Última observación: ${latestHistory.note}.`;
  }

  const citations: Citation[] = sorted.length ? [toCitation(sorted[0])] : [];

  return finalizeAnswer(
    {
      text,
      citations,
      matchedContractIds: [contract.id],
      intent: "estado",
    },
    ctx,
  );
}

function buildGeneralAnswer(
  contract: EnrichedContract,
  sources: Source[],
  ctx: ChatContext,
): ChatAnswer {
  const sorted = sourcesByRecency(sources);
  const citation = sorted[0];
  const latestHistory = contract.stateHistory[contract.stateHistory.length - 1];

  const parts = [
    `Información sobre "${contract.title}" (${contract.provider.name}):`,
    `estado ${contract.state.name},`,
    `servicio ${contract.service},`,
    `área solicitante ${contract.requestingArea}.`,
    `Inicio: ${formatDate(contract.startDate)}.`,
    contract.expirationDate
      ? `Vencimiento: ${formatDate(contract.expirationDate)}.`
      : "Sin fecha de vencimiento registrada en el sistema.",
    latestHistory?.note ? `Observación: ${latestHistory.note}.` : null,
    citation ? `Referencia: ${citation.excerpt}` : null,
  ].filter(Boolean);

  return finalizeAnswer(
    {
      text: parts.join(" "),
      citations: citation ? [toCitation(citation)] : [],
      matchedContractIds: [contract.id],
      intent: "general",
    },
    ctx,
  );
}

/** Resuelve follow-ups como "¿y los firmantes?" usando foco + memoria de hilo */
export function resolveFollowUpContract(
  ctx: ChatContext,
  query: string,
): EnrichedContract | undefined {
  const q = normalize(query);
  const isFollowUp =
    q.includes("y los firmantes") ||
    q.includes("y el firmante") ||
    q.includes("esa clausula") ||
    q.includes("esa cláusula") ||
    q.startsWith("y ") ||
    q.includes("los firmantes");

  if (!isFollowUp) return undefined;

  if (ctx.focusContractId) {
    return ctx.corpus.contracts.find((c) => c.id === ctx.focusContractId);
  }

  const priorAssistant = [...(ctx.priorMessages ?? [])]
    .reverse()
    .find((m) => m.role === "assistant" && m.principalContractId);
  if (priorAssistant?.principalContractId) {
    return ctx.corpus.contracts.find((c) => c.id === priorAssistant.principalContractId);
  }

  return undefined;
}

export function answer(query: string, ctx: ChatContext): ChatAnswer {
  const intent = detectIntent(query, ctx.priorMessages);
  const followUpContract = resolveFollowUpContract(ctx, query);

  if (followUpContract && (intent === "firmantes" || normalize(query).includes("firmante"))) {
    return buildFirmantesAnswer(followUpContract, followUpContract.sources, ctx);
  }

  const searchText = buildSearchText(query, ctx);
  const matches = filterContractsByProviderMention(resolveContracts(ctx, query), searchText);

  if (matches.length === 0) {
    return finalizeAnswer(
      {
        text: "No encontré información sobre ese tema en el corpus de contratos ficticios. Probá mencionar el nombre del proveedor o del servicio.",
        citations: [],
        matchedContractIds: [],
        intent,
        principalContractId: null,
        referencedContractIds: [],
      },
      ctx,
    );
  }

  const contract = matches[0];
  const sources = contract.sources;

  switch (intent) {
    case "vencimiento":
      return buildVencimientoAnswer(contract, sources, ctx);
    case "firmantes":
      return buildFirmantesAnswer(contract, sources, ctx);
    case "clausula":
      return buildClausulaAnswer(contract, sources, ctx);
    case "partes":
      return buildPartesAnswer(contract, ctx);
    case "estado":
      return buildEstadoAnswer(contract, sources, ctx);
    default:
      return buildGeneralAnswer(contract, sources, ctx);
  }
}

/** Portfolio: contratos que vencen en un año dado */
export function answerPortfolioExpiration(
  year: string,
  ctx: ChatContext,
): ChatAnswer | null {
  const matches = ctx.corpus.contracts.filter((c) =>
    c.expirationDate?.startsWith(`${year}-`),
  );

  if (matches.length === 0) return null;

  const lines = matches.map((c) => {
    const citation = sourcesByRecency(c.sources)[0];
    const cite = citation
      ? ` (fuente: ${citation.sender}, ${formatDate(citation.date)})`
      : "";
    return `• ${c.title} (${c.provider.name}) — vence ${formatDate(c.expirationDate)}${cite}`;
  });

  const citations = matches
    .map((c) => sourcesByRecency(c.sources)[0])
    .filter((s): s is Source => Boolean(s))
    .map(toCitation);

  return finalizeAnswer(
    {
      text: `Encontré ${matches.length} contrato${matches.length === 1 ? "" : "s"} con vencimiento en ${year}:\n\n${lines.join("\n")}`,
      citations,
      matchedContractIds: matches.map((c) => c.id),
      intent: "vencimiento",
      principalContractId: null,
      referencedContractIds: matches.map((c) => c.id),
    },
    ctx,
  );
}
