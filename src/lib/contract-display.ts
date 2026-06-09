import type { EnrichedContract } from "../models";

export function formatContractCode(id: string): string {
  const match = id.match(/(\d+)$/);
  if (match) return `C-${match[1].padStart(3, "0")}`;
  return id.toUpperCase();
}

export function contractRepositoryPath(contract: EnrichedContract): string[] {
  const year = contract.startDate.slice(0, 4);
  return ["Inicio", "Contratos", year, contract.provider.name];
}
