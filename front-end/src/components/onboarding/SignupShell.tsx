import { ReactNode } from "react";
import { IconArrowLeft, IconArrowRight } from "./icons";

type SignupShellProps = {
  step: number;
  totalSteps: number;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  canAdvance?: boolean;
  nextLabel?: string;
  isFinalStep?: boolean;
};

export function SignupShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canAdvance = true,
  nextLabel,
  isFinalStep = false,
}: SignupShellProps) {
  return (
    <div className="bg-warm-gradient relative flex h-dvh w-full flex-col overflow-hidden">
      <div className="flex justify-center">
        <div className="flex w-full max-w-[420px] flex-col">
          <div className="flex h-12 items-center px-6 pt-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Voltar"
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: "var(--wine-800)" }}
              >
                <IconArrowLeft size={22} />
              </button>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>

          <div className="px-8 pt-4">
            <p
              className="text-[10px] uppercase"
              style={{
                fontFamily: "var(--font-manrope)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--wine-800)",
              }}
            >
              Cadastro · Passo {step} de {totalSteps}
            </p>

            <div className="mt-3 flex gap-[6px]">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] flex-1 rounded-[2px]"
                  style={{
                    backgroundColor:
                      i < step
                        ? "var(--wine-800)"
                        : "rgba(92, 3, 49, 0.15)",
                  }}
                />
              ))}
            </div>

            <h1
              className="mt-6"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 500,
                fontSize: "30px",
                lineHeight: 1.05,
                color: "var(--wine-900)",
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="mt-3"
                style={{
                  fontFamily: "var(--font-manrope)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "var(--ink-500)",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto">
        <div className="flex w-full max-w-[420px] flex-col gap-[18px] px-7 pt-7 pb-32">
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex justify-center">
        <div className="relative w-full max-w-[420px]">
          <button
            type="button"
            onClick={onNext}
            disabled={!canAdvance}
            aria-label={nextLabel ?? "Avançar"}
            className="pointer-events-auto absolute right-7 bottom-9 flex h-[60px] w-[60px] items-center justify-center rounded-full text-cream-100 shadow-[0_12px_28px_-8px_rgba(92,3,49,0.55)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            style={{
              backgroundColor: "var(--wine-800)",
              color: "var(--cream-100)",
            }}
          >
            {isFinalStep ? (
              <span
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                OK
              </span>
            ) : (
              <IconArrowRight size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
