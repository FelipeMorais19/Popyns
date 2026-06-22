"use client";

import { ChangeEvent, useRef } from "react";
import { IconFileText, IconShield, IconBadge, IconCheck, IconImage, IconInstagram } from "./icons";
import { ESPECIALIDADE_CATEGORIES } from "./StepEndereco";
import { Field } from "./Field";

const CERT_HINTS: Record<string, string> = {
  manicure_pedicure: "Certificado de curso de manicure e/ou pedicure",
  cabelo: "Certificado de curso de cabeleireiro ou técnico em cabelos",
  maquiagem: "Certificado de curso de maquiagem profissional",
  depilacao: "Certificado de curso de depilação (cera, linha, laser etc.)",
  sobrancelha_cilios: "Certificado de design de sobrancelhas ou aplicação de cílios",
  massagem_estetica: "Certificado de massoterapia, estética ou curso técnico correlato",
};

export type DocCertificados = Record<string, File | null>;

export type StepDocumentosProps = {
  bio: string;
  instagram: string;
  especialidades: string[];
  docIdentidade: File | null;
  docCertificados: DocCertificados;
  docAntecedentes: File | null;
  onBioChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
  onDocIdentidadeChange: (file: File | null) => void;
  onDocCertificadosChange: (id: string, file: File | null) => void;
  onDocAntecedentesChange: (file: File | null) => void;
};

function FileUploadCard({
  icon,
  title,
  hint,
  file,
  accept,
  onChange,
  onRemove,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  file: File | null;
  accept: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
    e.target.value = "";
  }

  return (
    <div
      className="rounded-2xl p-4 transition-colors"
      style={{
        background: file ? "rgba(92, 3, 49, 0.04)" : "rgba(255,255,255,0.7)",
        border: `1.5px solid ${file ? "var(--wine-800)" : "rgba(92, 3, 49, 0.12)"}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            background: file ? "var(--wine-800)" : "rgba(92, 3, 49, 0.08)",
            color: file ? "var(--cream-100)" : "var(--wine-800)",
          }}
        >
          {file ? <IconCheck size={16} /> : icon}
        </div>

        <div className="min-w-0 flex-1">
          <p
            style={{
              fontFamily: "var(--font-manrope)",
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--wine-900)",
            }}
          >
            {title}
          </p>
          <p
            className="mt-0.5"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "11px",
              color: "var(--ink-500)",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {file ? file.name : hint}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-full py-2 text-[11px] font-semibold transition-all active:scale-95"
          style={{
            fontFamily: "var(--font-manrope)",
            background: file ? "rgba(92,3,49,0.06)" : "var(--wine-800)",
            color: file ? "var(--wine-800)" : "var(--cream-100)",
            border: file ? "1px solid rgba(92,3,49,0.15)" : "none",
          }}
        >
          {file ? "Substituir" : "Enviar arquivo"}
        </button>

        {file && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full px-3 py-2 text-[11px] font-semibold transition-all active:scale-95"
            style={{
              fontFamily: "var(--font-manrope)",
              background: "rgba(220,38,38,0.08)",
              color: "rgb(185,28,28)",
              border: "1px solid rgba(220,38,38,0.15)",
            }}
          >
            Remover
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export function StepDocumentos({
  bio,
  instagram,
  especialidades,
  docIdentidade,
  docCertificados,
  docAntecedentes,
  onBioChange,
  onInstagramChange,
  onDocIdentidadeChange,
  onDocCertificadosChange,
  onDocAntecedentesChange,
}: StepDocumentosProps) {
  const selectedCategories = ESPECIALIDADE_CATEGORIES.filter((cat) =>
    especialidades.includes(cat.id),
  );

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Biografia / Apresentação *"
        icon={<IconFileText size={16} />}
        type="text"
        placeholder="Conte sobre sua experiência..."
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
        valid={bio.trim().length > 0}
      />

      <Field
        label="Instagram / Portfólio *"
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

      <FileUploadCard
        icon={<IconImage size={16} />}
        title="RG ou CNH"
        hint="Foto ou PDF do seu documento de identidade oficial."
        file={docIdentidade}
        accept="image/*,application/pdf"
        onChange={onDocIdentidadeChange}
        onRemove={() => onDocIdentidadeChange(null)}
      />

      <FileUploadCard
        icon={<IconShield size={16} />}
        title="Antecedentes criminais"
        hint="Certidão emitida pela Polícia Civil ou pelo site do governo federal."
        file={docAntecedentes}
        accept="image/*,application/pdf"
        onChange={onDocAntecedentesChange}
        onRemove={() => onDocAntecedentesChange(null)}
      />

      {selectedCategories.map((cat) => (
        <FileUploadCard
          key={cat.id}
          icon={<IconBadge size={16} />}
          title={`Certificado — ${cat.name}`}
          hint={CERT_HINTS[cat.id] ?? `Certificado relacionado a ${cat.name}`}
          file={docCertificados[cat.id] ?? null}
          accept="image/*,application/pdf"
          onChange={(file) => onDocCertificadosChange(cat.id, file)}
          onRemove={() => onDocCertificadosChange(cat.id, null)}
        />
      ))}
    </div>
  );
}

export function stepDocumentosValid(
  bio: string,
  instagram: string,
  especialidades: string[],
  docIdentidade: File | null,
  docCertificados: DocCertificados,
  docAntecedentes: File | null,
): boolean {
  if (!bio.trim()) return false;
  if (!instagram.trim()) return false;
  if (!docIdentidade) return false;
  if (!docAntecedentes) return false;
  return especialidades.every((id) => !!docCertificados[id]);
}
