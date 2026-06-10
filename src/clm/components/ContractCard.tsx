import { Link } from "react-router-dom";
import type { EnrichedContract } from "../../models";
import { formatDate, isExpired } from "../../lib/corpus";
import { StateBadge } from "./StateBadge";

interface ContractCardProps {
  contract: EnrichedContract;
}

export function ContractCard({ contract }: ContractCardProps) {
  const expired = isExpired(contract.expirationDate);

  return (
    <Link
      to={`/contratos/${contract.id}`}
      className={`block rounded-lg border bg-white p-4 shadow-sm transition hover:border-bank-navy/30 hover:shadow-md ${
        contract.state.active
          ? "border-slate-200 ring-1 ring-inset ring-bank-gold/50"
          : "border-slate-200"
      } ${expired ? "opacity-75" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-bank-navy">{contract.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{contract.provider.name}</p>
        </div>
        <StateBadge state={contract.state} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Área solicitante</dt>
          <dd className="font-medium">{contract.requestingArea}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Servicio</dt>
          <dd className="font-medium">{contract.service}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Vencimiento</dt>
          <dd className={`font-medium ${expired ? "text-red-600" : ""}`}>
            {formatDate(contract.expirationDate)}
            {expired && " (vencido)"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
