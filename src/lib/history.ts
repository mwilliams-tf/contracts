import type { ChatMessage, LegacyConversation } from "../models";

function historyKey(userId: string): string {
  return `clm-chat:history:${userId}`;
}

/** Carga el hilo único legacy de `001` — conservado para compatibilidad (D8) */
export function loadLegacyConversation(userId: string): LegacyConversation {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    if (!raw) return { userId, messages: [] };
    return JSON.parse(raw) as LegacyConversation;
  } catch {
    return { userId, messages: [] };
  }
}

/** @deprecated Usar loadInbox / appendTurn de conversations.ts */
export function loadConversation(userId: string): LegacyConversation {
  return loadLegacyConversation(userId);
}

export function saveConversation(conversation: LegacyConversation): void {
  localStorage.setItem(
    historyKey(conversation.userId),
    JSON.stringify(conversation),
  );
}

/** @deprecated Usar appendTurn de conversations.ts */
export function appendMessage(userId: string, message: ChatMessage): LegacyConversation {
  const conversation = loadLegacyConversation(userId);
  conversation.messages.push(message);
  saveConversation(conversation);
  return conversation;
}
