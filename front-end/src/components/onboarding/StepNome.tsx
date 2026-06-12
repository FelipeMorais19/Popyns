import { ChangeEvent } from "react";
import { Field } from "./Field";
import { IconCalendar, IconFileText, IconHash, IconInstagram, IconPhone, IconShield, IconUser } from "./icons";
import { AccountType } from "./StepTipo";

type StepNomeProps = {
  nome: string;
  nascimento: string;
  celular: string;
  cpf: string;
  rg: string;
  bio: string;
  instagram: string;
  tipo?: AccountType;
  onNomeChange: (value: string) => void;
  onNascimentoChange: (value: string) => void;
  onCelularChange: (value: string) => void;
  onCpfChange: (value: string) => void;
  onRgChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
};

function maskNascimento(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(
    Boolean,
  );
  return parts.join(" / ");
}

export function maskCelular(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidNome(value: string): boolean {
  return value.trim().split(/\s+/).length >= 2;
}

function isValidNascimento(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return false;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  const now = new Date().getFullYear();
  return (
    day >= 1 &&
    day <= 31 &&
    month >= 1 &&
    month <= 12 &&
    year >= 1900 &&
    year <= now - 13
  );
}

export function isValidCelular(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
}

export function maskRg(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidRg(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9;
}

export function StepNome({
  nome,
  nascimento,
  celular,
  cpf,
  rg,
  bio,
  instagram,
  tipo,
  onNomeChange,
  onNascimentoChange,
  onCelularChange,
  onCpfChange,
  onRgChange,
  onBioChange,
  onInstagramChange,
}: StepNomeProps) {
  function handleNascimento(e: ChangeEvent<HTMLInputElement>) {
    onNascimentoChange(maskNascimento(e.target.value));
  }

  function handleCelular(e: ChangeEvent<HTMLInputElement>) {
    onCelularChange(maskCelular(e.target.value));
  }

  function handleCpf(e: ChangeEvent<HTMLInputElement>) {
    onCpfChange(maskCpf(e.target.value));
  }

  function handleRg(e: ChangeEvent<HTMLInputElement>) {
    onRgChange(maskRg(e.target.value));
  }

  const isProfissional = tipo === "profissional";

  return (
    <>
      <Field
        label="Nome completo *"
        icon={<IconUser size={16} />}
        type="text"
        autoComplete="name"
        placeholder="Emilly Machado"
        value={nome}
        onChange={(e) => onNomeChange(e.target.value)}
        valid={isValidNome(nome)}
      />

      <Field
        label="Data de nascimento *"
        icon={<IconCalendar size={16} />}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="14 / 03 / 1991"
        value={nascimento}
        onChange={handleNascimento}
        valid={isValidNascimento(nascimento)}
      />

      <Field
        label="Celular *"
        icon={<IconPhone size={16} />}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        value={celular}
        onChange={handleCelular}
        valid={isValidCelular(celular)}
      />

      {isProfissional && (
        <>
          <Field
            label="CPF *"
            icon={<IconShield size={16} />}
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpf}
            valid={isValidCpf(cpf)}
          />

          <Field
            label="RG *"
            icon={<IconHash size={16} />}
            type="text"
            inputMode="numeric"
            placeholder="000000000"
            value={rg}
            onChange={handleRg}
            valid={isValidRg(rg)}
          />

          <Field
            label="Biografia / Apresentação"
            icon={<IconFileText size={16} />}
            type="text"
            placeholder="Conte sobre sua experiência..."
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            valid={bio.trim().length > 0}
          />

          <Field
            label="Instagram / Portfólio"
            icon={<IconInstagram size={16} />}
            type="text"
            placeholder="@usuario"
            value={instagram}
            onChange={(e) => {
              const raw = e.target.value;
              const val = raw === "" ? "" : raw.startsWith("@") ? raw : `@${raw}`;
              onInstagramChange(val);
            }}
            valid={instagram.trim().length > 0}
          />
        </>
      )}
    </>
  );
}

export const stepNomeValid = (
  nome: string,
  nascimento: string,
  celular: string,
  cpf: string,
  rg: string,
  tipo?: string,
) => {
  const commonValid = isValidNome(nome) && isValidNascimento(nascimento) && isValidCelular(celular);
  if (tipo === "profissional") {
    return commonValid && isValidCpf(cpf) && isValidRg(rg);
  }
  return commonValid;
};
