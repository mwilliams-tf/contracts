import type { DraftProposal, WorkingDraft } from "../../models";

interface DraftActionCardProps {
  proposal: DraftProposal;
  onApply: () => void;
  appliedDraft?: WorkingDraft | null;
  applying?: boolean;
}

export function DraftActionCard({
  proposal,
  onApply,
  appliedDraft,
  applying,
}: DraftActionCardProps) {
  return (
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
      <p className="font-medium text-amber-900">
        Propuesta de redacción — {proposal.clauseRef}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-slate-800">{proposal.proposedText}</p>
      {appliedDraft ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {proposal.clauseRef} modificada en el documento (v{appliedDraft.version}) con control
          de cambios habilitado.
        </p>
      ) : (
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="mt-3 rounded-lg bg-bank-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-bank-navy/90 disabled:opacity-50"
        >
          {applying ? "Aplicando…" : "Aplicar al documento"}
        </button>
      )}
    </div>
  );
}
