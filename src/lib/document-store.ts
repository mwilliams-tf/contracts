const DB_NAME = "clm-chat-documents";
const STORE = "documents";
const DB_VERSION = 1;

export interface StoredContractDocument {
  contractId: string;
  fileName: string;
  mimeType: string;
  size: number;
  textContent: string;
  blob: ArrayBuffer;
  uploadedAt: string;
}

export type StoredContractDocumentMeta = Omit<StoredContractDocument, "blob">;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "contractId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Error al abrir IndexedDB"));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const request = fn(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Error en IndexedDB"));
      }),
  );
}

export async function saveContractDocument(
  contractId: string,
  file: File,
  textContent: string,
): Promise<void> {
  const record: StoredContractDocument = {
    contractId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    textContent,
    blob: await file.arrayBuffer(),
    uploadedAt: new Date().toISOString().split("T")[0],
  };

  await runTransaction("readwrite", (store) => store.put(record));
}

export async function getContractDocument(
  contractId: string,
): Promise<StoredContractDocument | null> {
  const record = await runTransaction<StoredContractDocument | undefined>("readonly", (store) =>
    store.get(contractId),
  );
  return record ?? null;
}

export async function getContractDocumentMeta(
  contractId: string,
): Promise<StoredContractDocumentMeta | null> {
  const doc = await getContractDocument(contractId);
  if (!doc) return null;

  const { blob: _blob, ...meta } = doc;
  return meta;
}

export async function deleteContractDocument(contractId: string): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(contractId));
}

export function downloadContractDocument(doc: StoredContractDocument): void {
  const blob = new Blob([doc.blob], { type: doc.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = doc.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
