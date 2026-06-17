import { Link } from "react-router-dom";
import { driveFolderPath } from "../../data/contract-templates";

interface DriveGenerationSuccessProps {
  contractId: string;
  contractTitle: string;
  providerName: string;
  draftFileName: string;
  templateFileName: string;
  createdAt: string;
}

export function DriveGenerationSuccess({
  contractId,
  contractTitle,
  providerName,
  draftFileName,
  templateFileName,
  createdAt,
}: DriveGenerationSuccessProps) {
  const year = createdAt.slice(0, 4);
  const folderPath = driveFolderPath(providerName, year);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-bank-navy">Solicitud generada en Drive</h2>
        <p className="mt-2 text-sm text-slate-700">
          El borrador quedó disponible para revisión de Legales.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-bank-navy">Carpeta del contrato</h3>
        <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
          {folderPath}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{contractTitle}</span>
        </p>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-lg" aria-hidden="true">
              📄
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-medium text-bank-navy">{draftFileName}</p>
              <p className="mt-1 text-xs text-slate-500">
                Generado desde {templateFileName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={`/contratos/${contractId}/repositorio`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver repositorio simulado
        </Link>
        <Link
          to="/"
          className="rounded-lg bg-bank-navy px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-bank-navy/90"
        >
          Ir al tablero
        </Link>
      </div>
    </div>
  );
}
