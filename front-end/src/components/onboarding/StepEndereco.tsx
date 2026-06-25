"use client";

import { ChangeEvent, useEffect, useRef } from "react";
import { Field } from "./Field";
import { IconHash, IconHome, IconLayers, IconPin } from "./icons";
import { AccountType } from "./StepTipo";

type StepEnderecoProps = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  raioAtendimento: string;
  cidadeBase: string;
  onCepChange: (value: string) => void;
  onEnderecoChange: (value: string) => void;
  onNumeroChange: (value: string) => void;
  onComplementoChange: (value: string) => void;
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

export const ESPECIALIDADE_CATEGORIES = [
  { id: "pedicure",               name: "Pedicure" },
  { id: "designer_sobrancelha",   name: "Designer de sobrancelha" },
  { id: "micropigmentadora",      name: "Micropigmentadora" },
  { id: "lash_designer",          name: "Lash Designer" },
  { id: "cabeleleeiro",           name: "Cabeleleiro" },
  { id: "barbeiro",               name: "Barbeiro" },
  { id: "hair_stylist_visagista", name: "Hair Stylist / Visagista" },
  { id: "depiladora",             name: "Depiladora" },
  { id: "massoterapeuta",         name: "Massoterapeuta" },
  { id: "maquiador",              name: "Maquiador" },
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

export function isValidEspecialidade(value: string[]): boolean {
  return value.length > 0;
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
  raioAtendimento,
  cidadeBase,
  onCepChange,
  onEnderecoChange,
  onNumeroChange,
  onComplementoChange,
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
          <Field
            label="Cidade Base de Atendimento *"
            icon={<IconPin size={16} />}
            type="text"
            placeholder="Ex: São Paulo"
            value={cidadeBase}
            onChange={(e) => onCidadeBaseChange(e.target.value)}
            valid={isValidCidadeBase(cidadeBase)}
          />

          {/* Slider de raio de atendimento */}
          <div className="flex flex-col gap-3">
            <style dangerouslySetInnerHTML={{ __html: `
              .raio-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; background: linear-gradient(to right, var(--wine-800) 0%, var(--wine-800) ${((parseInt(raioAtendimento || "10") - 1) / 49) * 100}%, rgba(92,3,49,0.15) ${((parseInt(raioAtendimento || "10") - 1) / 49) * 100}%, rgba(92,3,49,0.15) 100%); }
              .raio-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--wine-800); cursor: pointer; box-shadow: 0 2px 8px rgba(92,3,49,0.35); border: 2px solid white; }
              .raio-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: var(--wine-800); cursor: pointer; box-shadow: 0 2px 8px rgba(92,3,49,0.35); border: 2px solid white; }
            ` }} />
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
              >
                Raio de Atendimento *
              </span>
              <span
                className="text-[15px] font-bold"
                style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
              >
                {raioAtendimento || "10"} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={raioAtendimento || "10"}
              onChange={(e) => onRaioAtendimentoChange(e.target.value)}
              className="raio-slider"
            />
            <div
              className="flex justify-between text-[10px]"
              style={{ color: "rgba(92,3,49,0.4)", fontFamily: "var(--font-manrope)" }}
            >
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

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
