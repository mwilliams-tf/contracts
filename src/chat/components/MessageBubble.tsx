import type { Corpus, Turn } from "../../models";
import { getContractById } from "../../lib/corpus";
import { CitationCard } from "./CitationCard";

interface MessageBubbleProps {
  turn: Turn;
  corpus: Corpus;
}

export function MessageBubble({ turn, corpus }: MessageBubbleProps) {
  const isUser = turn.role === "user";
  const principal = turn.principalContractId
    ? getContractById(corpus, turn.principalContractId)
    : undefined;
  const referenced = (turn.referencedContractIds ?? [])
    .map((id) => getContractById(corpus, id))
    .filter(Boolean);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-bank-navy text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {!isUser && principal && (
          <p className="mb-2 text-xs font-medium text-bank-navy">
            Contrato principal: {principal.title}
          </p>
        )}
        {!isUser && referenced.length > 0 && (
          <p className="mb-2 text-xs text-slate-600">
            Referenciados: {referenced.map((c) => c!.title).join(" · ")}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.text}</p>
        {!isUser && turn.citations && turn.citations.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-slate-500">Fuentes citadas:</p>
            {turn.citations.map((c) => (
              <CitationCard key={c.sourceId} citation={c} corpus={corpus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
