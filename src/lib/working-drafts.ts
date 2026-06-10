import type { DraftProposal, WorkingDraft } from "../models";

export function draftsKey(contractId: string): string {
  return `clm-chat:drafts:${contractId}`;
}

export function getWorkingDrafts(contractId: string): WorkingDraft[] {
  try {
    const raw = localStorage.getItem(draftsKey(contractId));
    if (!raw) return [];
    return JSON.parse(raw) as WorkingDraft[];
  } catch {
    return [];
  }
}

function saveWorkingDrafts(contractId: string, drafts: WorkingDraft[]): void {
  localStorage.setItem(draftsKey(contractId), JSON.stringify(drafts));
}

export function applyDraft(
  proposal: DraftProposal,
  conversationId: string,
): WorkingDraft {
  const existing = getWorkingDrafts(proposal.contractId);
  const version = existing.length > 0 ? Math.max(...existing.map((d) => d.version)) + 1 : 1;

  const draft: WorkingDraft = {
    id: `draft-${proposal.contractId}-v${version}`,
    contractId: proposal.contractId,
    version,
    clauseRef: proposal.clauseRef,
    text: proposal.proposedText,
    simulated: true,
    createdAt: new Date().toISOString(),
    sourceConversationId: conversationId,
  };

  saveWorkingDrafts(proposal.contractId, [...existing, draft]);
  return draft;
}
