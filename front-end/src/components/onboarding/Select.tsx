import { useState, useRef, useEffect, ReactNode } from "react";
import { IconCheck } from "./icons";

type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  valid?: boolean;
};

export function Select({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  valid = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHoveredCheck, setIsHoveredCheck] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setIsHoveredCheck(false);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {/* Estilo embutido para ocultar barra de rolagem e gerenciar hover de opções */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .select-option:hover {
          background-color: rgba(92, 3, 49, 0.05) !important;
        }
      ` }} />

      <label
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

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-full items-center justify-between rounded-full bg-white/85 pr-12 pl-12 text-[14px] outline-none transition-colors hover:bg-white text-left"
          style={{
            border: "1px solid rgba(92, 3, 49, 0.10)",
            color: selectedOption ? "var(--ink-900)" : "rgba(0, 0, 0, 0.35)",
            fontFamily: "var(--font-manrope)",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute left-5 flex items-center justify-center"
            style={{ color: "var(--wine-800)" }}
          >
            {icon}
          </span>

          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* Custom chevron dropdown arrow or validation check */}
          {(!valid || isOpen) ? (
            <span className="absolute right-5 flex shrink-0 items-center justify-center text-[10px]" style={{ color: "var(--wine-800)" }}>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M1 1l4 4 4-4" />
              </svg>
            </span>
          ) : (
            <span
              aria-hidden="true"
              onMouseEnter={() => setIsHoveredCheck(true)}
              onMouseLeave={() => setIsHoveredCheck(false)}
              onClick={handleClear}
              className="absolute right-5 flex items-center justify-center transition-colors duration-150"
              style={{
                color: isHoveredCheck ? "var(--wine-800)" : "var(--success-700)",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              {isHoveredCheck ? (
                /* Ícone de fechar (X) */
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <IconCheck size={18} />
              )}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className="no-scrollbar absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-[20px] bg-white p-2 shadow-[0_8px_32px_rgba(92,3,49,0.12)] border border-black/5"
            style={{
              fontFamily: "var(--font-manrope)",
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="select-option flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-[13px] font-medium transition-colors"
                  style={{
                    color: isSelected ? "var(--wine-800)" : "var(--ink-900)",
                    backgroundColor: isSelected ? "rgba(92,3,49,0.04)" : "transparent",
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <IconCheck size={14} style={{ color: "var(--wine-800)" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
