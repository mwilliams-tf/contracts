import { deleteContractDocument } from "./document-store";
import { loadStoredRequests, replaceStoredRequests } from "./requests";
import {
  loadNotifications,
  loadWorkflowOverrides,
  notifyWorkflowUpdated,
  replaceNotifications,
  replaceWorkflowOverrides,
} from "./workflow-storage";

const STANLEY_POOL_ID = "ctr-006";

function isStanleyText(value: string): boolean {
  return value.toLowerCase().includes("stanley");
}

/** Quita solicitudes/estado local del contrato Stanley creado en el prototipo */
export async function removeStanleyDemoContracts(): Promise<string[]> {
  const requests = loadStoredRequests();
  const removedIds = new Set(
    requests
      .filter(
        (request) =>
          isStanleyText(request.providerName) || isStanleyText(request.title),
      )
      .map((request) => request.id),
  );
  removedIds.add(STANLEY_POOL_ID);

  replaceStoredRequests(requests.filter((request) => !removedIds.has(request.id)));

  replaceWorkflowOverrides(
    loadWorkflowOverrides().filter((override) => !removedIds.has(override.contractId)),
  );

  replaceNotifications(
    loadNotifications().filter(
      (notification) =>
        !removedIds.has(notification.contractId) &&
        !isStanleyText(notification.contractTitle),
    ),
  );

  for (const contractId of removedIds) {
    if (contractId === STANLEY_POOL_ID) continue;
    await deleteContractDocument(contractId).catch(() => undefined);
  }

  notifyWorkflowUpdated();
  return [...removedIds].filter((id) => id !== STANLEY_POOL_ID);
}
