import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FictitiousDataBadge } from "../components/FictitiousDataBadge";
import type { DocumentOrigin } from "../models";
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
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const applicantName = activeUser?.name ?? "Usuario";

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

  function validate(): string | null {
    if (!businessApprover) return "Seleccioná un aprobador de negocio.";
    if (!providerName.trim()) return "La razón social del proveedor es obligatoria.";
    if (!providerTaxId.trim()) return "El CUIT es obligatorio.";
    if (!legalRepresentative.trim()) return "El representante legal es obligatorio.";
    if (!contactEmail.trim()) return "El email de contacto es obligatorio.";
    if (!startDate) return "La fecha de inicio es obligatoria.";
    if (!endDate) return "La fecha de fin es obligatoria.";

    if (documentOrigin === "PlantillaPropia") {
      if (!serviceSubtype) return "Seleccioná el tipo de servicio.";
      if (!monthlyAmount.trim()) return "El monto mensual es obligatorio.";
    } else {
      if (!costCenter.trim()) return "El centro de costos es obligatorio.";
      if (!totalAmount.trim()) return "El monto total del contrato es obligatorio.";
      if (!uploadedFileName) return "Debés adjuntar el modelo del proveedor (.docx o .pdf).";
    }

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const title =
        documentOrigin === "PlantillaPropia"
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
        currency: documentOrigin === "ModeloDelProveedor" ? currency : undefined,
        startDate,
        endDate,
        uploadedFileName: uploadedFileName || undefined,
      });

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
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la solicitud. Intentá de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isStandard = documentOrigin === "PlantillaPropia";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bank-navy">Nueva solicitud de contrato</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isStandard
              ? "Modelo de contrato estándar — adjuntá la plantilla o borrador del contrato"
              : "Modelo del proveedor — se enviará a revisión legal"}
          </p>
        </div>
        <FictitiousDataBadge />
      </header>

      <div className="flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => {
            setDocumentOrigin("PlantillaPropia");
            setError("");
          }}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            isStandard
              ? "bg-bank-navy text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Modelo de contrato estándar
        </button>
        <button
          type="button"
          onClick={() => {
            setDocumentOrigin("ModeloDelProveedor");
            setError("");
          }}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            !isStandard
              ? "bg-bank-navy text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Modelo de contrato del proveedor
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <section className="space-y-4">
          <SectionHeader number={1} title="Datos del solicitante e imputación" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="applicant" className={labelClass}>
                Solicitante
              </label>
              <input
                id="applicant"
                type="text"
                value={applicantName}
                readOnly
                className={`${inputClass} bg-slate-50 text-slate-600`}
              />
            </div>
            {!isStandard && (
              <div>
                <label htmlFor="cost-center" className={labelClass}>
                  Centro de costos
                </label>
                <input
                  id="cost-center"
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className={inputClass}
                  placeholder="Ej.: IT - Desarrollo"
                />
              </div>
            )}
            <div className={isStandard ? "" : "sm:col-span-2 sm:max-w-sm"}>
              <label htmlFor="approver" className={labelClass}>
                Aprobador de negocio
              </label>
              <select
                id="approver"
                value={businessApprover}
                onChange={(e) => setBusinessApprover(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar…</option>
                {BUSINESS_APPROVERS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader number={2} title="Datos del proveedor" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="provider-name" className={labelClass}>
                Razón social
              </label>
              <input
                id="provider-name"
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className={inputClass}
                placeholder="Tech Solutions SRL"
              />
            </div>
            <div>
              <label htmlFor="cuit" className={labelClass}>
                CUIT
              </label>
              <input
                id="cuit"
                type="text"
                value={providerTaxId}
                onChange={(e) => setProviderTaxId(e.target.value)}
                className={inputClass}
                placeholder="30-12345678-9"
              />
            </div>
            <div>
              <label htmlFor="legal-rep" className={labelClass}>
                Representante legal
              </label>
              <input
                id="legal-rep"
                type="text"
                value={legalRepresentative}
                onChange={(e) => setLegalRepresentative(e.target.value)}
                className={inputClass}
                placeholder="María López, DNI 12.345.678"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className={labelClass}>
                Email de contacto
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputClass}
                placeholder="contacto@techsolutions.com"
              />
            </div>
          </div>

          {!isStandard && (
            <>
              <div>
                <span className={labelClass}>Origen del documento</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="origin"
                      checked={false}
                      onChange={() => setDocumentOrigin("PlantillaPropia")}
                    />
                    <span className="text-sm">Plantilla propia</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="origin"
                      checked
                      readOnly
                    />
                    <span className="text-sm">Modelo del proveedor</span>
                  </label>
                </div>
              </div>

              <FileUploadDropzone
                fileInputRef={fileInputRef}
                uploadedFileName={uploadedFileName}
                onFileChange={handleFileChange}
                emptyLabel="Arrastre y suelte el archivo del proveedor aquí, o haga clic para buscar"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="total-amount" className={labelClass}>
                    Monto total del contrato
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      id="total-amount"
                      type="text"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className={`${inputClass} pl-7`}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="currency" className={labelClass}>
                    Moneda
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputClass}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className={labelClass}>
                    Fecha inicio <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className={labelClass}>
                    Fecha fin <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="contract-type-provider" className={labelClass}>
                    Tipo de contrato (clasificación)
                  </label>
                  <select
                    id="contract-type-provider"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className={inputClass}
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </section>

        {isStandard && (
          <section className="space-y-4">
            <SectionHeader number={3} title="Tipo de contrato" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contract-type" className={labelClass}>
                  Tipo de contrato
                </label>
                <select
                  id="contract-type"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className={inputClass}
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="service-subtype" className={labelClass}>
                  Tipo de servicio (SaaS / Desarrollo)
                </label>
                <select
                  id="service-subtype"
                  value={serviceSubtype}
                  onChange={(e) => setServiceSubtype(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar…</option>
                  {SERVICE_SUBTYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="monthly-amount" className={labelClass}>
                  Monto mensual
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    id="monthly-amount"
                    type="text"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className={`${inputClass} pl-7`}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="start-date-standard" className={labelClass}>
                  Fecha inicio <span className="text-red-600">*</span>
                </label>
                <input
                  id="start-date-standard"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="end-date-standard" className={labelClass}>
                  Fecha fin <span className="text-red-600">*</span>
                </label>
                <input
                  id="end-date-standard"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>
        )}

        {isStandard && (
          <section className="space-y-4">
            <SectionHeader number={4} title="Documento del contrato" />
            <p className="text-sm text-slate-600">
              Adjuntá la plantilla estándar o un borrador ya completado. El archivo quedará
              disponible en el repositorio del contrato y el chat podrá consultarlo.
            </p>
            <FileUploadDropzone
              fileInputRef={fileInputRef}
              uploadedFileName={uploadedFileName}
              onFileChange={handleFileChange}
              emptyLabel="Arrastre y suelte el contrato aquí, o haga clic para buscar"
            />
          </section>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-bank-navy px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-bank-navy/90 disabled:opacity-50"
          >
            {submitting
              ? "Guardando…"
              : isStandard
                ? "Generar borrador"
                : "Enviar para revisión legal"}
          </button>
        </div>
      </form>
    </div>
  );
}
