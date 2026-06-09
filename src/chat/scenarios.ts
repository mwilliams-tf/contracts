import scenariosData from "../data/chat-scenarios.json";
import { STANLEY_CLAUSE_13_TERMINACION } from "../data/stanley-clause-13";
import type { ChatAnswer, ChatContext, Citation, Source } from "../models";
import { answer, detectIntent, filterContractsByProviderMention, resolveContracts } from "./engine";
import { tryAcmeDemoAnswer, isAcmeConversation, resolveAcmeContractId } from "./acme-demo";
import { tryStanleyDemoAnswer, resolveStanleyContractId, isStanleyConversation } from "./stanley-demo";

interface ScenarioMatch {
  anyKeywords?: string[];
  allKeywords?: string[];
  minKeywordHits?: number;
}

interface ScenarioResponse {
  text?: string;
  textTemplate?: string;
  citationSourceIds?: string[];
}

interface ChatScenario {
  id: string;
  contractIds?: string[];
  match: ScenarioMatch;
  response: ScenarioResponse;
}

interface ScenariosFile {
  fallback: { text: string };
  scenarios: ChatScenario[];
}

const { fallback, scenarios } = scenariosData as ScenariosFile;

const SCENARIO_TEXT_TEMPLATES: Record<string, () => string> = {
  "stanley-clause-13-rescision": () =>
    `El contrato dice lo siguiente sobre las causales de rescisión y terminación de la vigencia (Cláusula 13 — Terminación de la vigencia del Contrato):\n\n${STANLEY_CLAUSE_13_TERMINACION}`,
};

function resolveScenarioText(scenario: ChatScenario): string {
  if (scenario.response.textTemplate) {
    const builder = SCENARIO_TEXT_TEMPLATES[scenario.response.textTemplate];
    if (builder) return builder();
  }
  return scenario.response.text ?? fallback.text;
}

const MIN_SCORE = 4;

const SCENARIO_PROVIDER_HINTS: Record<string, string[]> = {
  "ctr-006": ["stanley"],
  "ctr-001": ["acme"],
};

function getProviderHints(contractIds?: string[]): string[] {
  if (!contractIds?.length) return [];
  for (const id of contractIds) {
    const hints = SCENARIO_PROVIDER_HINTS[id];
    if (hints) return hints;
  }
  return [];
}

function mentionsProvider(searchText: string, hints: string[]): boolean {
  const q = normalize(searchText);
  return hints.some((hint) => q.includes(hint));
}

function contractMatchesScenario(
  contractId: string,
  scenario: ChatScenario,
  ctx: ChatContext,
): boolean {
  if (scenario.contractIds?.includes(contractId)) return true;
  const contract = ctx.corpus.contracts.find((c) => c.id === contractId);
  if (!contract) return false;
  const hints = getProviderHints(scenario.contractIds);
  if (!hints.length) return false;
  const provider = normalize(contract.provider.name);
  const title = normalize(contract.title);
  return hints.some((hint) => provider.includes(hint) || title.includes(hint));
}

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

function sourceToCitation(source: Source): Citation {
  return {
    sourceId: source.id,
    sender: source.sender,
    date: source.date,
    subject: source.subject,
    simulatedLink: source.simulatedLink,
  };
}

function resolveCitations(sourceIds: string[] | undefined, ctx: ChatContext): Citation[] {
  if (!sourceIds?.length) return [];
  return sourceIds
    .map((id) => ctx.corpus.sources.find((s) => s.id === id))
    .filter((s): s is Source => Boolean(s))
    .map(sourceToCitation);
}

function scoreScenario(
  scenario: ChatScenario,
  searchText: string,
  matchedContractIds: string[],
  ctx: ChatContext,
): number {
  const q = normalize(searchText);
  const providerHints = getProviderHints(scenario.contractIds);

  if (providerHints.length > 0) {
    if (!mentionsProvider(searchText, providerHints)) return 0;
    if (providerHints.includes("stanley") && q.includes("acme")) return 0;
    if (providerHints.includes("acme") && q.includes("stanley")) return 0;
  }

  let score = 0;

  if (scenario.contractIds?.length) {
    const contractHit = matchedContractIds.some((id) =>
      contractMatchesScenario(id, scenario, ctx),
    );
    if (contractHit) score += 5;
  }

  const any = scenario.match.anyKeywords ?? [];
  const hits = any.filter((kw) => q.includes(normalize(kw))).length;
  let minHits = scenario.match.minKeywordHits ?? 1;
  if (providerHints.length > 0 && mentionsProvider(searchText, providerHints)) {
    minHits = 1;
  }
  if (hits < minHits) return 0;
  score += hits * 3;

  const all = scenario.match.allKeywords ?? [];
  if (all.some((kw) => !q.includes(normalize(kw)))) return 0;
  score += all.length * 4;

  return score;
}

function findMatchingContractId(
  hints: string[],
  matchedContractIds: string[],
  ctx: ChatContext,
): string | undefined {
  return matchedContractIds.find((id) => {
    const contract = ctx.corpus.contracts.find((c) => c.id === id);
    if (!contract) return false;
    const provider = normalize(contract.provider.name);
    const title = normalize(contract.title);
    return hints.some((hint) => provider.includes(hint) || title.includes(hint));
  });
}

function resolveScenarioContractId(
  scenario: ChatScenario,
  ctx: ChatContext,
  matchedContractIds: string[],
): string | undefined {
  const preferred = scenario.contractIds?.[0];
  if (preferred && matchedContractIds.includes(preferred)) return preferred;

  const hints = getProviderHints(scenario.contractIds);
  if (hints.length > 0) {
    const dynamicMatch = findMatchingContractId(hints, matchedContractIds, ctx);
    if (dynamicMatch) return dynamicMatch;

    const fromCorpus = ctx.corpus.contracts.find((contract) => {
      const provider = normalize(contract.provider.name);
      const title = normalize(contract.title);
      return hints.some((hint) => provider.includes(hint) || title.includes(hint));
    });
    if (fromCorpus) return fromCorpus.id;
  }

  return scenario.contractIds?.find((id) => matchedContractIds.includes(id)) ?? preferred;
}

function buildScenarioAnswer(
  scenario: ChatScenario,
  ctx: ChatContext,
  query: string,
  matchedContractIds: string[],
): ChatAnswer {
  const contractId = resolveScenarioContractId(scenario, ctx, matchedContractIds);

  return {
    text: resolveScenarioText(scenario),
    citations: resolveCitations(scenario.response.citationSourceIds, ctx),
    matchedContractIds: contractId ? [contractId] : [],
    intent: detectIntent(query, ctx.priorMessages),
  };
}

/** Motor de chat demo: respuestas guionadas desde JSON + fallback al motor CLM */
export function answerFromScenarios(query: string, ctx: ChatContext): ChatAnswer {
  const searchText = buildSearchText(query, ctx);
  const cq = normalize(query);

  // Demo hardcodeado: gana el proveedor explícito en la pregunta actual
  if (cq.includes("acme")) {
    const acmeAnswer = tryAcmeDemoAnswer(query, ctx);
    if (acmeAnswer) return acmeAnswer;
  } else if (cq.includes("stanley")) {
    const stanleyAnswer = tryStanleyDemoAnswer(query, ctx);
    if (stanleyAnswer) return stanleyAnswer;
  } else {
    if (isAcmeConversation(query, ctx)) {
      const acmeAnswer = tryAcmeDemoAnswer(query, ctx);
      if (acmeAnswer) return acmeAnswer;
    }
    if (isStanleyConversation(query, ctx)) {
      const stanleyAnswer = tryStanleyDemoAnswer(query, ctx);
      if (stanleyAnswer) return stanleyAnswer;
    }
  }

  const matched = filterContractsByProviderMention(resolveContracts(ctx, searchText), searchText);
  const matchedIds = matched.map((c) => c.id);

  let best: ChatScenario | null = null;
  let bestScore = 0;

  for (const scenario of scenarios) {
    const score = scoreScenario(scenario, searchText, matchedIds, ctx);
    if (score > bestScore) {
      bestScore = score;
      best = scenario;
    }
  }

  if (best && bestScore >= MIN_SCORE) {
    return buildScenarioAnswer(best, ctx, query, matchedIds);
  }

  if (isStanleyConversation(query, ctx)) {
    return {
      text: fallback.text,
      citations: [],
      matchedContractIds: [resolveStanleyContractId(ctx)],
      intent: detectIntent(query, ctx.priorMessages),
    };
  }

  if (isAcmeConversation(query, ctx)) {
    return {
      text: fallback.text,
      citations: [],
      matchedContractIds: [resolveAcmeContractId(ctx)],
      intent: detectIntent(query, ctx.priorMessages),
    };
  }

  const engineAnswer = answer(query, ctx);
  if (engineAnswer.matchedContractIds.length > 0) {
    return engineAnswer;
  }

  return {
    text: fallback.text,
    citations: [],
    matchedContractIds: [],
    intent: detectIntent(query, ctx.priorMessages),
  };
}
