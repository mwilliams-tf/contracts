export type DocumentOrigin = "PlantillaPropia" | "ModeloDelProveedor";
export type UserRole = "abogada" | "solicitante" | "proveedor";
export type SourceKind = "mail" | "documento" | "nota";
export type ChatIntent =
  | "vencimiento"
  | "firmantes"
  | "clausula"
  | "partes"
  | "estado"
  | "general";

export interface Signatory {
  name: string;
  role: string;
  signed: boolean;
}

export interface StateHistoryEntry {
  stateId: string;
  date: string;
  note?: string;
}

export interface Contract {
  id: string;
  title: string;
  service: string;
  providerId: string;
  requestingArea: string;
  stateId: string;
  documentOrigin: DocumentOrigin;
  parties: string[];
  signatories: Signatory[];
  startDate: string;
  signatureDate: string | null;
  expirationDate: string | null;
  documentIds: string[];
  sourceIds: string[];
  stateHistory: StateHistoryEntry[];
}

export interface Provider {
  id: string;
  name: string;
  taxId: string;
  service: string;
}

export interface Document {
  id: string;
  contractId: string;
  title: string;
  type: string;
  date: string;
  simulatedLink: string;
}

export interface Source {
  id: string;
  contractId: string;
  kind: SourceKind;
  sender: string;
  date: string;
  subject: string;
  excerpt: string;
  simulatedLink: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  area: string;
  providerId?: string;
}

export interface WorkflowNotification {
  id: string;
  contractId: string;
  contractTitle: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ContractWorkflowOverride {
  contractId: string;
  stateId: string;
  stateHistory: StateHistoryEntry[];
  signatureDate: string | null;
}

export interface Citation {
  sourceId: string;
  sender: string;
  date: string;
  subject: string;
  simulatedLink: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  timestamp: string;
}

export interface Conversation {
  userId: string;
  messages: ChatMessage[];
}

export interface WorkflowState {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

export interface EnrichedContract extends Contract {
  provider: Provider;
  state: WorkflowState;
  documents: Document[];
  sources: Source[];
}

export interface Corpus {
  contracts: EnrichedContract[];
  providers: Provider[];
  documents: Document[];
  sources: Source[];
  users: User[];
  workflowStates: WorkflowState[];
}

export interface ChatAnswer {
  text: string;
  citations: Citation[];
  matchedContractIds: string[];
  intent: ChatIntent;
}

export interface ChatContext {
  corpus: Corpus;
  userId: string;
  /** Mensajes anteriores en la conversación (para follow-ups) */
  priorMessages?: ChatMessage[];
}

export interface StoredRequest {
  id: string;
  title: string;
  service: string;
  providerName: string;
  requestingArea: string;
  documentOrigin: DocumentOrigin;
  createdAt: string;
  applicantName: string;
  businessApprover: string;
  providerTaxId: string;
  legalRepresentative: string;
  contactEmail: string;
  costCenter?: string;
  serviceSubtype?: string;
  monthlyAmount?: string;
  requiresNda?: boolean;
  totalAmount?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  uploadedFileName?: string;
}
