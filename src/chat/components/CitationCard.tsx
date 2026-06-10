import type { Citation, Corpus } from "../../models";
import { formatDate, getContractById } from "../../lib/corpus";

interface CitationCardProps {
  citation: Citation;
  corpus?: Corpus;
}

export function CitationCard({ citation, corpus }: CitationCardProps) {
  const origin = corpus ? getContractById(corpus, citation.contractId) : undefined;

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="font-medium text-slate-800">{citation.subject}</p>
      {origin && (
        <p className="mt-1 text-xs text-slate-500">Contrato: {origin.title}</p>
      )}
      <dl className="mt-2 grid gap-1 text-xs text-slate-600">
        <div className="flex gap-2">
          <dt className="font-medium">Remitente:</dt>
          <dd>{citation.sender}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Fecha:</dt>
          <dd>{formatDate(citation.date)}</dd>
        </div>
      </dl>
      <a
        href={citation.simulatedLink}
        className="mt-2 inline-block text-xs font-medium text-bank-navy hover:underline"
        onClick={(e) => e.preventDefault()}
        title="Enlace simulado — prototipo"
      >
        Ver fuente →
      </a>
    </div>
  );
}
