import type { ChatMessage, Conversation } from "../models";

function historyKey(userId: string): string {
  return `clm-chat:history:${userId}`;
}

export function loadConversation(userId: string): Conversation {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    if (!raw) return { userId, messages: [] };
    return JSON.parse(raw) as Conversation;
  } catch {
    return { userId, messages: [] };
  }
}

export function saveConversation(conversation: Conversation): void {
  localStorage.setItem(
    historyKey(conversation.userId),
    JSON.stringify(conversation),
  );
}

export function appendMessage(userId: string, message: ChatMessage): Conversation {
  const conversation = loadConversation(userId);
  conversation.messages.push(message);
  saveConversation(conversation);
  return conversation;
}
