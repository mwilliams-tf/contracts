import type { DocumentOrigin, StoredRequest } from "../models";

const REQUESTS_KEY = "clm-chat:requests";

export function loadStoredRequests(): StoredRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredRequest[];
  } catch {
    return [];
  }
}

export function getStoredRequestById(id: string): StoredRequest | undefined {
  return loadStoredRequests().find((request) => request.id === id);
}

export function saveStoredRequest(request: StoredRequest): void {
  const existing = loadStoredRequests();
  existing.push(request);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(existing));
}

export function replaceStoredRequests(requests: StoredRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function createRequest(data: {
  title: string;
  service: string;
  providerName: string;
  requestingArea: string;
  documentOrigin: DocumentOrigin;
  applicantName: string;
  businessApprover: string;
  providerTaxId: string;
  legalRepresentative: string;
  contactEmail: string;
  costCenter?: string;
  serviceSubtype?: string;
  monthlyAmount?: string;
  requiresNda?: boolean;
  totalAmount?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  uploadedFileName?: string;
  templateId?: string;
  templateFileName?: string;
  generatedDraftName?: string;
  generatedAnnexName?: string;
  annexTemplateFileName?: string;
  driveFolderPath?: string;
  observations?: string;
  serviceDescription?: string;
  softwareName?: string;
  serviceClassification?: string;
  serviceNature?: string;
  serviceObjective?: string;
  serviceScope?: string;
  assignedResources?: string;
  serviceSchedule?: string;
  slaAvailability?: string;
  minHoursMonthly?: string;
  maxHoursMonthly?: string;
}): StoredRequest {
  return {
    id: `req-${Date.now()}`,
    title: data.title,
    service: data.service,
    providerName: data.providerName,
    requestingArea: data.requestingArea,
    documentOrigin: data.documentOrigin,
    createdAt: new Date().toISOString().split("T")[0],
    applicantName: data.applicantName,
    businessApprover: data.businessApprover,
    providerTaxId: data.providerTaxId,
    legalRepresentative: data.legalRepresentative,
    contactEmail: data.contactEmail,
    costCenter: data.costCenter,
    serviceSubtype: data.serviceSubtype,
    monthlyAmount: data.monthlyAmount,
    requiresNda: data.requiresNda,
    totalAmount: data.totalAmount,
    currency: data.currency,
    startDate: data.startDate,
    endDate: data.endDate,
    uploadedFileName: data.uploadedFileName,
    templateId: data.templateId,
    templateFileName: data.templateFileName,
    generatedDraftName: data.generatedDraftName,
    generatedAnnexName: data.generatedAnnexName,
    annexTemplateFileName: data.annexTemplateFileName,
    driveFolderPath: data.driveFolderPath,
    observations: data.observations,
    serviceDescription: data.serviceDescription,
    softwareName: data.softwareName,
    serviceClassification: data.serviceClassification,
    serviceNature: data.serviceNature,
    serviceObjective: data.serviceObjective,
    serviceScope: data.serviceScope,
    assignedResources: data.assignedResources,
    serviceSchedule: data.serviceSchedule,
    slaAvailability: data.slaAvailability,
    minHoursMonthly: data.minHoursMonthly,
    maxHoursMonthly: data.maxHoursMonthly,
  };
}
