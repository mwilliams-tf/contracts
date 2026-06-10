import { Link, useNavigate, useParams } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { formatDate, getContractById, isExpired } from "../lib/corpus";
import { openOrCreateAnchored } from "../lib/conversations";
import { useCorpus } from "../lib/useCorpus";
import { getActiveUser, getActiveUserId } from "../lib/session";
import { DocumentOriginBadge } from "./components/DocumentOriginBadge";
import { StateBadge } from "./components/StateBadge";
import { WorkflowActions } from "./components/WorkflowActions";

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const corpus = useCorpus();
  const user = getActiveUser(corpus.users);
  const userId = getActiveUserId();
  const contract = id ? getContractById(corpus, id) : undefined;

  function handleConsultAssistant() {
    if (!userId || !contract || user?.role !== "abogada") return;
    const conv = openOrCreateAnchored(userId, contract.id, contract.title);
    navigate(`/chat/c/${conv.id}`);
  }

  if (!contract) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Contrato no encontrado en el corpus ficticio.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-bank-navy hover:underline">
          ← Volver al tablero
        </Link>
      </div>
    );
  }

  const expired = isExpired(contract.expirationDate);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-sm font-medium text-bank-navy hover:underline">
            ← Volver al tablero
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-bank-navy">{contract.title}</h1>
          <p className="mt-1 text-slate-600">{contract.provider.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "abogada" && (
            <button
              type="button"
              onClick={handleConsultAssistant}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bank-navy bg-bank-navy px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bank-navy/90"
            >
              Consultar al asistente
            </button>
          )}
          <Link
            to={`/contratos/${contract.id}/repositorio`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-bank-navy shadow-sm hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
            Repositorio Drive
          </Link>
          <FictitiousDataBadge />
          <StateBadge state={contract.state} />
          <DocumentOriginBadge origin={contract.documentOrigin} />
        </div>
      </header>

      <WorkflowActions
        contract={contract}
        user={user}
        users={corpus.users}
        workflowStates={corpus.workflowStates}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-bank-navy">Información general</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Estado</dt>
            <dd className="mt-1 font-medium">{contract.state.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Área solicitante</dt>
            <dd className="mt-1 font-medium">{contract.requestingArea}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Servicio</dt>
            <dd className="mt-1 font-medium">{contract.service}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Fecha de inicio</dt>
            <dd className="mt-1 font-medium">{formatDate(contract.startDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Fecha de firma</dt>
            <dd className="mt-1 font-medium">{formatDate(contract.signatureDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Vencimiento</dt>
            <dd className={`mt-1 font-medium ${expired ? "text-red-600" : ""}`}>
              {formatDate(contract.expirationDate)}
              {expired && " — Vencido"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-bank-navy">Partes</h2>
        <ul className="mt-3 list-inside list-disc text-slate-700">
          {contract.parties.map((party) => (
            <li key={party}>{party}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-bank-navy">Firmantes</h2>
        {contract.signatories.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin firmantes registrados</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {contract.signatories.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.role}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.signed
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.signed ? "Firmado" : "Pendiente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-bank-navy">Documentos asociados</h2>
        {contract.documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin documentos asociados</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {contract.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-800">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    {doc.type} · {formatDate(doc.date)}
                  </p>
                </div>
                <a
                  href={doc.simulatedLink}
                  className="text-sm font-medium text-bank-navy hover:underline"
                  onClick={(e) => e.preventDefault()}
                  title="Enlace simulado — prototipo"
                >
                  Ver documento
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="historial" className="rounded-lg border border-slate-200 bg-white p-6 scroll-mt-4">
        <h2 className="text-lg font-semibold text-bank-navy">Historial de estados</h2>
        {contract.stateHistory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin historial de estados</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l-2 border-bank-gold/40 pl-4">
            {contract.stateHistory.map((entry, i) => {
              const state = corpus.workflowStates.find((s) => s.id === entry.stateId);
              return (
                <li key={`${entry.stateId}-${entry.date}-${i}`} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-bank-gold" />
                  <p className="font-medium">{state?.name ?? entry.stateId}</p>
                  <p className="text-sm text-slate-500">{formatDate(entry.date)}</p>
                  {entry.note && (
                    <p className="mt-1 text-sm text-slate-600">{entry.note}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
