import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { formatDate, getContractById } from "../lib/corpus";
import { useCorpus } from "../lib/useCorpus";
import { contractRepositoryPath, formatContractCode } from "../lib/contract-display";
import {
  downloadContractDocument,
  getContractDocument,
  type StoredContractDocumentMeta,
} from "../lib/document-store";
import {
  downloadWorkflowDocument,
  getWorkflowDocument,
  listWorkflowDocuments,
  type WorkflowDocumentMeta,
} from "../lib/workflow-documents";
import { getContractRepositoryEntries, type RepositoryEntry } from "../lib/repository";
import { getStoredRequestById } from "../lib/requests";

function EntryIcon({ entry }: { entry: RepositoryEntry }) {
  if (entry.entryType === "folder") {
    return (
      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    );
  }
  if (entry.entryType === "pdf") {
    return (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v2H8v-2zm0 4h5v2H8v-2z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v2H8v-2zm0 4h5v2H8v-2z" />
    </svg>
  );
}

export function ContractRepository() {
  const { id } = useParams<{ id: string }>();
  const corpus = useCorpus();
  const contract = id ? getContractById(corpus, id) : undefined;
  const [search, setSearch] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState<StoredContractDocumentMeta | null>(null);
  const [workflowDocs, setWorkflowDocs] = useState<WorkflowDocumentMeta[]>([]);

  useEffect(() => {
    if (!contract) {
      setUploadedDoc(null);
      setWorkflowDocs([]);
      return;
    }

    let cancelled = false;
    void getContractDocument(contract.id).then((doc) => {
      if (cancelled) return;
      if (doc) {
        const { blob: _blob, ...meta } = doc;
        setUploadedDoc(meta);
      } else {
        setUploadedDoc(null);
      }
    });
    void listWorkflowDocuments(contract.id).then((docs) => {
      if (!cancelled) setWorkflowDocs(docs);
    });

    return () => {
      cancelled = true;
    };
  }, [contract?.id]);

  if (!contract) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Contrato no encontrado en el corpus ficticio.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-bank-navy hover:underline">
          ← Volver al tablero
        </Link>
      </div>
    );
  }

  async function handleEntryClick(entry: RepositoryEntry) {
    if (!contract) return;
    if (entry.contractDocument) {
      const doc = await getContractDocument(contract.id);
      if (doc) downloadContractDocument(doc);
      return;
    }
    if (entry.workflowDocumentId) {
      const doc = await getWorkflowDocument(entry.workflowDocumentId);
      if (doc) downloadWorkflowDocument(doc);
    }
  }

  const breadcrumb = contractRepositoryPath(contract);
  const folderName = `${formatContractCode(contract.id)} - ${contract.service}`;
  const storedRequest = getStoredRequestById(contract.id);
  const entries = getContractRepositoryEntries(
    contract,
    uploadedDoc,
    storedRequest?.generatedDraftName,
    workflowDocs,
  );
  const filtered = search.trim()
    ? entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm font-medium text-bank-navy hover:underline">
            ← Volver al tablero
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-bank-navy">Repositorio de contratos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Drive simulado · carpeta del contrato {formatContractCode(contract.id)}
            {uploadedDoc || workflowDocs.length > 0
          ? " · incluye archivos cargados localmente"
          : ""}
          </p>
        </div>
        <FictitiousDataBadge />
      </header>

      <div className="flex min-h-[480px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-slate-50 lg:w-64 lg:border-b-0 lg:border-r">
          <nav className="p-4 text-sm" aria-label="Árbol de carpetas">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Navegación
            </p>
            <ul className="space-y-1 text-slate-600">
              {breadcrumb.map((segment, index) => (
                <li
                  key={segment}
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${index * 12}px` }}
                >
                  {index > 0 && <span className="text-slate-300">›</span>}
                  <span className={index === breadcrumb.length - 1 ? "font-medium text-bank-navy" : ""}>
                    {segment}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-1.5 pl-12 font-medium text-bank-navy">
                <span className="text-slate-300">›</span>
                <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
                {folderName}
              </li>
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-600">
              {breadcrumb.slice(1).map((segment, i) => (
                <span key={segment} className="flex items-center gap-2">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <span>{segment}</span>
                </span>
              ))}
              <span className="text-slate-300">/</span>
              <span className="truncate font-medium text-bank-navy">{folderName}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Buscar archivos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy"
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-bank-navy px-3 py-1.5 text-sm font-medium text-white opacity-60"
                disabled
                title="Subí archivos desde el formulario de solicitud"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2M10 3v10m0 0l-3-3m3 3l3-3" />
                </svg>
                Subir archivo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fecha de modificación
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tamaño
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Sin archivos para esta búsqueda
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        {entry.contractDocument || entry.workflowDocumentId ? (
                          <button
                            type="button"
                            onClick={() => void handleEntryClick(entry)}
                            className="flex items-center gap-2 font-medium text-bank-navy hover:underline"
                            title="Descargar archivo"
                          >
                            <EntryIcon entry={entry} />
                            {entry.name}
                          </button>
                        ) : entry.simulatedLink ? (
                          <a
                            href={entry.simulatedLink}
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center gap-2 font-medium text-bank-navy hover:underline"
                            title="Enlace simulado — prototipo"
                          >
                            <EntryIcon entry={entry} />
                            {entry.name}
                          </a>
                        ) : (
                          <span className="flex items-center gap-2 text-slate-700">
                            <EntryIcon entry={entry} />
                            {entry.name}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                        {formatDate(entry.modifiedDate)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {entry.entryType === "folder"
                          ? "Carpeta"
                          : entry.entryType === "pdf"
                            ? "PDF"
                            : entry.entryType === "docx"
                              ? "Documento Word"
                              : "Archivo"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{entry.size ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        {uploadedDoc || workflowDocs.length > 0
          ? "Los archivos adjuntos se guardan localmente (IndexedDB). Integración con Google Drive pendiente (IT)."
          : "Integración con Google Drive pendiente (IT) · contenido ficticio para demostración"}
      </p>
    </div>
  );
}
