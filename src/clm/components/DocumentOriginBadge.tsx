import type { DocumentOrigin } from "../../models";
import { documentOriginLabel } from "../../lib/corpus";

interface DocumentOriginBadgeProps {
  origin: DocumentOrigin;
}

export function DocumentOriginBadge({ origin }: DocumentOriginBadgeProps) {
  const isOwn = origin === "PlantillaPropia";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
        isOwn
          ? "border-indigo-200 bg-indigo-50 text-indigo-800"
          : "border-orange-200 bg-orange-50 text-orange-800"
      }`}
    >
      {isOwn ? "📄" : "📥"} {documentOriginLabel(origin)}
    </span>
  );
}
