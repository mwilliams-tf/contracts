import type { PreviewDocument, TemplateFormValues } from "../../data/contract-templates";
import { resolvePreviewFieldValue } from "../../data/contract-templates";

interface TemplatePreviewProps {
  document: PreviewDocument;
  values: TemplateFormValues;
  previewLabel?: string;
}

export function TemplatePreview({
  document,
  values,
  previewLabel = "Vista previa del borrador",
}: TemplatePreviewProps) {
  return (
    <aside className="flex h-full min-h-[420px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {previewLabel}
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-bank-navy">{document.previewTitle}</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            Drive simulado
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Plantilla:{" "}
          <a
            href={document.publicPath}
            className="font-medium text-bank-navy underline decoration-bank-navy/30 hover:decoration-bank-navy"
            download
          >
            {document.fileName}
          </a>
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500" title={document.drivePath}>
          {document.drivePath}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="rounded border border-slate-100 bg-slate-50/80 p-4 font-serif text-[13px] leading-relaxed text-slate-800 shadow-inner"
          aria-live="polite"
        >
          {document.previewSegments.map((segment, index) => {
            if (segment.kind === "text") {
              return (
                <span key={index} className="whitespace-pre-wrap">
                  {segment.content}
                </span>
              );
            }

            const value = resolvePreviewFieldValue(
              segment.field,
              segment.placeholder,
              values,
            );

            if (value) {
              return (
                <span key={index} className="font-medium text-slate-900">
                  {value}
                </span>
              );
            }

            return (
              <mark
                key={index}
                className="rounded-sm bg-yellow-200 px-0.5 text-yellow-950"
              >
                {segment.placeholder}
              </mark>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Los campos resaltados en amarillo se completan con el formulario. Legales revisará el
          documento completo.
        </p>
      </div>
    </aside>
  );
}
