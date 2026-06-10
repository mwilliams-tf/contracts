import type { ChatContext, DraftProposal } from "../models";
import { isStanleyConversation, threadMentionsClausula9 } from "./conversation-context";
import { resolveStanleyContractId } from "./stanley-demo";
import { resolveAcmeContractId } from "./acme-demo";

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
  "solucion",
  "propones",
  "propone",
  "propuesta",
];

export function isDraftRequest(query: string, ctx?: ChatContext): boolean {
  const q = normalize(query);
  if (REDACTION_KEYWORDS.some((kw) => q.includes(kw))) return true;
  if (ctx && q.includes("esa clausula") && threadMentionsClausula9(ctx)) return true;
  return false;
}

export function proposeDraft(query: string, ctx: ChatContext): DraftProposal | null {
  if (!isStanleyConversation(query, ctx)) return null;
  if (!isDraftRequest(query, ctx)) return null;

  const contractId = resolveStanleyContractId(ctx);

  return {
    contractId,
    clauseRef: "Cláusula 9",
    proposedText:
      "Limitación de responsabilidad (Cláusula 9 — redacción propuesta):\n\n" +
      "Salvo dolo o culpa grave, la responsabilidad total acumulada del Proveedor no excederá el veinte por ciento (20%) del fee anual del contrato. " +
      "Se excluyen expresamente lucro cesante e indirectos, salvo pérdida de datos personales por incumplimiento de medidas de seguridad acordadas. " +
      "El Proveedor mantendrá cobertura de seguro de responsabilidad civil por un monto no inferior al fee anual. " +
      "Esta redacción incorpora el precedente de negociación del contrato Acme (priorización de fuente reciente y carve-out para datos personales).",
    basedOnContractIds: [resolveAcmeContractId(ctx)].filter((id) => id !== contractId),
  };
}
