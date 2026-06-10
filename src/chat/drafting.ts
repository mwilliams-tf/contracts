import type { ChatContext, DraftProposal } from "../models";
import { resolveAcmeContractId } from "./acme-demo";
import { resolveStanleyContractId } from "./stanley-demo";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const REDACTION_KEYWORDS = [
  "amplia",
  "ampliá",
  "ampliar",
  "redacta",
  "redactá",
  "redactar",
  "nueva redaccion",
  "nueva redacción",
  "propone redaccion",
  "propone redacción",
  "contrapropuesta",
];

export function isDraftRequest(query: string): boolean {
  const q = normalize(query);
  return REDACTION_KEYWORDS.some((kw) => q.includes(kw));
}

export function proposeDraft(query: string, ctx: ChatContext): DraftProposal | null {
  if (!isDraftRequest(query)) return null;

  const contractId =
    ctx.focusContractId ??
    (normalize(query).includes("stanley")
      ? resolveStanleyContractId(ctx)
      : resolveAcmeContractId(ctx));

  const q = normalize(query);
  const clauseRef =
    q.includes("clausula 9") || q.includes("cláusula 9") ? "Cláusula 9" : "Cláusula 9";

  const basedOn: string[] = [];
  if (normalize(query).includes("acme") || ctx.conversationType === "anchored") {
    basedOn.push(resolveAcmeContractId(ctx));
  }

  return {
    contractId,
    clauseRef,
    proposedText:
      "Limitación de responsabilidad (Cláusula 9 — redacción propuesta):\n\n" +
      "Salvo dolo o culpa grave, la responsabilidad total acumulada del Proveedor no excederá el veinte por ciento (20%) del fee anual del contrato. " +
      "Se excluyen expresamente lucro cesante e indirectos, salvo pérdida de datos personales por incumplimiento de medidas de seguridad acordadas. " +
      "El Proveedor mantendrá cobertura de seguro de responsabilidad civil por un monto no inferior al fee anual. " +
      "Esta redacción incorpora el precedente de negociación del contrato Acme (priorización de fuente reciente y carve-out para datos personales).",
    basedOnContractIds: basedOn.filter((id) => id !== contractId),
  };
}
