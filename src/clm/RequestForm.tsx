import { FormEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import { DriveGenerationSuccess } from "./components/DriveGenerationSuccess";
import { RequestStepIndicator } from "./components/RequestStepIndicator";
import { TemplatePreview } from "./components/TemplatePreview";
import type { DocumentOrigin, StoredRequest } from "../models";
import {
  driveFolderPath,
  generatedDraftFileName,
  getTemplateByContractType,
  SERVICE_CLASSIFICATIONS,
  SERVICE_NATURES,
  type TemplateFormValues,
} from "../data/contract-templates";
import { useCorpus } from "../lib/useCorpus";
import { createRequest, saveStoredRequest } from "../lib/requests";
import { saveContractDocument } from "../lib/document-store";
import { extractTextFromFile } from "../lib/text-extract";
import { getActiveUser } from "../lib/session";
import { notifyNewRequest } from "../lib/workflow-storage";

const BUSINESS_APPROVERS = [
  "María González — VP Tecnología",
  "Roberto Fernández — Director de Operaciones",
  "Carolina Ruiz — Gerente de Compras",
];

const CONTRACT_TYPES = ["Servicios IT", "Locación", "Servicios Firma", "Mantenimiento"];
const SERVICE_SUBTYPES = ["SaaS", "Desarrollo", "Infraestructura", "Soporte"];
const CURRENCIES = ["ARS", "USD", "EUR"];

type StandardStep = 1 | 2 | 3;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bank-navy focus:outline-none focus:ring-1 focus:ring-bank-navy";

const labelClass = "block text-sm font-medium text-slate-700";

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bank-navy text-sm font-semibold text-white">
        {number}
      </span>
      <h2 className="text-base font-semibold text-bank-navy">{title}</h2>
    </div>
  );
}

function FileUploadDropzone({
  fileInputRef,
  uploadedFileName,
  onFileChange,
  emptyLabel,
}: {
  fileInputRef: { current: HTMLInputElement | null };
  uploadedFileName: string;
  onFileChange: (file: File | null) => void;
  emptyLabel: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFileChange(e.dataTransfer.files[0] ?? null);
      }}
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-bank-navy/40 hover:bg-slate-100"
    >
      <svg
        className="mb-3 h-10 w-10 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        />
      </svg>
      {uploadedFileName ? (
        <p className="text-sm font-medium text-bank-navy">{uploadedFileName}</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">{emptyLabel}</p>
          <p className="mt-1 text-xs text-slate-500">(.docx, .pdf)</p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function RequestForm() {
  const navigate = useNavigate();
  const corpus = useCorpus();
  const activeUser = getActiveUser(corpus.users);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentOrigin, setDocumentOrigin] = useState<DocumentOrigin>("PlantillaPropia");
  const [standardStep, setStandardStep] = useState<StandardStep>(1);
  const [submittedRequest, setSubmittedRequest] = useState<StoredRequest | null>(null);
  const [error, setError] = useState("");

  const [businessApprover, setBusinessApprover] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerTaxId, setProviderTaxId] = useState("");
  const [legalRepresentative, setLegalRepresentative] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [contractType, setContractType] = useState("Servicios IT");
  const [serviceSubtype, setServiceSubtype] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [observations, setObservations] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [softwareName, setSoftwareName] = useState("");
  const [softwareNotApplicable, setSoftwareNotApplicable] = useState(false);
  const [serviceClassification, setServiceClassification] = useState("");
  const [serviceNature, setServiceNature] = useState("");
  const [serviceObjective, setServiceObjective] = useState("");
  const [serviceScope, setServiceScope] = useState("");
  const [assignedResources, setAssignedResources] = useState("");
  const [serviceSchedule, setServiceSchedule] = useState("");
  const [slaAvailability, setSlaAvailability] = useState("");
  const [minHoursMonthly, setMinHoursMonthly] = useState("");
  const [maxHoursMonthly, setMaxHoursMonthly] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const applicantName = activeUser?.name ?? "Usuario";
  const isStandard = documentOrigin === "PlantillaPropia";
  const activeTemplate = isStandard ? getTemplateByContractType(contractType) : undefined;
  const hasAnnex = Boolean(activeTemplate?.annex);

  const contractPreviewValues = useMemo<TemplateFormValues>(
    () => ({
      providerName,
      providerTaxId,
      legalRepresentative,
      contactEmail,
      serviceSubtype,
      monthlyAmount,
      currency,
      startDate,
      endDate,
    }),
    [
      providerName,
      providerTaxId,
      legalRepresentative,
      contactEmail,
      serviceSubtype,
      monthlyAmount,
      currency,
      startDate,
      endDate,
    ],
  );

  const annexPreviewValues = useMemo<TemplateFormValues>(
    () => ({
      ...contractPreviewValues,
      serviceDescription,
      softwareName: softwareNotApplicable ? "No corresponde" : softwareName,
      serviceClassification,
      serviceNature,
      serviceObjective,
      serviceScope,
      assignedResources,
      serviceSchedule,
      slaAvailability,
      minHoursMonthly,
      maxHoursMonthly,
    }),
    [
      contractPreviewValues,
      serviceDescription,
      softwareName,
      softwareNotApplicable,
      serviceClassification,
      serviceNature,
      serviceObjective,
      serviceScope,
      assignedResources,
      serviceSchedule,
      slaAvailability,
      minHoursMonthly,
      maxHoursMonthly,
    ],
  );

  function resetWizard() {
    setStandardStep(1);
    setSubmittedRequest(null);
    setError("");
  }

  function handleFileChange(file: File | null) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx" && ext !== "pdf") {
      setError("Solo se aceptan archivos .docx o .pdf.");
      return;
    }
    setUploadedFileName(file.name);
    setPendingFile(file);
    setError("");
  }

  function validateContractStep(): string | null {
    if (!businessApprover) return "Seleccioná un aprobador de negocio.";
    if (!providerName.trim()) return "La razón social del proveedor es obligatoria.";
    if (!providerTaxId.trim()) return "El CUIT es obligatorio.";
    if (!legalRepresentative.trim()) return "El representante legal es obligatorio.";
    if (!contactEmail.trim()) return "El email de contacto es obligatorio.";
    if (!startDate) return "La fecha de inicio es obligatoria.";
    if (!endDate) return "La fecha de fin es obligatoria.";

    if (isStandard) {
      if (!serviceSubtype) return "Seleccioná el tipo de servicio.";
      if (!monthlyAmount.trim()) return "El monto mensual es obligatorio.";
      if (!activeTemplate) return "No hay plantilla disponible para ese tipo de contrato.";
    } else {
      if (!costCenter.trim()) return "El centro de costos es obligatorio.";
      if (!totalAmount.trim()) return "El monto total del contrato es obligatorio.";
      if (!uploadedFileName) return "Debés adjuntar el modelo del proveedor (.docx o .pdf).";
    }

    return null;
  }

  function validateAnnexStep(): string | null {
    if (!serviceDescription.trim() && !serviceSubtype.trim()) {
      return "Describí el servicio a contratar.";
    }
    if (!serviceClassification) return "Seleccioná la clasificación del servicio (A.1).";
    if (!serviceNature) return "Seleccioná la naturaleza del servicio (A.2).";
    if (!serviceObjective.trim()) return "El objetivo del servicio (A.3) es obligatorio.";
    if (!softwareNotApplicable && !softwareName.trim()) {
      return "Indicá el nombre del software o marcá «No corresponde».";
    }
    return null;
  }

  function handleGoToAnnex(e: FormEvent) {
    e.preventDefault();
    setError("");
    const validationError = validateContractStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!serviceDescription.trim() && serviceSubtype) {
      setServiceDescription(serviceSubtype);
    }
    setStandardStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const contractError = validateContractStep();
    if (contractError) {
      setError(contractError);
      return;
    }

    if (hasAnnex && standardStep === 2) {
      const annexError = validateAnnexStep();
      if (annexError) {
        setError(annexError);
        return;
      }
    }

    setSubmitting(true);

    try {
      const title = isStandard
        ? `Contrato ${contractType} — ${providerName.trim()}`
        : `Revisión ${contractType} — ${providerName.trim()}`;

      const request = createRequest({
        title,
        service: contractType,
        providerName: providerName.trim(),
        requestingArea: activeUser?.area ?? costCenter.split(" - ")[0] ?? "IT",
        documentOrigin,
        applicantName,
        businessApprover,
        providerTaxId: providerTaxId.trim(),
        legalRepresentative: legalRepresentative.trim(),
        contactEmail: contactEmail.trim(),
        costCenter: costCenter.trim() || undefined,
        serviceSubtype: serviceSubtype || undefined,
        monthlyAmount: monthlyAmount.trim() || undefined,
        totalAmount: totalAmount.trim() || undefined,
        currency,
        startDate,
        endDate,
        uploadedFileName: uploadedFileName || undefined,
        templateId: activeTemplate?.id,
        templateFileName: activeTemplate?.fileName,
        observations: observations.trim() || undefined,
        serviceDescription: serviceDescription.trim() || serviceSubtype || undefined,
        softwareName: softwareNotApplicable ? "No corresponde" : softwareName.trim() || undefined,
        serviceClassification: serviceClassification || undefined,
        serviceNature: serviceNature || undefined,
        serviceObjective: serviceObjective.trim() || undefined,
        serviceScope: serviceScope.trim() || undefined,
        assignedResources: assignedResources.trim() || undefined,
        serviceSchedule: serviceSchedule.trim() || undefined,
        slaAvailability: slaAvailability.trim() || undefined,
        minHoursMonthly: minHoursMonthly.trim() || undefined,
        maxHoursMonthly: maxHoursMonthly.trim() || undefined,
      });

      if (isStandard && activeTemplate) {
        request.generatedDraftName = generatedDraftFileName(request.id);
        request.driveFolderPath = driveFolderPath(request.providerName, request.createdAt.slice(0, 4));
      }

      if (pendingFile) {
        const textContent = await extractTextFromFile(pendingFile);
        await saveContractDocument(request.id, pendingFile, textContent);
      }

      saveStoredRequest(request);
      notifyNewRequest(
        {
          id: request.id,
          title: request.title,
          service: request.service,
          providerId: "prov-req-new",
          requestingArea: request.requestingArea,
          stateId: "st-solicitado",
          documentOrigin: request.documentOrigin,
          parties: ["Banco XYZ", request.providerName],
          signatories: [],
          startDate: request.startDate ?? request.createdAt,
          signatureDate: null,
          expirationDate: request.endDate ?? null,
          documentIds: [],
          sourceIds: [],
          stateHistory: [{ stateId: "st-solicitado", date: request.createdAt }],
        },
        corpus.users,
      );

      if (isStandard) {
        setSubmittedRequest(request);
        setStandardStep(3);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la solicitud. Intentá de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isStandard && standardStep === 3 && submittedRequest) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-bank-navy">Nueva solicitud de contrato</h1>
            <p className="mt-1 text-sm text-slate-600">Solicitud completada — documentos generados en Drive simulado.</p>
          </div>
          <FictitiousDataBadge />
        </header>
        <RequestStepIndicator currentStep={3} />
        <DriveGenerationSuccess
          contractId={submittedRequest.id}
          contractTitle={submittedRequest.title}
          providerName={submittedRequest.providerName}
          draftFileName={submittedRequest.generatedDraftName ?? "Borrador.docx"}
          templateFileName={submittedRequest.templateFileName ?? "Plantilla.docx"}
          createdAt={submittedRequest.createdAt}
        />
      </div>
    );
  }

  const contractForm = (
    <form
      onSubmit={hasAnnex ? handleGoToAnnex : handleSubmit}
      className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error && standardStep === 1 && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {isStandard && activeTemplate && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Plantilla cargada desde Drive</p>
          <p className="mt-1 text-emerald-900/90">
            {activeTemplate.fileName}
            {hasAnnex ? " + Anexo I" : ""} — completá los campos; el borrador se genera automáticamente.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <SectionHeader number={1} title="Datos del solicitante e imputación" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="applicant" className={labelClass}>Solicitante</label>
            <input id="applicant" type="text" value={applicantName} readOnly className={`${inputClass} bg-slate-50 text-slate-600`} />
          </div>
          {!isStandard && (
            <div>
              <label htmlFor="cost-center" className={labelClass}>Centro de costos</label>
              <input id="cost-center" type="text" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className={inputClass} placeholder="Ej.: IT - Desarrollo" />
            </div>
          )}
          <div className={isStandard ? "" : "sm:col-span-2 sm:max-w-sm"}>
            <label htmlFor="approver" className={labelClass}>Aprobador de negocio</label>
            <select id="approver" value={businessApprover} onChange={(e) => setBusinessApprover(e.target.value)} className={inputClass}>
              <option value="">Seleccionar…</option>
              {BUSINESS_APPROVERS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader number={2} title="Datos del proveedor" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="provider-name" className={labelClass}>Razón social</label>
            <input id="provider-name" type="text" value={providerName} onChange={(e) => setProviderName(e.target.value)} className={inputClass} placeholder="Tech Solutions SRL" />
          </div>
          <div>
            <label htmlFor="cuit" className={labelClass}>CUIT</label>
            <input id="cuit" type="text" value={providerTaxId} onChange={(e) => setProviderTaxId(e.target.value)} className={inputClass} placeholder="30-12345678-9" />
          </div>
          <div>
            <label htmlFor="legal-rep" className={labelClass}>Representante legal</label>
            <input id="legal-rep" type="text" value={legalRepresentative} onChange={(e) => setLegalRepresentative(e.target.value)} className={inputClass} placeholder="María López, DNI 12.345.678" />
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>Email de contacto</label>
            <input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} placeholder="contacto@techsolutions.com" />
          </div>
        </div>

        {!isStandard && (
          <>
            <FileUploadDropzone fileInputRef={fileInputRef} uploadedFileName={uploadedFileName} onFileChange={handleFileChange} emptyLabel="Arrastre y suelte el archivo del proveedor aquí, o haga clic para buscar" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="total-amount" className={labelClass}>Monto total del contrato</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input id="total-amount" type="text" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
                </div>
              </div>
              <div>
                <label htmlFor="currency" className={labelClass}>Moneda</label>
                <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="start-date" className={labelClass}>Fecha inicio <span className="text-red-600">*</span></label>
                <input id="start-date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="end-date" className={labelClass}>Fecha fin <span className="text-red-600">*</span></label>
                <input id="end-date" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="contract-type-provider" className={labelClass}>Tipo de contrato</label>
                <select id="contract-type-provider" value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClass}>
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </section>

      {isStandard && (
        <section className="space-y-4">
          <SectionHeader number={3} title="Tipo de contrato y condiciones" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contract-type" className={labelClass}>Tipo de contrato</label>
              <select id="contract-type" value={contractType} onChange={(e) => { setContractType(e.target.value); resetWizard(); }} className={inputClass}>
                {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="service-subtype" className={labelClass}>Tipo de servicio</label>
              <select id="service-subtype" value={serviceSubtype} onChange={(e) => setServiceSubtype(e.target.value)} className={inputClass}>
                <option value="">Seleccionar…</option>
                {SERVICE_SUBTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="monthly-amount" className={labelClass}>Monto mensual</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input id="monthly-amount" type="text" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className={`${inputClass} pl-7`} placeholder="0" />
              </div>
            </div>
            <div>
              <label htmlFor="currency-standard" className={labelClass}>Moneda</label>
              <select id="currency-standard" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="start-date-standard" className={labelClass}>Fecha inicio <span className="text-red-600">*</span></label>
              <input id="start-date-standard" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="end-date-standard" className={labelClass}>Fecha fin <span className="text-red-600">*</span></label>
              <input id="end-date-standard" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>
      )}

      {isStandard && !hasAnnex && (
        <section className="space-y-4">
          <SectionHeader number={4} title="Observaciones puntuales" />
          <textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} rows={4} className={inputClass} placeholder="Ej.: El proveedor solicita cláusula de confidencialidad ampliada." />
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={() => navigate("/")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-bank-navy px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-bank-navy/90 disabled:opacity-50">
          {submitting ? "Guardando…" : hasAnnex ? "Siguiente: completar Anexo I" : isStandard ? "Generar solicitud" : "Enviar para revisión legal"}
        </button>
      </div>
    </form>
  );

  const annexForm = activeTemplate?.annex && (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
      )}

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
        <p className="font-medium">Anexo I cargado desde Drive</p>
        <p className="mt-1 text-emerald-900/90">{activeTemplate.annex.fileName} — completá la propuesta comercial del servicio.</p>
      </div>

      <section className="space-y-4">
        <SectionHeader number={1} title="Descripción del servicio" />
        <div className="grid gap-4">
          <div>
            <label htmlFor="service-description" className={labelClass}>Descripción del servicio</label>
            <textarea id="service-description" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} rows={3} className={inputClass} placeholder="Ej.: Plataforma SaaS de gestión documental para el área de Legales" />
          </div>
          <div>
            <label htmlFor="software-name" className={labelClass}>Nombre del software / aplicación</label>
            <input id="software-name" type="text" value={softwareName} onChange={(e) => setSoftwareName(e.target.value)} disabled={softwareNotApplicable} className={`${inputClass} disabled:bg-slate-50`} placeholder="Ej.: DocFlow Enterprise" />
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={softwareNotApplicable} onChange={(e) => setSoftwareNotApplicable(e.target.checked)} />
              No corresponde
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader number={2} title="Clasificación y alcance (Anexo I — Sección A)" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="classification" className={labelClass}>A.1 Clasificación</label>
            <select id="classification" value={serviceClassification} onChange={(e) => setServiceClassification(e.target.value)} className={inputClass}>
              <option value="">Seleccionar…</option>
              {SERVICE_CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nature" className={labelClass}>A.2 Naturaleza del servicio</label>
            <select id="nature" value={serviceNature} onChange={(e) => setServiceNature(e.target.value)} className={inputClass}>
              <option value="">Seleccionar…</option>
              {SERVICE_NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="objective" className={labelClass}>A.3 Objetivo</label>
            <input id="objective" type="text" value={serviceObjective} onChange={(e) => setServiceObjective(e.target.value)} className={inputClass} placeholder="Ej.: Centralizar la gestión de contratos del banco" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="scope" className={labelClass}>A.4 Alcance y responsabilidades</label>
            <input id="scope" type="text" value={serviceScope} onChange={(e) => setServiceScope(e.target.value)} className={inputClass} placeholder="Ej.: Hosting, soporte L2 y mantenimiento evolutivo" />
          </div>
          <div>
            <label htmlFor="resources" className={labelClass}>A.5 Recursos asignados</label>
            <input id="resources" type="text" value={assignedResources} onChange={(e) => setAssignedResources(e.target.value)} className={inputClass} placeholder="Ej.: 2 analistas + 1 líder técnico" />
          </div>
          <div>
            <label htmlFor="schedule" className={labelClass}>A.6 Horario y lugar</label>
            <input id="schedule" type="text" value={serviceSchedule} onChange={(e) => setServiceSchedule(e.target.value)} className={inputClass} placeholder="Ej.: Remoto, horario bancario" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader number={3} title="SLA (Anexo I — Sección B, extracto)" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sla" className={labelClass}>B.1 Disponibilidad del servicio</label>
            <input id="sla" type="text" value={slaAvailability} onChange={(e) => setSlaAvailability(e.target.value)} className={inputClass} placeholder="Ej.: 99,5% mensual" />
          </div>
          <div>
            <label htmlFor="min-hours" className={labelClass}>Horas mínimas mensuales</label>
            <input id="min-hours" type="text" value={minHoursMonthly} onChange={(e) => setMinHoursMonthly(e.target.value)} className={inputClass} placeholder="Ej.: 80" />
          </div>
          <div>
            <label htmlFor="max-hours" className={labelClass}>Horas máximas mensuales</label>
            <input id="max-hours" type="text" value={maxHoursMonthly} onChange={(e) => setMaxHoursMonthly(e.target.value)} className={inputClass} placeholder="Ej.: 120" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader number={4} title="Observaciones puntuales" />
        <p className="text-sm text-slate-600">Si la plantilla no contempla tu caso, describilo acá. Legales lo revisará junto con el borrador.</p>
        <textarea id="observations-annex" value={observations} onChange={(e) => setObservations(e.target.value)} rows={4} className={inputClass} placeholder="Ej.: El proveedor solicita cláusula de confidencialidad ampliada." />
      </section>

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={() => { setStandardStep(1); setError(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Volver al contrato</button>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-bank-navy px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-bank-navy/90 disabled:opacity-50">
            {submitting ? "Generando…" : "Generar solicitud"}
          </button>
        </div>
      </div>
    </form>
  );

  const useTwoColumn =
    isStandard &&
    activeTemplate &&
    (standardStep === 1 || (standardStep === 2 && activeTemplate.annex));

  return (
    <div className={`mx-auto space-y-6 ${useTwoColumn ? "max-w-6xl" : "max-w-3xl"}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bank-navy">Nueva solicitud de contrato</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isStandard
              ? hasAnnex && standardStep === 2
                ? "Paso 2 — Completá el Anexo I (propuesta comercial)."
                : "Modelo estándar del banco — elegí el tipo de servicio y completá los campos; el sistema trae la plantilla oficial."
              : "Modelo del proveedor — adjuntá el documento para revisión legal"}
          </p>
        </div>
        <FictitiousDataBadge />
      </header>

      <div className="flex rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => { setDocumentOrigin("PlantillaPropia"); resetWizard(); }} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${isStandard ? "bg-bank-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
          Modelo de contrato estándar
        </button>
        <button type="button" onClick={() => { setDocumentOrigin("ModeloDelProveedor"); resetWizard(); }} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${!isStandard ? "bg-bank-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
          Modelo de contrato del proveedor
        </button>
      </div>

      {isStandard && hasAnnex && <RequestStepIndicator currentStep={standardStep} />}

      {useTwoColumn && standardStep === 2 && activeTemplate?.annex ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
          <div>{annexForm}</div>
          <div className="lg:sticky lg:top-4">
            <TemplatePreview document={activeTemplate.annex} values={annexPreviewValues} previewLabel="Vista previa del Anexo I" />
          </div>
        </div>
      ) : useTwoColumn && activeTemplate ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
          <div>{contractForm}</div>
          <div className="lg:sticky lg:top-4">
            <TemplatePreview document={activeTemplate} values={contractPreviewValues} />
          </div>
        </div>
      ) : (
        contractForm
      )}
    </div>
  );
}
