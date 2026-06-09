import { useState } from "react";
import { Link } from "react-router-dom";
import type { EnrichedContract } from "../../models";
import { formatDate } from "../../lib/corpus";
import { formatContractCode } from "../../lib/contract-display";
import { StateBadge } from "./StateBadge";

interface ContractBoardTableProps {
  contracts: EnrichedContract[];
}

function RowActionsMenu({ contract }: { contract: EnrichedContract }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-bank-navy"
        aria-label={`Opciones para ${contract.title}`}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              to={`/contratos/${contract.id}`}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Ver detalle
            </Link>
            <Link
              to={`/contratos/${contract.id}#historial`}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Historial de versiones
            </Link>
            <Link
              to={`/contratos/${contract.id}/repositorio`}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Ir al repositorio
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function ContractBoardTable({ contracts }: ContractBoardTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = contracts.length > 0 && selected.size === contracts.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contracts.map((c) => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todos los contratos"
                  className="h-4 w-4 rounded border-slate-300 text-bank-navy focus:ring-bank-navy"
                />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Proveedor
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Tipo de contrato
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Fecha inicio
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Fecha fin
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Estado
              </th>
              <th scope="col" className="w-24 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className={`transition hover:bg-slate-50/80 ${
                  contract.state.active ? "bg-amber-50/30" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(contract.id)}
                    onChange={() => toggleOne(contract.id)}
                    aria-label={`Seleccionar ${formatContractCode(contract.id)}`}
                    className="h-4 w-4 rounded border-slate-300 text-bank-navy focus:ring-bank-navy"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    to={`/contratos/${contract.id}`}
                    className="font-medium text-bank-navy hover:underline"
                  >
                    {formatContractCode(contract.id)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{contract.provider.name}</td>
                <td className="px-4 py-3 text-slate-700">{contract.service}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(contract.startDate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(contract.expirationDate)}
                </td>
                <td className="px-4 py-3">
                  <StateBadge state={contract.state} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/contratos/${contract.id}/repositorio`}
                      className="rounded-md p-1.5 text-bank-navy hover:bg-blue-50"
                      title="Ir al repositorio de Drive"
                      aria-label={`Repositorio de ${formatContractCode(contract.id)}`}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    </Link>
                    <RowActionsMenu contract={contract} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
