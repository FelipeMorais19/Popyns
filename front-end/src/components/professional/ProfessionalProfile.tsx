"use client";

import { useRef, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { IconCamera, IconPhone, IconUser, IconMail, IconPin } from "../onboarding/icons";

const IconInstagram = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

const IconScissors = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);


function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="shrink-0 opacity-80" style={{ color: "var(--wine-800)" }}>{icon}</span>
      <div className="flex flex-col min-w-0">
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}
        >
          {label}
        </span>
        <span
          className="text-[13px] font-medium mt-0.5 truncate"
          style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}
        >
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

async function toJpeg(raw: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(raw);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("canvas conversion failed"));
          resolve(new File([blob], raw.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

function formatPhone(digits: string): string {
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length === 11)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  if (cleaned.length === 10)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return cleaned;
}

const ESPECIALIDADE_LABELS: Record<string, string> = {
  manicure_pedicure: "Manicure / Pedicure",
  cabelo: "Cabelo",
  maquiagem: "Maquiagem",
  depilacao: "Depilação",
  sobrancelha_cilios: "Sobrancelha / Cílios",
  massagem_estetica: "Massagem / Estética",
};

function formatEspecialidade(id: string) {
  return ESPECIALIDADE_LABELS[id] ?? id;
}

export function ProfessionalProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const meta = (user.unsafeMetadata ?? {}) as Record<string, string | null | undefined>;

  const handlePhotoClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploading(true);
    try {
      const file = await toJpeg(raw);
      await user.setProfileImage({ file });
    } catch (err) {
      console.error("Failed to update profile image:", err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleBackToClient = async () => {
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, tipo: "cliente" } });
      window.location.reload();
    } catch (err) {
      console.error("Error switching back:", err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col" style={{ overflowY: "auto", scrollbarWidth: "none" }}>

      {/* Header escuro */}
      <header
        className="shrink-0 px-5 pt-8 pb-7 text-center"
        style={{ background: "var(--wine-800)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "32px",
            lineHeight: 1.1,
            color: "var(--cream-100)",
          }}
        >
          Meu Perfil
        </h1>
        <p
          className="mt-1.5 text-[10px] uppercase tracking-[0.16em]"
          style={{ fontFamily: "var(--font-manrope)", color: "rgba(245,239,230,0.5)" }}
        >
          Área da Profissional
        </p>
      </header>

      {/* Conteúdo */}
      <div className="bg-warm-gradient flex-1 px-5 pt-6 pb-10">
        <div className="flex flex-col w-full max-w-[390px] mx-auto gap-5">

          {/* Avatar */}
          <div className="flex flex-col items-center py-2">
            <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
              <div
                className="h-24 w-24 overflow-hidden rounded-full border transition-all flex items-center justify-center bg-white/60"
                style={{
                  borderColor: "rgba(92,3,49,0.15)",
                  boxShadow: "0 8px 32px -12px rgba(92,3,49,0.3)",
                }}
              >
                {user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt={user.fullName ?? "Avatar"}
                    className={`h-full w-full object-cover transition-opacity ${uploading ? "opacity-30" : "opacity-100"}`}
                  />
                ) : (
                  <span
                    className="text-2xl font-bold uppercase"
                    style={{ color: "var(--wine-800)" }}
                  >
                    {user.firstName?.[0] ?? "P"}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <IconCamera size={22} className="text-[var(--cream-100)]" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--wine-800)", borderTopColor: "transparent" }}
                  />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploading}
              className="mt-3 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
            >
              {uploading ? "Salvando..." : "Alterar foto de perfil"}
            </button>
          </div>

          {/* Informações Pessoais */}
          <div
            className="flex flex-col gap-[18px] rounded-[22px] p-5 border bg-white/60"
            style={{
              borderColor: "rgba(92,3,49,0.08)",
              boxShadow: "0 8px 32px -12px rgba(92,3,49,0.15)",
            }}
          >
            <h2
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
            >
              Informações Pessoais
            </h2>
            <InfoRow icon={<IconUser size={18} />} label="Nome Completo" value={user.fullName ?? ""} />
            <InfoRow icon={<IconMail size={18} />} label="E-mail" value={user.primaryEmailAddress?.emailAddress ?? ""} />
            <InfoRow icon={<IconPhone size={18} />} label="Celular" value={formatPhone(meta.phone ?? "")} />
          </div>

          {/* Perfil Profissional */}
          <div
            className="flex flex-col gap-[18px] rounded-[22px] p-5 border bg-white/60"
            style={{
              borderColor: "rgba(92,3,49,0.08)",
              boxShadow: "0 8px 32px -12px rgba(92,3,49,0.15)",
            }}
          >
            <h2
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--wine-800)", fontFamily: "var(--font-manrope)" }}
            >
              Perfil Profissional
            </h2>
            <div className="flex items-start gap-3.5">
              <span className="shrink-0 opacity-80 mt-0.5" style={{ color: "var(--wine-800)" }}>
                <IconScissors size={18} />
              </span>
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}
                >
                  Especialidades
                </span>
                {(() => {
                  const raw = meta.especialidade;
                  const ids: string[] = Array.isArray(raw)
                    ? raw
                    : raw ? [raw] : [];
                  if (ids.length === 0) return (
                    <span className="text-[13px] font-medium" style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}>—</span>
                  );
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {ids.map((id) => (
                        <span
                          key={id}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{
                            background: "rgba(92,3,49,0.08)",
                            color: "var(--wine-800)",
                            fontFamily: "var(--font-manrope)",
                          }}
                        >
                          {formatEspecialidade(id)}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <InfoRow icon={<IconPin size={18} />} label="Cidade Base" value={meta.baseCity ?? ""} />
            <InfoRow
              icon={<IconInstagram size={18} />}
              label="Instagram"
              value={meta.instagram ? (String(meta.instagram).startsWith("@") ? String(meta.instagram) : `@${meta.instagram}`) : ""}
            />
            {meta.bio ? (
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}
                >
                  Bio
                </span>
                <p
                  className="text-[13px] font-medium leading-relaxed"
                  style={{ color: "var(--wine-900)", fontFamily: "var(--font-manrope)" }}
                >
                  {meta.bio}
                </p>
              </div>
            ) : (
              <InfoRow icon={<span />} label="Bio" value="" />
            )}
          </div>

          {/* Ações da conta */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="h-11 w-full rounded-[14px] border text-[12px] font-bold uppercase tracking-wider transition-colors"
              style={{
                borderColor: "rgba(92,3,49,0.2)",
                color: "var(--wine-800)",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Sair da Conta
            </button>
            <button
              type="button"
              onClick={handleBackToClient}
              className="h-9 w-full rounded-[14px] border text-[11px] font-bold uppercase tracking-wider transition-colors"
              style={{
                borderColor: "rgba(92,3,49,0.08)",
                color: "var(--ink-500)",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Voltar para Conta Cliente (Dev)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
