import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { answerFromScenarios } from "./scenarios";
import { deriveSuggestions } from "./suggestions";
import { appendTurn, getConversation } from "../lib/conversations";
import { getContractById } from "../lib/corpus";
import { getActiveUser, getActiveUserId } from "../lib/session";
import { applyDraft, getWorkingDrafts } from "../lib/working-drafts";
import { useCorpus } from "../lib/useCorpus";
import type { ChatAnswer, Turn, WorkingDraft } from "../models";
import { DraftActionCard } from "./components/DraftActionCard";
import { MessageBubble } from "./components/MessageBubble";
import { SuggestionChips } from "./components/SuggestionChips";

function answerToTurn(answer: ChatAnswer): Turn {
  return {
    role: "assistant",
    text: answer.text,
    timestamp: new Date().toISOString(),
    citations: answer.citations,
    principalContractId: answer.principalContractId,
    referencedContractIds: answer.referencedContractIds,
    proposedDraft: answer.proposedDraft ?? null,
    suggestions: answer.suggestions,
  };
}

export function ConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const corpus = useCorpus();
  const userId = getActiveUserId();
  const user = getActiveUser(corpus.users);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftVersion, setDraftVersion] = useState(0);
  const [appliedDrafts, setAppliedDrafts] = useState<Record<string, WorkingDraft>>({});
  const [conversation, setConversation] = useState(() =>
    userId && conversationId ? getConversation(userId, conversationId) : null,
  );

  useEffect(() => {
    if (userId && conversationId) {
      setConversation(getConversation(userId, conversationId));
    }
  }, [userId, conversationId]);

  const isFrozen = conversation?.status === "frozen";
  const focusContract =
    conversation?.focusContractId != null
      ? getContractById(corpus, conversation.focusContractId)
      : undefined;

  const workingDrafts =
    conversation?.focusContractId != null
      ? getWorkingDrafts(conversation.focusContractId)
      : [];

  const chipSuggestions = useMemo(() => {
    if (!conversation) return [];
    return deriveSuggestions({
      corpus,
      userId: userId ?? "",
      conversationType: conversation.type,
      focusContractId: conversation.focusContractId ?? undefined,
      priorMessages: conversation.messages,
    });
  }, [conversation, corpus, userId, draftVersion]);

  function refresh() {
    if (userId && conversationId) {
      setConversation(getConversation(userId, conversationId));
    }
  }

  function submitQuery(text: string) {
    if (!text.trim() || !userId || !conversationId || !conversation || loading || isFrozen) {
      return;
    }

    const userTurn: Turn = {
      role: "user",
      text: text.trim(),
      timestamp: new Date().toISOString(),
      principalContractId: conversation.focusContractId,
      referencedContractIds: [],
    };
    appendTurn(userId, conversationId, userTurn);
    refresh();
    setInput("");
    setLoading(true);

    const priorMessages = getConversation(userId, conversationId)?.messages.slice(0, -1) ?? [];

    window.setTimeout(() => {
      const result = answerFromScenarios(text.trim(), {
        corpus,
        userId,
        conversationType: conversation.type,
        focusContractId: conversation.focusContractId ?? undefined,
        priorMessages,
      });
      appendTurn(userId, conversationId, answerToTurn(result));
      refresh();
      setLoading(false);
    }, 450);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitQuery(input);
  }

  function handleApplyDraft(proposal: NonNullable<Turn["proposedDraft"]>) {
    if (!conversationId) return;
    const draft = applyDraft(proposal, conversationId);
    setAppliedDrafts((prev) => ({ ...prev, [proposal.clauseRef]: draft }));
    setDraftVersion((v) => v + 1);
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

  if (!conversation) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Conversación no encontrada.</p>
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="mt-4 text-sm font-medium text-bank-navy hover:underline"
        >
          ← Volver a la bandeja
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="text-sm font-medium text-bank-navy hover:underline"
          >
            ← Bandeja
          </button>
          <h1 className="mt-1 text-2xl font-bold text-bank-navy">{conversation.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {conversation.type === "portfolio" ? "Consulta transversal" : "Anclada a contrato"}
            {focusContract ? ` · ${focusContract.title}` : ""}
            {isFrozen ? " · solo lectura" : ""}
          </p>
        </div>
        <FictitiousDataBadge />
      </header>

      {workingDrafts.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium text-amber-900">Borradores de trabajo simulados</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {workingDrafts.map((d) => (
              <li key={d.id}>
                v{d.version} — {d.clauseRef} ({new Date(d.createdAt).toLocaleDateString("es-AR")})
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFrozen && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Esta conversación está congelada. Podés leer el historial pero no agregar mensajes.
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {conversation.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <p className="text-lg font-medium">¿En qué puedo ayudarte?</p>
              <p className="mt-2 max-w-lg text-sm">
                {conversation.type === "anchored" && focusContract
                  ? `Consultá sobre ${focusContract.title} u otros contratos del corpus.`
                  : "Probá preguntar por contratos que vencen en 2028 o por Stanley y Acme."}
              </p>
            </div>
          ) : (
            conversation.messages.map((msg, i) => (
              <div key={`${msg.timestamp}-${i}`}>
                <MessageBubble turn={msg} corpus={corpus} />
                {!isFrozen &&
                  msg.role === "assistant" &&
                  msg.proposedDraft &&
                  !appliedDrafts[msg.proposedDraft.clauseRef] && (
                    <div className="ml-0 max-w-[85%]">
                      <DraftActionCard
                        proposal={msg.proposedDraft}
                        onApply={() => handleApplyDraft(msg.proposedDraft!)}
                      />
                    </div>
                  )}
              </div>
            ))
          )}
          {loading && (
            <p className="text-sm text-slate-500" aria-live="polite">
              Consultando expediente…
            </p>
          )}
        </div>

        {!isFrozen && (
          <>
            <SuggestionChips
              suggestions={chipSuggestions}
              onSelect={submitQuery}
              disabled={loading}
            />
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
          </>
        )}
      </div>
    </div>
  );
}
