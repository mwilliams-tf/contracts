import { useState } from "react";
import type { EnrichedContract, User, WorkflowState } from "../../models";
import {
  STATE_RESPONSIBLE_AREA,
  TERMINAL_STATE_IDS,
  getAvailableActions,
} from "../../lib/workflow";
import { applyWorkflowTransition } from "../../lib/workflow-storage";

interface WorkflowActionsProps {
  contract: EnrichedContract;
  user: User | null;
  users: User[];
  workflowStates: WorkflowState[];
  onTransition?: () => void;
}

const variantClass: Record<string, string> = {
  primary: "bg-bank-navy text-white hover:bg-bank-navy/90",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function WorkflowActions({
  contract,
  user,
  users,
  workflowStates,
  onTransition,
}: WorkflowActionsProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const actions = getAvailableActions(contract, user);
  const responsible = STATE_RESPONSIBLE_AREA[contract.stateId] ?? "—";
  const isTerminal = TERMINAL_STATE_IDS.has(contract.stateId);
  const noteRequiredForActions = actions.filter((action) => action.requiresNote);

  if (isTerminal) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-bank-navy">Flujo de trabajo</h2>
        <p className="mt-2 text-sm text-slate-600">
          Este contrato está en un estado terminal ({contract.state.name}). No hay acciones
          pendientes.
        </p>
      </section>
    );
  }

  function executeTransition(actionId: string) {
    if (!user) {
      setError("Seleccioná una usuaria en la barra superior para actuar.");
      return;
    }

    const action = actions.find((item) => item.id === actionId);
    if (action?.requiresNote && !note.trim()) {
      setError("Esta acción requiere una observación.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = applyWorkflowTransition(
      contract,
      actionId,
      user,
      users,
      workflowStates,
      note.trim() || undefined,
    );

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setNote("");
    onTransition?.();
  }

  return (
    <section className="rounded-lg border border-bank-gold/30 bg-amber-50/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-bank-navy">Flujo de trabajo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Responsable actual: <span className="font-medium">{responsible}</span>
          </p>
        </div>
        {actions.length > 0 && user && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Podés actuar como {user.name}
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          {user
            ? `Tu rol (${user.name}) no tiene acciones disponibles en este estado. Cambiá de usuaria en la barra superior para simular otra área.`
            : "Seleccioná una usuaria en la barra superior para ver las acciones disponibles."}
        </p>
      ) : (
        <>
          {actions.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <label htmlFor="workflow-note" className="block text-sm font-medium text-slate-700">
                Observación
                {noteRequiredForActions.length > 0 ? (
                  <span className="font-normal text-slate-500">
                    {" "}
                    (obligatoria para{" "}
                    {noteRequiredForActions
                      .map((action) => action.label.toLowerCase())
                      .join(", ")}
                    )
                  </span>
                ) : (
                  <span className="font-normal text-slate-500"> (opcional)</span>
                )}
              </label>
              <textarea
                id="workflow-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregá contexto sobre la decisión, cambios o motivo del rechazo…"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setError("");
                  executeTransition(action.id);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-50 ${variantClass[action.variant]}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}

      {contract.stateId === "st-rev-proveedor" && (
        <p className="mt-3 text-sm text-slate-600">
          El proveedor revisa el borrador <strong>fuera del sistema</strong> (mail u otro canal).
          El área solicitante registra la respuesta recibida. Si hay conformidad, el expediente
          pasa a Legales para revisión final y firma. Si hay objeción o cambios propuestos, vuelve
          a Legales para ajustes; luego el circuito continúa área solicitante → proveedor.
        </p>
      )}

      {contract.stateId === "st-pendiente-firma" && actions.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          En este estado el contrato es de solo lectura. Compras registra el PDF firmado para
          finalizar.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
