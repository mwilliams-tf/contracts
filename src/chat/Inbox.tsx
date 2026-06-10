import { Link, useNavigate } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { createConversation, loadInbox } from "../lib/conversations";
import { getActiveUser, getActiveUserId } from "../lib/session";
import { useCorpus } from "../lib/useCorpus";
import { ConversationList } from "./components/ConversationList";

export function Inbox() {
  const navigate = useNavigate();
  const corpus = useCorpus();
  const userId = getActiveUserId();
  const user = getActiveUser(corpus.users);
  const conversations = userId ? loadInbox(userId) : [];

  function handleNewConversation() {
    if (!userId) return;
    const created = createConversation(userId, { type: "portfolio", title: "Nueva conversación" });
    navigate(`/chat/c/${created.id}`);
  }

  if (!userId || !user) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-900">
          Seleccioná una usuaria en el menú superior para usar el chat.
        </p>
      </div>
    );
  }

  if (user.role !== "abogada") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-bank-navy">Chat IA — solo Legales</h1>
        <p className="mt-3 text-slate-600">
          El asistente de consultas contractuales está disponible únicamente para abogadas del
          área de Legales.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-bank-navy hover:underline">
          ← Volver al tablero
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bank-navy">Bandeja de conversaciones</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.name} · consultas privadas por usuaria · respuestas guionadas demo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FictitiousDataBadge />
          <button
            type="button"
            onClick={handleNewConversation}
            className="rounded-lg bg-bank-navy px-4 py-2 text-sm font-medium text-white hover:bg-bank-navy/90"
          >
            Nueva conversación
          </button>
        </div>
      </header>

      <ConversationList conversations={conversations} />
    </div>
  );
}
