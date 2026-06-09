import type { WorkflowState } from "../../models";

interface StateBadgeProps {
  state: WorkflowState;
}

const colors: Record<string, string> = {
  Solicitado: "bg-slate-100 text-slate-700 border-slate-200",
  Rechazado: "bg-red-50 text-red-700 border-red-200",
  "Revisión de legales": "bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-300",
  "Revisión del área solicitante": "bg-indigo-100 text-indigo-800 border-indigo-200 ring-1 ring-indigo-300",
  "Revisión del proveedor": "bg-purple-100 text-purple-800 border-purple-200 ring-1 ring-purple-300",
  "Revisión legales final": "bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-300",
  "Pendiente de firma": "bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400",
  Finalizado: "bg-slate-100 text-slate-500 border-slate-200",
};

export function StateBadge({ state }: StateBadgeProps) {
  const color = colors[state.name] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {state.active && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {state.name}
    </span>
  );
}
