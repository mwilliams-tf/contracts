import {
  buildSeedConversations,
  SEED_ACME_ID,
  SEED_2028_ID,
  SEED_STANLEY_ID,
} from "../data/seed-conversations";
import type { Conversation, Turn } from "../models";
import { loadLegacyConversation } from "./history";

const SEED_USER_IDS = new Set(["u-ana", "u-lucia"]);
const SEED_IDS = new Set([SEED_ACME_ID, SEED_2028_ID, SEED_STANLEY_ID]);

export function conversationsKey(userId: string): string {
  return `clm-chat:conversations:${userId}`;
}

function sortInbox(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function newId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function migrateLegacyInbox(userId: string): Conversation[] {
  const legacy = loadLegacyConversation(userId);
  if (legacy.messages.length === 0) return [];

  const now = new Date().toISOString();
  return [
    {
      id: `conv-legacy-${userId}`,
      userId,
      title: "Conversación anterior",
      type: "portfolio",
      focusContractId: null,
      status: "live",
      createdAt: legacy.messages[0]?.timestamp ?? now,
      updatedAt: legacy.messages[legacy.messages.length - 1]?.timestamp ?? now,
      messages: legacy.messages.map((m) => ({
        ...m,
        principalContractId: null,
        referencedContractIds: [],
      })),
    },
  ];
}

function seedInbox(userId: string): Conversation[] {
  const seeds = buildSeedConversations(userId);
  const migrated = migrateLegacyInbox(userId);
  const extra = migrated.filter((c) => !SEED_IDS.has(c.id));
  return sortInbox([...seeds, ...extra]);
}

export function loadInbox(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(conversationsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      return sortInbox(parsed);
    }
  } catch {
    /* fall through to seed */
  }

  if (SEED_USER_IDS.has(userId)) {
    const seeded = seedInbox(userId);
    saveInbox(userId, seeded);
    return seeded;
  }

  const migrated = migrateLegacyInbox(userId);
  if (migrated.length > 0) {
    saveInbox(userId, migrated);
  }
  return migrated;
}

export function saveInbox(userId: string, conversations: Conversation[]): void {
  localStorage.setItem(conversationsKey(userId), JSON.stringify(conversations));
}

export function getConversation(
  userId: string,
  conversationId: string,
): Conversation | null {
  return loadInbox(userId).find((c) => c.id === conversationId) ?? null;
}

export function createConversation(
  userId: string,
  input: {
    type: "portfolio" | "anchored";
    focusContractId?: string;
    title?: string;
  },
): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: newId(),
    userId,
    title:
      input.title ??
      (input.type === "portfolio"
        ? "Nueva conversación"
        : "Consulta sobre contrato"),
    type: input.type,
    focusContractId:
      input.type === "anchored" ? (input.focusContractId ?? null) : null,
    status: "live",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const inbox = loadInbox(userId);
  inbox.unshift(conversation);
  saveInbox(userId, inbox);
  return conversation;
}

export function appendTurn(
  userId: string,
  conversationId: string,
  turn: Turn,
): Conversation {
  const inbox = loadInbox(userId);
  const index = inbox.findIndex((c) => c.id === conversationId);
  if (index === -1) {
    throw new Error(`Conversación no encontrada: ${conversationId}`);
  }

  const conversation = inbox[index];
  if (conversation.status === "frozen") {
    return conversation;
  }

  const updated: Conversation = {
    ...conversation,
    messages: [...conversation.messages, turn],
    updatedAt: turn.timestamp,
  };
  inbox[index] = updated;
  saveInbox(userId, inbox);
  return updated;
}

export function openOrCreateAnchored(
  userId: string,
  focusContractId: string,
  title?: string,
): Conversation {
  const existing = loadInbox(userId).find(
    (c) =>
      c.type === "anchored" &&
      c.focusContractId === focusContractId &&
      c.status === "live",
  );
  if (existing) return existing;

  return createConversation(userId, {
    type: "anchored",
    focusContractId,
    title,
  });
}
