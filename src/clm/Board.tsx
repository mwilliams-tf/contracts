import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { BOARD_AREA_FILTERS } from "../lib/areas";
import { removeStanleyDemoContracts } from "../lib/stanley-demo-reset";
import { useCorpus } from "../lib/useCorpus";
import { filterContractsForUser, getActiveUser } from "../lib/session";
import { ContractBoardTable } from "./components/ContractBoardTable";

export function Board() {
  const corpus = useCorpus();
  const user = getActiveUser(corpus.users);

  const [stateFilter, setStateFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [resettingStanley, setResettingStanley] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const filtered = useMemo(() => {
    let list = filterContractsForUser(corpus.contracts, user);

    if (stateFilter) {
      list = list.filter((c) => c.stateId === stateFilter);
    }

    if (areaFilter) {
      list = list.filter((c) => c.requestingArea === areaFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.provider.name.toLowerCase().includes(q) ||
          c.service.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (a.state.active !== b.state.active) return a.state.active ? -1 : 1;
      if (a.state.order !== b.state.order) return a.state.order - b.state.order;
      return a.title.localeCompare(b.title, "es");
    });
  }, [corpus, user, stateFilter, areaFilter, search]);

  async function handleRemoveStanley() {
    if (
      !window.confirm(
        "¿Eliminar el contrato Stanley creado en esta sesión? Los mails de demo se conservan para el chat.",
      )
    ) {
      return;
    }

    setResettingStanley(true);
    setResetMessage("");
    try {
      const removed = await removeStanleyDemoContracts();
      setResetMessage(
        removed.length > 0
          ? `Contrato Stanley eliminado (${removed.length} expediente${removed.length === 1 ? "" : "s"}). Podés crearlo de nuevo.`
          : "No había contrato Stanley guardado en esta sesión.",
      );
    } finally {
      setResettingStanley(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bank-navy">Tablero central de contratos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cartera centralizada del área de Legales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FictitiousDataBadge />
          <button
            type="button"
            disabled={resettingStanley}
            onClick={() => void handleRemoveStanley()}
            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
          >
            {resettingStanley ? "Eliminando…" : "Eliminar Stanley (demo)"}
          </button>
          <Link
            to="/solicitud"
            className="inline-flex items-center rounded-lg bg-bank-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-bank-navy/90"
          >
            Crear nueva solicitud
          </Link>
        </div>
      </header>

      {resetMessage && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {resetMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px]">
          <label htmlFor="state-filter" className="mb-1 block text-xs font-medium text-slate-500">
            Filtrar por estado
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy"
          >
            <option value="">Todos los estados</option>
            {corpus.workflowStates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="area-filter" className="mb-1 block text-xs font-medium text-slate-500">
            Filtrar por área
          </label>
          <select
            id="area-filter"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy"
          >
            <option value="">Todas las áreas</option>
            {BOARD_AREA_FILTERS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-slate-500">
            Buscar
          </label>
          <input
            id="search"
            type="search"
            placeholder="Proveedor, servicio o título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">Sin contratos para estos criterios</p>
          <p className="mt-1 text-sm text-slate-500">
            Probá ajustar el filtro o la búsqueda
          </p>
        </div>
      ) : (
        <ContractBoardTable contracts={filtered} />
      )}
    </div>
  );
}
