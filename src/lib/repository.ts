import type { EnrichedContract } from "../models";
import { formatContractCode } from "./contract-display";
import type { StoredContractDocumentMeta } from "./document-store";
import type { WorkflowDocumentMeta } from "./workflow-documents";

export type RepositoryEntryType = "folder" | "pdf" | "docx" | "other";

export interface RepositoryEntry {
  id: string;
  name: string;
  entryType: RepositoryEntryType;
  modifiedDate: string;
  size: string | null;
  simulatedLink?: string;
  /** Descarga real desde IndexedDB (solicitudes con adjunto) */
  contractDocument?: boolean;
  /** Descarga real — adjunto de workflow (objeción/cambio) */
  workflowDocumentId?: string;
}

function fileTypeFromName(name: string): RepositoryEntryType {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  return "other";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadedDocumentToEntry(
  doc: StoredContractDocumentMeta,
  contract: EnrichedContract,
): RepositoryEntry {
  const code = formatContractCode(contract.id);
  return {
    id: `upload-${contract.id}`,
    name: doc.fileName || `${code}_Adjunto`,
    entryType: fileTypeFromName(doc.fileName),
    modifiedDate: doc.uploadedAt,
    size: formatSize(doc.size),
    contractDocument: true,
  };
}

export function workflowDocumentToEntry(doc: WorkflowDocumentMeta): RepositoryEntry {
  return {
    id: doc.id,
    name: doc.fileName,
    entryType: fileTypeFromName(doc.fileName),
    modifiedDate: doc.uploadedAt,
    size: formatSize(doc.size),
    workflowDocumentId: doc.id,
  };
}

export function getContractRepositoryEntries(
  contract: EnrichedContract,
  uploadedDoc?: StoredContractDocumentMeta | null,
  generatedDraftName?: string | null,
  workflowDocuments?: WorkflowDocumentMeta[],
): RepositoryEntry[] {
  const code = formatContractCode(contract.id);
  const entries: RepositoryEntry[] = [
    {
      id: "folder-anexos",
      name: "Anexos",
      entryType: "folder",
      modifiedDate: contract.startDate,
      size: null,
    },
    {
      id: "folder-correos",
      name: "Correos y notas",
      entryType: "folder",
      modifiedDate:
        contract.stateHistory[contract.stateHistory.length - 1]?.date ?? contract.startDate,
      size: null,
    },
  ];

  contract.documents.forEach((doc, index) => {
    const ext = doc.type === "Contrato" ? "docx" : "pdf";
    entries.push({
      id: doc.id,
      name: `${code}_${doc.title.replace(/\s+/g, "_")}.${ext}`,
      entryType: fileTypeFromName(ext),
      modifiedDate: doc.date,
      size: formatSize(180_000 + index * 42_000),
      simulatedLink: doc.simulatedLink,
    });
  });

  if (uploadedDoc) {
    entries.push(uploadedDocumentToEntry(uploadedDoc, contract));
  } else if (contract.documents.length === 0) {
    entries.push({
      id: "mock-borrador",
      name: generatedDraftName ?? `${code}_Borrador.docx`,
      entryType: "docx",
      modifiedDate: contract.startDate,
      size: formatSize(245_000),
      simulatedLink: `#/sim/repo/${contract.id}/borrador`,
    });
  }

  workflowDocuments?.forEach((doc) => {
    entries.push(workflowDocumentToEntry(doc));
  });

  if (contract.signatureDate) {
    entries.push({
      id: "mock-firmado",
      name: `${code}_Contrato_Firmado_Final.pdf`,
      entryType: "pdf",
      modifiedDate: contract.signatureDate,
      size: formatSize(512_000),
      simulatedLink: `#/sim/repo/${contract.id}/firmado`,
    });
  } else if (contract.state.active && !uploadedDoc) {
    entries.push({
      id: "mock-revision",
      name: `${code}_Revision_Legales_v2.docx`,
      entryType: "docx",
      modifiedDate:
        contract.stateHistory[contract.stateHistory.length - 1]?.date ?? contract.startDate,
      size: formatSize(198_000),
      simulatedLink: `#/sim/repo/${contract.id}/revision`,
    });
  }

  return entries.sort((a, b) => {
    if (a.entryType === "folder" && b.entryType !== "folder") return -1;
    if (a.entryType !== "folder" && b.entryType === "folder") return 1;
    return a.name.localeCompare(b.name, "es");
  });
}
