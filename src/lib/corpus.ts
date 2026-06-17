import contractsData from "../data/contracts.json";
import providersData from "../data/providers.json";
import documentsData from "../data/documents.json";
import sourcesData from "../data/sources.json";
import usersData from "../data/users.json";
import workflowStatesData from "../data/workflow-states.json";
import type {
  Contract,
  Corpus,
  Document,
  EnrichedContract,
  Provider,
  Source,
  User,
  WorkflowState,
} from "../models";
import { loadStoredRequests } from "./requests";
import { applyOverrideToContract } from "./workflow-storage";

/** Pool ficticio: mails y documentos demo de Stanley sin contrato precargado */
const STANLEY_DEMO_POOL_ID = "ctr-006";

function isStanleyProvider(provider: Provider): boolean {
  return provider.name.toLowerCase().includes("stanley");
}

function mergeById<T extends { id: string }>(primary: T[], extra: T[]): T[] {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...extra.filter((item) => !seen.has(item.id))];
}

function enrichContracts(
  contracts: Contract[],
  providers: Provider[],
  states: WorkflowState[],
  documents: Document[],
  sources: Source[],
): EnrichedContract[] {
  return contracts.map((contract) => {
    const provider = providers.find((p) => p.id === contract.providerId);
    const state = states.find((s) => s.id === contract.stateId);
    if (!provider || !state) {
      throw new Error(`FK no resuelta para contrato ${contract.id}`);
    }
    return {
      ...contract,
      provider,
      state,
      documents: isStanleyProvider(provider)
        ? mergeById(
            documents.filter((d) => d.contractId === contract.id),
            documents.filter((d) => d.contractId === STANLEY_DEMO_POOL_ID),
          )
        : documents.filter((d) => d.contractId === contract.id),
      sources: isStanleyProvider(provider)
        ? mergeById(
            sources.filter((s) => s.contractId === contract.id),
            sources.filter((s) => s.contractId === STANLEY_DEMO_POOL_ID),
          )
        : sources.filter((s) => s.contractId === contract.id),
    };
  });
}

function storedRequestsToContracts(
  providers: Provider[],
  states: WorkflowState[],
): Contract[] {
  const solicitado = states.find((s) => s.id === "st-solicitado");
  if (!solicitado) return [];

  return loadStoredRequests().map((req, index) => {
    const providerId =
      providers.find((p) =>
        p.name.toLowerCase().includes(req.providerName.toLowerCase()),
      )?.id ?? `prov-req-${index}`;

    let note: string;
    if (req.documentOrigin === "PlantillaPropia") {
      if (req.generatedDraftName && req.templateFileName) {
        note = `Borrador generado desde ${req.templateFileName} — ${req.applicantName ?? "Solicitante"}`;
      } else if (req.uploadedFileName) {
        note = `Plantilla adjunta — ${req.uploadedFileName}`;
      } else {
        note = `Borrador generado — ${req.applicantName ?? "Solicitante"}`;
      }
      if (req.observations?.trim()) {
        note += `. Observaciones del solicitante: ${req.observations.trim()}`;
      }
    } else {
      note = req.uploadedFileName
        ? `Enviado a revisión legal — ${req.uploadedFileName}`
        : "Solicitud creada en prototipo";
    }

    return {
      id: req.id,
      title: req.title,
      service: req.service,
      providerId,
      requestingArea: req.requestingArea,
      stateId: "st-solicitado",
      documentOrigin: req.documentOrigin,
      parties: ["Banco XYZ", req.providerName],
      signatories: [],
      startDate: req.startDate ?? req.createdAt,
      signatureDate: null,
      expirationDate: req.endDate ?? null,
      documentIds: [],
      sourceIds: [],
      stateHistory: [
        { stateId: "st-solicitado", date: req.createdAt, note },
      ],
    };
  });
}

export function loadCorpus(): Corpus {
  const providers = providersData as Provider[];
  const workflowStates = workflowStatesData as WorkflowState[];
  const documents = documentsData as Document[];
  const sources = sourcesData as Source[];
  const users = usersData as User[];

  const baseContracts = contractsData as Contract[];
  const requestContracts = storedRequestsToContracts(providers, workflowStates);

  const extraProviders = requestContracts
    .filter((c) => !providers.some((p) => p.id === c.providerId))
    .map((c, i) => ({
      id: c.providerId,
      name: c.parties[1] ?? `Proveedor ${i + 1}`,
      taxId: "00-00000000-0",
      service: c.service,
    }));

  const allProviders = [...providers, ...extraProviders];
  const allContracts = [...baseContracts, ...requestContracts].map(
    applyOverrideToContract,
  );

  const contracts = enrichContracts(
    allContracts,
    allProviders,
    workflowStates,
    documents,
    sources,
  );

  return {
    contracts,
    providers: allProviders,
    documents,
    sources,
    users,
    workflowStates,
  };
}

export function getContractById(corpus: Corpus, id: string): EnrichedContract | undefined {
  return corpus.contracts.find((c) => c.id === id);
}

export function isExpired(expirationDate: string | null): boolean {
  if (!expirationDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expirationDate) < today;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function documentOriginLabel(origin: EnrichedContract["documentOrigin"]): string {
  return origin === "PlantillaPropia" ? "Plantilla Propia" : "Modelo del Proveedor";
}
