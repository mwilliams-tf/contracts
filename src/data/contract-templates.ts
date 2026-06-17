export type TemplateFieldKey =
  | "providerName"
  | "providerTaxId"
  | "legalRepresentative"
  | "contactEmail"
  | "serviceSubtype"
  | "monthlyAmount"
  | "currency"
  | "startDate"
  | "endDate"
  | "serviceDescription"
  | "softwareName"
  | "serviceClassification"
  | "serviceNature"
  | "serviceObjective"
  | "serviceScope"
  | "assignedResources"
  | "serviceSchedule"
  | "slaAvailability"
  | "minHoursMonthly"
  | "maxHoursMonthly";

export type TemplatePreviewSegment =
  | { kind: "text"; content: string }
  | { kind: "field"; field: TemplateFieldKey; placeholder: string };

export interface PreviewDocument {
  fileName: string;
  drivePath: string;
  publicPath: string;
  previewTitle: string;
  previewSegments: TemplatePreviewSegment[];
}

export interface AnnexTemplate extends PreviewDocument {
  id: string;
}

export interface ContractTemplate extends PreviewDocument {
  id: string;
  contractType: string;
  annex?: AnnexTemplate;
}

export type TemplateFormValues = Partial<Record<TemplateFieldKey, string>>;

const IT_PREVIEW: TemplatePreviewSegment[] = [
  { kind: "text", content: "Ciudad Autónoma de Buenos Aires, " },
  { kind: "field", field: "startDate", placeholder: "[__]" },
  { kind: "text", content: " de " },
  { kind: "field", field: "startDate", placeholder: "[_________]" },
  { kind: "text", content: " de 20" },
  { kind: "field", field: "startDate", placeholder: "[__]" },
  {
    kind: "text",
    content:
      ".\n\nBanco Industrial S.A. (CUIT 30-68502995-9)\nMaipú 1210, piso 7°, Ciudad Autónoma de Buenos Aires\n\nRef.: Oferta PROVEEDOR [XX/202X]\n\nDe nuestra consideración,\n\nEn mi carácter de ",
  },
  {
    kind: "field",
    field: "legalRepresentative",
    placeholder: "[representante legal / presidente / socio gerente / apoderado]",
  },
  { kind: "text", content: " de " },
  { kind: "field", field: "providerName", placeholder: "[NOMBRE DEL PROVEEDOR]" },
  { kind: "text", content: " (CUIT " },
  { kind: "field", field: "providerTaxId", placeholder: "_________" },
  {
    kind: "text",
    content:
      "), conforme lo acredito con la documentación que se acompaña a la presente, con domicilio legal en [_____] de [______] y electrónico en ",
  },
  { kind: "field", field: "contactEmail", placeholder: "[Identificar e-mail]" },
  {
    kind: "text",
    content:
      ' (en adelante, el "Proveedor"), me dirijo a Uds. a fin de efectuarles una oferta irrevocable de contrato de provisión de servicios informáticos, que se regirá por los términos y condiciones que se detallan en el Anexo A de la presente.\n\nAnexo A — Objeto del servicio\n\nEl Proveedor prestará servicios de tipo ',
  },
  {
    kind: "field",
    field: "serviceSubtype",
    placeholder: "[describir el servicio, en particular si se trata de software o RRHH]",
  },
  { kind: "text", content: ".\n\nPrecio: el Cliente abonará al Proveedor la suma de " },
  { kind: "field", field: "monthlyAmount", placeholder: "[en números y en letras]" },
  { kind: "text", content: " " },
  { kind: "field", field: "currency", placeholder: "[moneda]" },
  { kind: "text", content: " por mes, más impuestos.\n\nVigencia: desde " },
  { kind: "field", field: "startDate", placeholder: "[fecha inicio]" },
  { kind: "text", content: " hasta " },
  { kind: "field", field: "endDate", placeholder: "[fecha fin]" },
  {
    kind: "text",
    content:
      ".\n\n[…] Cláusulas de seguridad, continuidad y certificaciones completadas por Legales en revisión.",
  },
];

const IT_ANNEX_PREVIEW: TemplatePreviewSegment[] = [
  {
    kind: "text",
    content:
      'ANEXO I – PROPUESTA COMERCIAL\n\n[Si alguna cláusula no aplica, poner "no aplica", pero no borrar porque alteran las referencias efectuadas en el cuerpo del contrato]\n\nDescripción y características del Servicio.\n\nEl Servicio a prestar por el Proveedor al Cliente consistirá en ',
  },
  {
    kind: "field",
    field: "serviceDescription",
    placeholder: "[describir el servicio, en particular si se trata de software o RRHH]",
  },
  {
    kind: "text",
    content:
      ", conforme a las condiciones que se detallan a continuación:\n\nNombre del Software / Aplicación:\n☐ ",
  },
  {
    kind: "field",
    field: "softwareName",
    placeholder: "[…………………………………………….]",
  },
  { kind: "text", content: "\n☐ No corresponde\n\nA.1. Clasificación.\n☐ SaaS  ☐ IaaS  ☐ PaaS  ☐ SIS  ☐ SOC  ☐ …\n\nSelección: " },
  { kind: "field", field: "serviceClassification", placeholder: "[clasificación]" },
  { kind: "text", content: "\n\nA.2. Naturaleza del Servicio.\n☐ Delegación de procesos  ☐ Delegación de actividades  ☐ Delegación de servicios  ☐ No es delegación\n\nSelección: " },
  { kind: "field", field: "serviceNature", placeholder: "[naturaleza]" },
  { kind: "text", content: "\n\nA.3. Objetivo.\n" },
  { kind: "field", field: "serviceObjective", placeholder: "[_______]" },
  { kind: "text", content: "\n\nA.4. Alcance y responsabilidades de los procesos, servicios y/o actividades delegadas.\n" },
  { kind: "field", field: "serviceScope", placeholder: "[_______]" },
  { kind: "text", content: "\n\nA.5. Recursos asignados al Servicio.\n" },
  { kind: "field", field: "assignedResources", placeholder: "[_______]" },
  { kind: "text", content: "\n\nA.6. Horario y lugar de prestación del Servicio.\n" },
  { kind: "field", field: "serviceSchedule", placeholder: "[_______]" },
  {
    kind: "text",
    content:
      "\n\n——— Pág. 2 ———\n\nService Level Agreement (SLA) y métricas de desempeño.\n\nB.1. Objetivo / Disponibilidad del Servicio.\n",
  },
  { kind: "field", field: "slaAvailability", placeholder: "[_______]" },
  {
    kind: "text",
    content:
      "\n\nLas Partes acuerdan que la prestación del Servicio implicará como mínimo ",
  },
  { kind: "field", field: "minHoursMonthly", placeholder: "[en números y en letras]" },
  { kind: "text", content: " y como máximo " },
  { kind: "field", field: "maxHoursMonthly", placeholder: "[en números y en letras]" },
  {
    kind: "text",
    content:
      " horas mensuales de trabajo de los dependientes del Proveedor.\n\nB.2. Clasificación, tiempo de respuesta y resolución de ciberincidentes.\n[_______]\n\n[…] Resto del Anexo completado por Legales en revisión.",
  },
];

function stubPreview(contractLabel: string): TemplatePreviewSegment[] {
  return [
    {
      kind: "text",
      content: `Plantilla oficial de ${contractLabel}.\n\nEl solicitante completa los datos de negocio; Legales revisa el borrador generado antes de avanzar en el workflow.\n\n`,
    },
    { kind: "field", field: "providerName", placeholder: "[NOMBRE DEL PROVEEDOR]" },
    { kind: "text", content: " — CUIT " },
    { kind: "field", field: "providerTaxId", placeholder: "[CUIT]" },
    { kind: "text", content: "\nVigencia: " },
    { kind: "field", field: "startDate", placeholder: "[fecha inicio]" },
    { kind: "text", content: " a " },
    { kind: "field", field: "endDate", placeholder: "[fecha fin]" },
    { kind: "text", content: "." },
  ];
}

export const SERVICE_CLASSIFICATIONS = [
  "SaaS (Software as a Service)",
  "IaaS (Infrastructure as a Service)",
  "PaaS (Platform as a Service)",
  "SIS — Infraestructuras tradicionales",
  "SOC — Operaciones de seguridad",
  "OSC — Otros servicios críticos",
  "NOD — No es delegación",
];

export const SERVICE_NATURES = [
  "Delegación de procesos",
  "Delegación de actividades",
  "Delegación de servicios",
  "No es una delegación",
];

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "tpl-it-2026",
    contractType: "Servicios IT",
    fileName: "Modelo único contrato IT 2026.docx",
    drivePath: "/Legales/Plantillas/IT/Modelo único contrato IT 2026.docx",
    publicPath: "/templates/modelo-unico-contrato-it-2026.docx",
    previewTitle: "Carta oferta y Anexo A (extracto)",
    previewSegments: IT_PREVIEW,
    annex: {
      id: "annex-it-i",
      fileName: "MODELO ANEXO I.docx",
      drivePath: "/Legales/Plantillas/IT/MODELO ANEXO I.docx",
      publicPath: "/templates/modelo-anexo-i.docx",
      previewTitle: "Anexo I — Propuesta comercial (págs. 1-2)",
      previewSegments: IT_ANNEX_PREVIEW,
    },
  },
  {
    id: "tpl-locacion",
    contractType: "Locación",
    fileName: "Modelo contrato Locación 2026.docx",
    drivePath: "/Legales/Plantillas/Locación/Modelo contrato Locación 2026.docx",
    publicPath: "/templates/modelo-contrato-locacion-2026.docx",
    previewTitle: "Contrato de locación (extracto)",
    previewSegments: stubPreview("Locación"),
  },
  {
    id: "tpl-firma",
    contractType: "Servicios Firma",
    fileName: "Modelo contrato Servicios Firma 2026.docx",
    drivePath: "/Legales/Plantillas/Firma/Modelo contrato Servicios Firma 2026.docx",
    publicPath: "/templates/modelo-contrato-firma-2026.docx",
    previewTitle: "Contrato de servicios de firma (extracto)",
    previewSegments: stubPreview("Servicios Firma"),
  },
  {
    id: "tpl-mantenimiento",
    contractType: "Mantenimiento",
    fileName: "Modelo contrato Mantenimiento 2026.docx",
    drivePath: "/Legales/Plantillas/Mantenimiento/Modelo contrato Mantenimiento 2026.docx",
    publicPath: "/templates/modelo-contrato-mantenimiento-2026.docx",
    previewTitle: "Contrato de mantenimiento (extracto)",
    previewSegments: stubPreview("Mantenimiento"),
  },
];

export function getTemplateByContractType(contractType: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.contractType === contractType);
}

function formatDateEs(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateDay(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getDate());
}

function formatDateMonth(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { month: "long" });
}

function formatDateYearShort(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear()).slice(-2);
}

export function resolvePreviewFieldValue(
  field: TemplateFieldKey,
  placeholder: string,
  values: TemplateFormValues,
): string {
  let raw = values[field]?.trim() ?? "";

  if (field === "serviceDescription" && !raw && values.serviceSubtype?.trim()) {
    raw = values.serviceSubtype.trim();
  }

  if (!raw) return "";

  if (field === "startDate") {
    if (placeholder === "[__]") return formatDateDay(raw);
    if (placeholder === "[_________]") return formatDateMonth(raw);
    if (placeholder.startsWith("20")) return formatDateYearShort(raw);
    return formatDateEs(raw);
  }
  if (field === "endDate") return formatDateEs(raw);
  if (field === "monthlyAmount" && values.currency) {
    return `${raw} (${values.currency})`;
  }
  if ((field === "minHoursMonthly" || field === "maxHoursMonthly") && raw) {
    return `${raw} hs`;
  }
  return raw;
}

export function generatedDraftFileName(requestId: string): string {
  const code = requestId.replace(/^req-/, "REQ-").toUpperCase();
  return `${code}_Borrador.docx`;
}

export function driveFolderPath(providerName: string, year: string): string {
  const safe = providerName.replace(/\s+/g, "_");
  return `/Legales/Contratos/${year}/${safe}`;
}
