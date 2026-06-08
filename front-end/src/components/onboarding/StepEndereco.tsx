"use client";

import { ChangeEvent, useEffect, useRef } from "react";
import { Field } from "./Field";
import { IconHash, IconHome, IconLayers, IconPin } from "./icons";
import { AccountType } from "./StepTipo";
import { Select } from "./Select";

type StepEnderecoProps = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  especialidade: string;
  raioAtendimento: string;
  cidadeBase: string;
  onCepChange: (value: string) => void;
  onEnderecoChange: (value: string) => void;
  onNumeroChange: (value: string) => void;
  onComplementoChange: (value: string) => void;
  onEspecialidadeChange: (value: string) => void;
  onRaioAtendimentoChange: (value: string) => void;
  onCidadeBaseChange: (value: string) => void;
  tipo?: AccountType;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

const CATEGORIES = [
  { id: "manicure_pedicure", name: "Manicure / Pedicure" },
  { id: "cabelo", name: "Cabelo" },
  { id: "maquiagem", name: "Maquiagem" },
  { id: "depilacao", name: "Depilação" },
  { id: "sobrancelha_cilios", name: "Sobrancelha / Cílios" },
  { id: "massagem_estetica", name: "Massagem / Estética" },
  { id: "limpeza_domestica", name: "Limpeza Doméstica" },
];

const RADII = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "15", label: "15 km" },
  { value: "20", label: "20 km" },
  { value: "30", label: "30 km" },
  { value: "50", label: "50 km" },
];

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string): boolean {
  return value.replace(/\D/g, "").length === 8;
}

export function isValidEndereco(value: string): boolean {
  return value.trim().length >= 5;
}

export function isValidNumero(value: string): boolean {
  return value.trim().length >= 1;
}

export function isValidEspecialidade(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidRaioAtendimento(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 1 && num <= 50;
}

export function isValidCidadeBase(value: string): boolean {
  return value.trim().length >= 2;
}

export function StepEndereco({
  cep,
  endereco,
  numero,
  complemento,
  especialidade,
  raioAtendimento,
  cidadeBase,
  onCepChange,
  onEnderecoChange,
  onNumeroChange,
  onComplementoChange,
  onEspecialidadeChange,
  onRaioAtendimentoChange,
  onCidadeBaseChange,
  tipo,
}: StepEnderecoProps) {
  const lastLookedUp = useRef<string>("");
  const numeroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8 || lastLookedUp.current === digits) return;

    lastLookedUp.current = digits;
    const controller = new AbortController();

    fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<ViaCepResponse>)
      .then((data) => {
        if (data.erro) return;
        const parts = [
          data.logradouro,
          data.bairro,
          data.localidade && data.uf
            ? `${data.localidade}/${data.uf}`
            : data.localidade,
        ].filter(Boolean);
        const filled = parts.join(" · ");
        if (filled) {
          onEnderecoChange(filled);
          numeroRef.current?.focus();
        }
        if (data.localidade) {
          onCidadeBaseChange(data.localidade);
        }
      })
      .catch(() => {
        /* silencioso — CEP inválido ou offline */
      });

    return () => controller.abort();
  }, [cep, onEnderecoChange, onCidadeBaseChange]);

  function handleCep(e: ChangeEvent<HTMLInputElement>) {
    onCepChange(maskCep(e.target.value));
  }

  const isProfissional = tipo === "profissional";

  return (
    <>
      <Field
        label="CEP *"
        icon={<IconPin size={16} />}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="01419-001"
        value={cep}
        onChange={handleCep}
        valid={isValidCep(cep)}
      />

      <Field
        label="Endereço *"
        icon={<IconHome size={16} />}
        type="text"
        autoComplete="street-address"
        placeholder="Rua, bairro, cidade"
        value={endereco}
        onChange={(e) => onEnderecoChange(e.target.value)}
        valid={isValidEndereco(endereco)}
      />

      <Field
        ref={numeroRef}
        label="Número *"
        icon={<IconHash size={16} />}
        type="text"
        inputMode="numeric"
        autoComplete="address-line2"
        placeholder="1247"
        value={numero}
        onChange={(e) => onNumeroChange(e.target.value)}
        valid={isValidNumero(numero)}
      />

      <Field
        label="Complemento"
        icon={<IconLayers size={16} />}
        type="text"
        autoComplete="address-line3"
        placeholder="Apto 84, Bloco B…"
        value={complemento}
        onChange={(e) => onComplementoChange(e.target.value)}
        valid={complemento.trim().length > 0}
      />

      {isProfissional && (
        <>
          <Select
            label="Especialidade *"
            icon={<IconLayers size={16} />}
            value={especialidade}
            onChange={onEspecialidadeChange}
            options={CATEGORIES.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            placeholder="Selecione sua especialidade..."
            valid={isValidEspecialidade(especialidade)}
          />

          <Select
            label="Raio de Atendimento *"
            icon={<IconPin size={16} />}
            value={raioAtendimento}
            onChange={onRaioAtendimentoChange}
            options={RADII}
            placeholder="Selecione o raio máximo..."
            valid={isValidRaioAtendimento(raioAtendimento)}
          />

          <Field
            label="Cidade Base de Atendimento *"
            icon={<IconPin size={16} />}
            type="text"
            placeholder="Ex: São Paulo"
            value={cidadeBase}
            onChange={(e) => onCidadeBaseChange(e.target.value)}
            valid={isValidCidadeBase(cidadeBase)}
          />
        </>
      )}

      {!isProfissional && (
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--font-manrope)",
            fontSize: "11px",
            color: "var(--ink-500)",
            lineHeight: 1.5,
          }}
        >
          Endereço onde costuma receber serviços. Você pode adicionar mais
          depois.
        </p>
      )}
    </>
  );
}
