import type { Contract, User, WorkflowState } from "../models";

export type WorkflowActionVariant = "primary" | "danger" | "secondary";

export interface WorkflowAction {
  id: string;
  label: string;
  toStateId: string;
  variant: WorkflowActionVariant;
  requiresNote?: boolean;
}

export const TERMINAL_STATE_IDS = new Set(["st-rechazado", "st-finalizado"]);

/** Estados donde no se puede adjuntar documento al informar un cambio u objeción */
export const NO_WORKFLOW_ATTACHMENT_STATE_IDS = new Set([
  "st-solicitado",
  "st-pendiente-firma",
  "st-finalizado",
]);

export function allowsWorkflowAttachment(stateId: string): boolean {
  return !NO_WORKFLOW_ATTACHMENT_STATE_IDS.has(stateId);
}

export const STATE_RESPONSIBLE_AREA: Record<string, string> = {
  "st-solicitado": "Legales",
  "st-rechazado": "—",
  "st-rev-legales": "Legales",
  "st-rev-solicitante": "Área solicitante",
  "st-rev-proveedor": "Área solicitante",
  "st-rev-legales-final": "Legales",
  "st-pendiente-firma": "Compras",
  "st-finalizado": "—",
};

const TRANSITIONS: Record<string, WorkflowAction[]> = {
  "st-solicitado": [
    {
      id: "aceptar",
      label: "Aceptar solicitud",
      toStateId: "st-rev-legales",
      variant: "primary",
    },
    {
      id: "rechazar",
      label: "Rechazar solicitud",
      toStateId: "st-rechazado",
      variant: "danger",
      requiresNote: true,
    },
  ],
  "st-rev-legales": [
    {
      id: "enviar-solicitante",
      label: "Enviar a área solicitante",
      toStateId: "st-rev-solicitante",
      variant: "primary",
    },
  ],
  "st-rev-solicitante": [
    {
      id: "aprobar-cambios",
      label: "Aprobar cambios",
      toStateId: "st-rev-proveedor",
      variant: "primary",
    },
    {
      id: "devolver-legales",
      label: "Devolver a legales",
      toStateId: "st-rev-legales",
      variant: "secondary",
      requiresNote: true,
    },
  ],
  "st-rev-proveedor": [
    {
      id: "validar",
      label: "Registrar conformidad del proveedor",
      toStateId: "st-rev-legales-final",
      variant: "primary",
      requiresNote: true,
    },
    {
      id: "devolver-legales-proveedor",
      label: "Registrar objeción o cambios del proveedor",
      toStateId: "st-rev-legales",
      variant: "secondary",
      requiresNote: true,
    },
  ],
  "st-rev-legales-final": [
    {
      id: "pasar-firma",
      label: "Pasar a pendiente de firma",
      toStateId: "st-pendiente-firma",
      variant: "primary",
    },
  ],
  "st-pendiente-firma": [
    {
      id: "finalizar",
      label: "Registrar contrato firmado (PDF)",
      toStateId: "st-finalizado",
      variant: "primary",
    },
  ],
};

export function getTransitionActions(stateId: string): WorkflowAction[] {
  return TRANSITIONS[stateId] ?? [];
}

export function findTransitionAction(
  stateId: string,
  actionId: string,
): WorkflowAction | undefined {
  return getTransitionActions(stateId).find((a) => a.id === actionId);
}

export function canUserPerformAction(
  contract: Contract,
  user: User | null,
  _action: WorkflowAction,
): boolean {
  if (!user || TERMINAL_STATE_IDS.has(contract.stateId)) return false;

  switch (contract.stateId) {
    case "st-solicitado":
    case "st-rev-legales":
    case "st-rev-legales-final":
      return user.role === "abogada";

    case "st-rev-solicitante":
    case "st-rev-proveedor":
      return user.role === "solicitante" && user.area === contract.requestingArea;

    case "st-pendiente-firma":
      return user.role === "solicitante" && user.area === "Compras";

    default:
      return false;
  }
}

export function getAvailableActions(
  contract: Contract,
  user: User | null,
): WorkflowAction[] {
  return getTransitionActions(contract.stateId).filter((action) =>
    canUserPerformAction(contract, user, action),
  );
}

export function getRecipientUserIds(
  toStateId: string,
  contract: Contract,
  users: User[],
): string[] {
  switch (toStateId) {
    case "st-rev-legales":
    case "st-rev-legales-final":
      return users.filter((u) => u.role === "abogada").map((u) => u.id);

    case "st-rev-solicitante":
    case "st-rechazado":
      return users
        .filter((u) => u.role === "solicitante" && u.area === contract.requestingArea)
        .map((u) => u.id);

    case "st-rev-proveedor":
      return users
        .filter((u) => u.role === "solicitante" && u.area === contract.requestingArea)
        .map((u) => u.id);

    case "st-pendiente-firma":
      return users
        .filter((u) => u.role === "solicitante" && u.area === "Compras")
        .map((u) => u.id);

    case "st-finalizado":
      return users
        .filter(
          (u) =>
            u.role === "abogada" ||
            (u.role === "solicitante" && u.area === contract.requestingArea),
        )
        .map((u) => u.id);

    default:
      return [];
  }
}

export function buildNotificationMessage(
  toState: WorkflowState,
  contractTitle: string,
  actorName: string,
): string {
  return `El contrato "${contractTitle}" pasó a "${toState.name}". Acción de ${actorName}.`;
}

export function buildNewRequestNotificationMessage(contractTitle: string): string {
  return `Nueva solicitud: "${contractTitle}" requiere revisión de Legales.`;
}
