const DB_NAME = "clm-chat-workflow-docs";
const STORE = "attachments";
const DB_VERSION = 1;

export interface StoredWorkflowDocument {
  id: string;
  contractId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: ArrayBuffer;
  uploadedAt: string;
}

export type WorkflowDocumentMeta = Omit<StoredWorkflowDocument, "blob">;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("contractId", "contractId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Error al abrir IndexedDB"));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const request = fn(store);

        if (!request) {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new Error("Error en IndexedDB"));
          return;
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Error en IndexedDB"));
      }),
  );
}

export async function saveWorkflowDocument(
  id: string,
  contractId: string,
  file: File,
): Promise<WorkflowDocumentMeta> {
  const record: StoredWorkflowDocument = {
    id,
    contractId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    blob: await file.arrayBuffer(),
    uploadedAt: new Date().toISOString().split("T")[0],
  };

  await runTransaction("readwrite", (store) => store.put(record));
  const { blob: _blob, ...meta } = record;
  return meta;
}

export async function getWorkflowDocument(
  id: string,
): Promise<StoredWorkflowDocument | null> {
  const record = await runTransaction<StoredWorkflowDocument | undefined>("readonly", (store) =>
    store.get(id),
  );
  return (record as StoredWorkflowDocument | undefined) ?? null;
}

export async function listWorkflowDocuments(contractId: string): Promise<WorkflowDocumentMeta[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const index = store.index("contractId");
    const request = index.getAll(contractId);

    request.onsuccess = () => {
      const rows = (request.result as StoredWorkflowDocument[]).map(({ blob: _blob, ...meta }) => meta);
      resolve(rows.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)));
    };
    request.onerror = () => reject(request.error ?? new Error("Error al listar adjuntos"));
  });
}

export function downloadWorkflowDocument(doc: StoredWorkflowDocument): void {
  const blob = new Blob([doc.blob], { type: doc.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = doc.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createWorkflowDocumentId(contractId: string): string {
  return `wf-${contractId}-${Date.now()}`;
}
