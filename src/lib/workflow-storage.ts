import type {
  Contract,
  ContractWorkflowOverride,
  EnrichedContract,
  StateHistoryEntry,
  User,
  WorkflowNotification,
  WorkflowState,
} from "../models";
import {
  buildNotificationMessage,
  buildNewRequestNotificationMessage,
  findTransitionAction,
  getRecipientUserIds,
} from "./workflow";

const OVERRIDES_KEY = "clm-chat:workflow-overrides";
const NOTIFICATIONS_KEY = "clm-chat:notifications";
const WORKFLOW_EVENT = "clm-workflow-updated";

export function subscribeWorkflow(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(WORKFLOW_EVENT, handler);
  return () => window.removeEventListener(WORKFLOW_EVENT, handler);
}

export function notifyWorkflowUpdated(): void {
  window.dispatchEvent(new CustomEvent(WORKFLOW_EVENT));
}

export function loadWorkflowOverrides(): ContractWorkflowOverride[] {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContractWorkflowOverride[];
  } catch {
    return [];
  }
}

function saveWorkflowOverrides(overrides: ContractWorkflowOverride[]): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function replaceWorkflowOverrides(overrides: ContractWorkflowOverride[]): void {
  saveWorkflowOverrides(overrides);
}

export function getOverrideForContract(
  contractId: string,
): ContractWorkflowOverride | undefined {
  return loadWorkflowOverrides().find((o) => o.contractId === contractId);
}

export function applyOverrideToContract(contract: Contract): Contract {
  const override = getOverrideForContract(contract.id);
  if (!override) return contract;
  return {
    ...contract,
    stateId: override.stateId,
    stateHistory: override.stateHistory,
    signatureDate: override.signatureDate,
  };
}

export function loadNotifications(): WorkflowNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkflowNotification[];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: WorkflowNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function replaceNotifications(notifications: WorkflowNotification[]): void {
  saveNotifications(notifications);
}

export function getNotificationsForUser(userId: string): WorkflowNotification[] {
  return loadNotifications()
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadCount(userId: string): number {
  return getNotificationsForUser(userId).filter((n) => !n.read).length;
}

export function markNotificationRead(notificationId: string): void {
  const all = loadNotifications();
  const updated = all.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
  notifyWorkflowUpdated();
}

export function markAllNotificationsRead(userId: string): void {
  const all = loadNotifications();
  const updated = all.map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
  notifyWorkflowUpdated();
}

function addNotifications(
  contract: Contract,
  toState: WorkflowState,
  users: User[],
  actor: User,
): void {
  const recipientIds = getRecipientUserIds(toState.id, contract, users).filter(
    (id) => id !== actor.id,
  );
  if (recipientIds.length === 0) return;

  const message = buildNotificationMessage(toState, contract.title, actor.name);
  const now = new Date().toISOString();
  const existing = loadNotifications();

  const newOnes: WorkflowNotification[] = recipientIds.map((userId) => ({
    id: `notif-${Date.now()}-${userId}`,
    contractId: contract.id,
    contractTitle: contract.title,
    userId,
    message,
    createdAt: now,
    read: false,
  }));

  saveNotifications([...newOnes, ...existing]);
}

export function notifyNewRequest(
  contract: Contract,
  users: User[],
): void {
  const recipientIds = getRecipientUserIds("st-rev-legales", contract, users);
  if (recipientIds.length === 0) return;

  const message = buildNewRequestNotificationMessage(contract.title);
  const now = new Date().toISOString();
  const existing = loadNotifications();

  const newOnes: WorkflowNotification[] = recipientIds.map((userId) => ({
    id: `notif-${Date.now()}-${userId}`,
    contractId: contract.id,
    contractTitle: contract.title,
    userId,
    message,
    createdAt: now,
    read: false,
  }));

  saveNotifications([...newOnes, ...existing]);
  notifyWorkflowUpdated();
}

export function applyWorkflowTransition(
  contract: EnrichedContract,
  actionId: string,
  user: User,
  users: User[],
  workflowStates: WorkflowState[],
  note?: string,
  attachment?: { id: string; fileName: string },
): { ok: true } | { ok: false; error: string } {
  const action = findTransitionAction(contract.stateId, actionId);
  if (!action) {
    return { ok: false, error: "Acción no disponible para este estado." };
  }

  const toState = workflowStates.find((s) => s.id === action.toStateId);
  if (!toState) {
    return { ok: false, error: "Estado destino no encontrado." };
  }

  if (action.requiresNote && !note?.trim()) {
    return { ok: false, error: "Esta acción requiere una observación." };
  }

  const today = new Date().toISOString().split("T")[0];
  let historyNote = note?.trim() || undefined;
  if (attachment) {
    const attachmentNote = `Documento adjunto en Drive: ${attachment.fileName}`;
    historyNote = historyNote ? `${historyNote} — ${attachmentNote}` : attachmentNote;
  }

  const historyEntry: StateHistoryEntry = {
    stateId: action.toStateId,
    date: today,
    note: historyNote,
    attachmentId: attachment?.id,
    attachmentFileName: attachment?.fileName,
  };

  const newHistory = [...contract.stateHistory, historyEntry];
  const signatureDate =
    action.toStateId === "st-finalizado" ? today : contract.signatureDate;

  const override: ContractWorkflowOverride = {
    contractId: contract.id,
    stateId: action.toStateId,
    stateHistory: newHistory,
    signatureDate,
  };

  const overrides = loadWorkflowOverrides().filter(
    (o) => o.contractId !== contract.id,
  );
  overrides.push(override);
  saveWorkflowOverrides(overrides);

  const updatedContract: Contract = {
    ...contract,
    stateId: action.toStateId,
    stateHistory: newHistory,
    signatureDate,
  };

  addNotifications(updatedContract, toState, users, user);
  notifyWorkflowUpdated();

  return { ok: true };
}
