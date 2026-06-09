import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { answerFromScenarios } from "./scenarios";
import { useCorpus } from "../lib/useCorpus";
import { appendMessage, loadConversation } from "../lib/history";
import { getActiveUser, getActiveUserId } from "../lib/session";
import { MessageBubble } from "./components/MessageBubble";

export function ChatView() {
  const corpus = useCorpus();
  const userId = getActiveUserId();
  const user = getActiveUser(corpus.users);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() =>
    userId ? loadConversation(userId).messages : [],
  );

  useEffect(() => {
    if (userId) {
      setMessages(loadConversation(userId).messages);
    } else {
      setMessages([]);
    }
  }, [userId]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !userId || loading || !user || user.role !== "abogada") return;

    const userMsg = {
      role: "user" as const,
      text,
      timestamp: new Date().toISOString(),
    };
    appendMessage(userId, userMsg);
    const priorMessages = loadConversation(userId).messages.slice(0, -1);
    setMessages(loadConversation(userId).messages);
    setInput("");
    setLoading(true);

    window.setTimeout(() => {
      const result = answerFromScenarios(text, { corpus, userId, priorMessages });
      const assistantMsg = {
        role: "assistant" as const,
        text: result.text,
        citations: result.citations,
        timestamp: new Date().toISOString(),
      };
      appendMessage(userId, assistantMsg);
      setMessages(loadConversation(userId).messages);
      setLoading(false);
    }, 450);
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
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bank-navy">Chat IA — Legales</h1>
          <p className="mt-1 text-sm text-slate-600">
            Consultas sobre contratos, estados y mails · {user.name} · respuestas guionadas demo
          </p>
        </div>
        <FictitiousDataBadge />
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <p className="text-lg font-medium">¿En qué puedo ayudarte?</p>
              <p className="mt-2 max-w-lg text-sm">
                Probá preguntar por <strong>Stanley</strong> (estado, mails, recomendación) o{" "}
                <strong>Acme</strong> (vencimiento, firmantes, mails). Ej.: &ldquo;¿En qué estado
                está el contrato de Stanley?&rdquo;
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={`${msg.timestamp}-${i}`} message={msg} />
            ))
          )}
          {loading && (
            <p className="text-sm text-slate-500" aria-live="polite">
              Consultando expediente…
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-4">
          <label htmlFor="chat-input" className="sr-only">
            Escribir consulta
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu consulta en lenguaje natural…"
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-bank-navy px-4 py-2 text-sm font-medium text-white hover:bg-bank-navy/90 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
