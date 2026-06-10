import { Link } from "react-router-dom";
import type { Conversation } from "../../models";

interface ConversationListProps {
  conversations: Conversation[];
}

function typeLabel(type: Conversation["type"]): string {
  return type === "portfolio" ? "Portfolio" : "Anclada";
}

function statusLabel(status: Conversation["status"]): string {
  return status === "live" ? "En vivo" : "Congelada";
}

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        Todavía no tenés conversaciones. Creá la primera para consultar al asistente.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <Link
            to={`/chat/c/${conversation.id}`}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-bank-navy">{conversation.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {conversation.messages.length} mensaje
                {conversation.messages.length === 1 ? "" : "s"} · actualizada{" "}
                {new Date(conversation.updatedAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {typeLabel(conversation.type)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  conversation.status === "live"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {statusLabel(conversation.status)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
