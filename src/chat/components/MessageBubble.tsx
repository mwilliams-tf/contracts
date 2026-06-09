import type { ChatMessage } from "../../models";
import { CitationCard } from "./CitationCard";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-bank-navy text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-slate-500">Fuentes citadas:</p>
            {message.citations.map((c) => (
              <CitationCard key={c.sourceId} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
