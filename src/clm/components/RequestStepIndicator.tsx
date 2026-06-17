type StandardStep = 1 | 2 | 3;

const STEPS: { step: StandardStep; label: string }[] = [
  { step: 1, label: "Contrato" },
  { step: 2, label: "Anexo I" },
  { step: 3, label: "Drive" },
];

interface RequestStepIndicatorProps {
  currentStep: StandardStep;
}

export function RequestStepIndicator({ currentStep }: RequestStepIndicatorProps) {
  return (
    <nav aria-label="Pasos de la solicitud" className="rounded-lg border border-slate-200 bg-white p-4">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map(({ step, label }, index) => {
          const isActive = step === currentStep;
          const isDone = step < currentStep;

          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:flex-row sm:gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isActive
                      ? "bg-bank-navy text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : step}
                </span>
                <span
                  className={`truncate text-center text-xs font-medium sm:text-left sm:text-sm ${
                    isActive ? "text-bank-navy" : isDone ? "text-emerald-800" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden h-0.5 flex-1 sm:block ${isDone ? "bg-emerald-300" : "bg-slate-200"}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
