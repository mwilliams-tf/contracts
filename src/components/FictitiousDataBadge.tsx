export function FictitiousDataBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800"
      title="Este prototipo utiliza datos ficticios con fines de demostración"
    >
      <span aria-hidden="true">⚠</span>
      Datos ficticios
    </span>
  );
}
