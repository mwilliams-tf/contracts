import type { User } from "../models";

const SESSION_KEY = "clm-chat:session";

export function getActiveUserId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setActiveUserId(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

export function getActiveUser(users: User[]): User | null {
  const id = getActiveUserId();
  if (!id) return null;
  return users.find((u) => u.id === id) ?? null;
}

export function filterContractsForUser<
  T extends { requestingArea: string; providerId: string; stateId: string },
>(contracts: T[], user: User | null): T[] {
  if (!user || user.role === "abogada") return contracts;
  if (user.role === "proveedor" && user.providerId) {
    return contracts.filter((c) => c.providerId === user.providerId);
  }
  if (user.role === "solicitante") {
    if (user.area === "Compras") {
      return contracts.filter(
        (c) =>
          c.requestingArea === "Compras" ||
          c.stateId === "st-pendiente-firma" ||
          c.stateId === "st-finalizado",
      );
    }
    return contracts.filter((c) => c.requestingArea === user.area);
  }
  return contracts;
}

export function userRoleLabel(user: User): string {
  if (user.role === "abogada") return "Legales";
  if (user.role === "proveedor") return `Proveedor · ${user.area}`;
  return user.area;
}

export function userAccessDescription(user: User): string {
  if (user.role === "abogada") return "acceso a todos los contratos";
  if (user.role === "proveedor") return `contratos de ${user.area}`;
  if (user.area === "Compras") {
    return "solicitudes de Compras y contratos en pendiente de firma o finalizados";
  }
  return `solo solicitudes de ${user.area}`;
}
