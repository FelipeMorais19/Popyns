import { IconBadge, IconCheck, IconShield, IconUser } from "./icons";

export type AccountType = "cliente" | "profissional";

type StepTipoProps = {
  value: AccountType;
  onChange: (value: AccountType) => void;
};

type CardOption = {
  id: AccountType;
  Icon: typeof IconUser;
  title: string;
  desc: string;
};

const OPTIONS: CardOption[] = [
  {
    id: "cliente",
    Icon: IconUser,
    title: "Quero ser cliente",
    desc: "Marque manicure, cabelo, maquiagem e mais — em casa, na hora que quiser.",
  },
  {
    id: "profissional",
    Icon: IconBadge,
    title: "Quero ser profissional",
    desc: "Tenha agenda cheia, defina seus preços e receba toda semana. Vamos pedir seus documentos para verificação.",
  },
];

export function StepTipo({ value, onChange }: StepTipoProps) {
  return (
    <>
      <div className="flex flex-col gap-[14px]" role="radiogroup" aria-label="Tipo de conta">
        {OPTIONS.map(({ id, Icon, title, desc }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className="flex w-full items-start gap-4 rounded-[22px] p-[22px] text-left transition-all active:scale-[0.99]"
              style={{
                backgroundColor: selected
                  ? "rgba(92, 3, 49, 0.06)"
                  : "rgba(255, 255, 255, 0.85)",
                border: selected
                  ? "1.5px solid var(--wine-800)"
                  : "1px solid rgba(92, 3, 49, 0.08)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                style={{
                  backgroundColor: "var(--wine-800)",
                  color: "var(--cream-100)",
                }}
              >
                <Icon size={22} />
              </div>

              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "var(--font-manrope)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--ink-900)",
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    fontSize: "12px",
                    color: "var(--ink-500)",
                    lineHeight: 1.45,
                  }}
                >
                  {desc}
                </p>
              </div>

              <div
                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all"
                style={{
                  backgroundColor: selected ? "var(--wine-800)" : "transparent",
                  border: selected
                    ? "none"
                    : "1.5px solid rgba(92, 3, 49, 0.25)",
                  color: "var(--cream-100)",
                }}
              >
                {selected && <IconCheck size={14} />}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="flex items-start gap-3 rounded-[14px] p-[14px]"
        style={{
          backgroundColor: "rgba(92, 3, 49, 0.06)",
        }}
      >
        <div className="shrink-0" style={{ color: "var(--wine-800)" }}>
          <IconShield size={18} />
        </div>
        <p
          style={{
            fontFamily: "var(--font-manrope)",
            fontSize: "11px",
            color: "var(--wine-800)",
            lineHeight: 1.5,
          }}
        >
          Profissionais passam por verificação de documentos e antecedentes
          (selos POPYNS) antes de aparecer no app.
        </p>
      </div>
    </>
  );
}
