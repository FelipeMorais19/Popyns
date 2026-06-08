import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { IconCheck } from "./icons";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  icon: ReactNode;
  valid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export function Field({
  label,
  icon,
  valid = false,
  id,
  className = "",
  ref,
  ...rest
}: FieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={inputId}
        style={{
          fontFamily: "var(--font-manrope)",
          fontWeight: 600,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
        }}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-5"
          style={{ color: "var(--wine-800)" }}
        >
          {icon}
        </span>

        <input
          ref={ref}
          id={inputId}
          className="h-12 w-full rounded-full bg-white/85 pr-12 pl-12 text-[14px] outline-none transition-colors focus:bg-white"
          style={{
            border: "1px solid rgba(92, 3, 49, 0.10)",
            color: "var(--ink-900)",
            fontFamily: "var(--font-manrope)",
          }}
          {...rest}
        />

        {valid && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-5"
            style={{ color: "var(--success-700)" }}
          >
            <IconCheck size={18} />
          </span>
        )}
      </div>
    </div>
  );
}
