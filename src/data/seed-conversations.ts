import type { Conversation, Turn } from "../models";

export const SEED_ACME_ID = "conv-seed-acme";
export const SEED_2028_ID = "conv-seed-2028";
export const SEED_STANLEY_ID = "conv-seed-stanley";

export const ACME_CONTRACT_ID = "ctr-001";
export const STANLEY_CONTRACT_ID = "ctr-006";

const SEED_BASE = "2026-06-01T10:00:00.000Z";

function turn(partial: Omit<Turn, "timestamp"> & { timestamp?: string }): Turn {
  return {
    principalContractId: null,
    referencedContractIds: [],
    ...partial,
    timestamp: partial.timestamp ?? new Date().toISOString(),
  };
}

/** Historial congelado Acme — se completa en Issue 4 */
export function buildAcmeSeedMessages(): Turn[] {
  return [
    turn({
      role: "user",
      text: "¿Cuál es el vencimiento del contrato Acme?",
      principalContractId: ACME_CONTRACT_ID,
    }),
    turn({
      role: "assistant",
      text:
        "Vencimiento — Contrato Acme:\n\n• CLM: 01/03/2027\n• Mail más reciente (02/03/2026, María López): confirma vencimiento al 01/03/2027; firma del Banco pendiente.\n• Mail anterior del proveedor (25/02/2026) mencionaba 01/03/2026 — prevalece la fuente más reciente.",
      principalContractId: ACME_CONTRACT_ID,
      citations: [
        {
          sourceId: "src-002",
          contractId: ACME_CONTRACT_ID,
          sender: "maria.lopez@banco.example",
          date: "2026-03-02",
          subject: "Confirmación de vencimiento — Acme Cloud",
          simulatedLink: "#/fuentes/src-002",
        },
        {
          sourceId: "src-001",
          contractId: ACME_CONTRACT_ID,
          sender: "acme.legal@example.com",
          date: "2026-02-25",
          subject: "Propuesta de renovación — Acme Cloud",
          simulatedLink: "#/fuentes/src-001",
        },
      ],
    }),
    turn({
      role: "user",
      text: "¿Y los firmantes?",
      principalContractId: ACME_CONTRACT_ID,
    }),
    turn({
      role: "assistant",
      text:
        "Firmantes — Contrato Acme:\n\n• Carlos Acme (Apoderado Proveedor) — firmado\n• María López (Apoderada Banco) — pendiente\n\nEstado: Pendiente de firma.",
      principalContractId: ACME_CONTRACT_ID,
      citations: [
        {
          sourceId: "src-002",
          contractId: ACME_CONTRACT_ID,
          sender: "maria.lopez@banco.example",
          date: "2026-03-02",
          subject: "Confirmación de vencimiento — Acme Cloud",
          simulatedLink: "#/fuentes/src-002",
        },
      ],
    }),
  ];
}

/** Portfolio congelado 2028 — se completa en Issue 4 */
export function build2028SeedMessages(): Turn[] {
  return [
    turn({
      role: "user",
      text: "¿Qué contratos vencen en 2028?",
    }),
    turn({
      role: "assistant",
      text:
        "Encontré 2 contratos con vencimiento en 2028:\n\n1. Contrato de monitoreo perimetral (Seguridad Total S.R.L.) — vence 15/01/2028.\n2. Renovación alquiler sucursal Quilmes (Inmobiliaria Quilmes S.A.) — vence 31/05/2028.",
      principalContractId: null,
      referencedContractIds: ["ctr-002", "ctr-005"],
      citations: [
        {
          sourceId: "src-003",
          contractId: "ctr-002",
          sender: "roberto@seguridadtotal.example",
          date: "2026-02-01",
          subject: "Confirmación de firma — monitoreo perimetral",
          simulatedLink: "#/fuentes/src-003",
        },
      ],
    }),
  ];
}

export function buildStanleySeedMessages(): Turn[] {
  return [];
}

export function buildSeedConversations(userId: string): Conversation[] {
  const createdAt = SEED_BASE;
  return [
    {
      id: SEED_ACME_ID,
      userId,
      title: "Contrato de servicios cloud — Acme",
      type: "anchored",
      focusContractId: ACME_CONTRACT_ID,
      status: "frozen",
      createdAt,
      updatedAt: "2026-06-01T11:30:00.000Z",
      messages: buildAcmeSeedMessages(),
    },
    {
      id: SEED_2028_ID,
      userId,
      title: "Contratos que vencen en 2028",
      type: "portfolio",
      focusContractId: null,
      status: "frozen",
      createdAt,
      updatedAt: "2026-06-01T11:00:00.000Z",
      messages: build2028SeedMessages(),
    },
    {
      id: SEED_STANLEY_ID,
      userId,
      title: "Contrato Servicios IT — Stanley",
      type: "anchored",
      focusContractId: STANLEY_CONTRACT_ID,
      status: "live",
      createdAt,
      updatedAt: createdAt,
      messages: buildStanleySeedMessages(),
    },
  ];
}
