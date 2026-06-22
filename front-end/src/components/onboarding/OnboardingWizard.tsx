"use client";

import { useMemo, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  SUPABASE_BUCKET,
  avatarPath,
  useSupabase,
} from "@/lib/supabase";
import { SignupShell } from "./SignupShell";
import { StepTipo, type AccountType } from "./StepTipo";
import { StepFoto } from "./StepFoto";
import { StepNome, stepNomeValid, maskCelular } from "./StepNome";
import {
  StepEndereco,
  isValidCep,
  isValidEndereco,
  isValidNumero,
  isValidEspecialidade,
  isValidRaioAtendimento,
  isValidCidadeBase,
  ESPECIALIDADE_CATEGORIES,
} from "./StepEndereco";
import {
  StepDocumentos,
  stepDocumentosValid,
  type DocCertificados,
} from "./StepDocumentos";

type OnboardingWizardProps = {
  onComplete: () => void;
};

type WizardState = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  tipo: AccountType;
  fotoFile: File | null;
  fotoPreviewUrl: string | null;
  nome: string;
  nascimento: string;
  celular: string;
  genero: string;
  cpf: string;
  rg: string;
  bio: string;
  instagram: string;
  especialidade: string[];
  raioAtendimento: string;
  cidadeBase: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  docIdentidade: File | null;
  docCertificados: DocCertificados;
  docAntecedentes: File | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useUser();
  const clerk = useClerk();
  const supabase = useSupabase();
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>(() => {
    const rawPhone = user?.primaryPhoneNumber?.phoneNumber ?? "";
    const cleanPhone = rawPhone.startsWith("+55") ? rawPhone.slice(3) : rawPhone;
    return {
      step: 1,
      tipo: "cliente",
      fotoFile: null,
      fotoPreviewUrl: null,
      nome: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
      nascimento: "",
      celular: cleanPhone ? maskCelular(cleanPhone) : "",
      genero: "",
      cpf: "",
      rg: "",
      bio: "",
      instagram: "",
      especialidade: [],
      raioAtendimento: "10",
      cidadeBase: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      docIdentidade: null,
      docCertificados: {},
      docAntecedentes: null,
    };
  });

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function handleFile(file: File | null) {
    setState((s) => {
      if (s.fotoPreviewUrl) URL.revokeObjectURL(s.fotoPreviewUrl);
      return {
        ...s,
        fotoFile: file,
        fotoPreviewUrl: file ? URL.createObjectURL(file) : null,
      };
    });
  }

  const canAdvance = useMemo(() => {
    switch (state.step) {
      case 1:
        return !!state.tipo;
      case 2:
        return true; // foto é opcional
      case 3:
        return stepNomeValid(
          state.nome,
          state.nascimento,
          state.celular,
          state.genero,
          state.cpf,
          state.rg,
          state.tipo,
        );
      case 4: {
        const addressValid =
          isValidCep(state.cep) &&
          isValidEndereco(state.endereco) &&
          isValidNumero(state.numero);
        if (state.tipo === "profissional") {
          return (
            addressValid &&
            isValidRaioAtendimento(state.raioAtendimento) &&
            isValidCidadeBase(state.cidadeBase)
          );
        }
        return addressValid;
      }
      case 5:
        return isValidEspecialidade(state.especialidade);
      case 6:
        return stepDocumentosValid(
          state.bio,
          state.instagram,
          state.especialidade,
          state.docIdentidade,
          state.docCertificados,
          state.docAntecedentes,
        );
    }
  }, [state]);

  async function handleNext() {
    if (!canAdvance) return;

    const maxStep = state.tipo === "profissional" ? 6 : 4;
    if (state.step < maxStep) {
      setState((s) => ({ ...s, step: (s.step + 1) as WizardState["step"] }));
      return;
    }

    if (!user) return;
    setSubmitting(true);

    let avatarStoragePath: string | null = null;

    try {
      // Garante que existe linha em public.users ANTES de qualquer outra operação
      // (upload de avatar, leituras futuras pelo ClientProfile, etc).
      // A RLS policy users_insert_own aceita o INSERT desde que clerk_user_id
      // bata com o sub do JWT do Clerk.
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        const { error: upsertErr } = await supabase
          .from("users")
          .upsert(
            {
              clerk_user_id: user.id,
              email,
              full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
              phone: user.primaryPhoneNumber?.phoneNumber || null,
              avatar_url: user.imageUrl || null,
              is_professional: state.tipo === "profissional",
            },
            { onConflict: "clerk_user_id" },
          );
        if (upsertErr) {
          console.error("Failed to upsert user in public.users:", upsertErr);
        }
      } else {
        console.warn("Skipping users upsert: no primary email on Clerk user.");
      }

      if (state.fotoFile) {
        // 1) Upload pro bucket popyns (canônico — usado na vitrine, perfil etc).
        const path = avatarPath(user.id, state.fotoFile);
        try {
          // ─── DEBUG TEMPORÁRIO ─── remover quando upload estiver funcionando
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sessionAny = (window as any).Clerk?.session;
          if (sessionAny) {
            const token = await sessionAny.getToken();
            if (token) {
              const [, payload] = token.split(".");
              const decoded = JSON.parse(atob(payload));
              console.log("[Clerk JWT] sub =", decoded.sub);
              console.log("[Clerk JWT] role =", decoded.role);
              console.log("[Clerk JWT] full payload =", decoded);
              console.log("[Path] target =", path);
            } else {
              console.warn("[Clerk JWT] getToken() retornou null");
            }
          }
          // ─── /DEBUG ───

          const { error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(path, state.fotoFile, {
              upsert: true,
              cacheControl: "3600",
              contentType: state.fotoFile.type || undefined,
            });
          if (error) throw error;
          avatarStoragePath = path;
        } catch (err) {
          console.error("Supabase avatar upload failed", err);
          /* falha de upload não deve travar o onboarding */
        }

        // 2) Sobe também pro Clerk pra o <UserButton> exibir a mesma foto.
        try {
          await user.setProfileImage({ file: state.fotoFile });
        } catch {
          /* opcional */
        }
      }

      // Upload dos documentos de verificação (profissional)
      if (state.tipo === "profissional") {
        const uploadDoc = async (file: File, path: string) => {
          try {
            await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
              upsert: true,
              cacheControl: "3600",
              contentType: file.type || undefined,
            });
          } catch (err) {
            console.error(`Falha ao enviar documento ${path}:`, err);
          }
        };

        if (state.docIdentidade) {
          const ext = state.docIdentidade.name.split(".").pop() ?? "pdf";
          await uploadDoc(state.docIdentidade, `${user.id}/documentos/identidade.${ext}`);
        }
        for (const [id, file] of Object.entries(state.docCertificados)) {
          if (file) {
            const ext = file.name.split(".").pop() ?? "pdf";
            await uploadDoc(file, `${user.id}/documentos/certificados/${id}.${ext}`);
          }
        }
        if (state.docAntecedentes) {
          const ext = state.docAntecedentes.name.split(".").pop() ?? "pdf";
          await uploadDoc(state.docAntecedentes, `${user.id}/documentos/antecedentes.${ext}`);
        }
      }

      const [firstName, ...rest] = state.nome.trim().split(/\s+/);
      const lastName = rest.join(" ");
      if (firstName && (firstName !== user.firstName || lastName !== user.lastName)) {
        try {
          await user.update({ firstName, lastName });
        } catch {
          /* opcional */
        }
      }

      const isProfissional = state.tipo === "profissional";
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          onboardingComplete: true,
          tipo: state.tipo,
          nascimento: state.nascimento,
          genero: state.genero,
          phone: state.celular.replace(/\D/g, ""),
          cep: state.cep,
          endereco: state.endereco,
          numero: state.numero,
          complemento: state.complemento.trim() || null,
          avatarPath: avatarStoragePath,
          completedAt: new Date().toISOString(),
          ...(isProfissional ? {
            cpf: state.cpf.replace(/\D/g, ""),
            rg: state.rg.trim(),
            bio: state.bio.trim() || null,
            instagram: state.instagram.trim() || null,
            especialidade: state.especialidade,
            serviceRadius: state.raioAtendimento,
            baseCity: state.cidadeBase.trim(),
          } : {}),
        },
      });

      onComplete();
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (state.step === 1) {
      clerk.signOut();
      return;
    }
    setState((s) => ({ ...s, step: (s.step - 1) as WizardState["step"] }));
  }

  const maxStep = state.tipo === "profissional" ? 6 : 4;
  const isFinalStep = state.step === maxStep;

  if (state.step === 1) {
    return (
      <SignupShell
        step={1}
        totalSteps={maxStep}
        title="Como você vai usar a POPYNS?"
        subtitle="Você pode mudar depois — quem é profissional também pode pedir serviços como cliente."
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance}
      >
        <StepTipo
          value={state.tipo}
          onChange={(tipo) => update("tipo", tipo)}
        />
      </SignupShell>
    );
  }

  if (state.step === 2) {
    return (
      <SignupShell
        step={2}
        totalSteps={maxStep}
        title="Escolha uma foto sua"
        subtitle={
          state.tipo === "profissional"
            ? "Pra suas clientes te reconhecerem na chegada."
            : "Pra suas profissionais saberem quem é você quando chegarem."
        }
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance}
      >
        <StepFoto
          initials={initials(state.nome) || "P"}
          previewUrl={state.fotoPreviewUrl ?? user?.imageUrl ?? null}
          onFileSelected={handleFile}
        />
      </SignupShell>
    );
  }

  if (state.step === 3) {
    return (
      <SignupShell
        step={3}
        totalSteps={maxStep}
        title={
          <>
            Conte um pouco
            <br />
            sobre você
          </>
        }
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance}
      >
        <StepNome
          nome={state.nome}
          nascimento={state.nascimento}
          celular={state.celular}
          genero={state.genero}
          cpf={state.cpf}
          rg={state.rg}
          tipo={state.tipo}
          onNomeChange={(v) => update("nome", v)}
          onNascimentoChange={(v) => update("nascimento", v)}
          onCelularChange={(v) => update("celular", v)}
          onGeneroChange={(v) => update("genero", v)}
          onCpfChange={(v) => update("cpf", v)}
          onRgChange={(v) => update("rg", v)}
        />
      </SignupShell>
    );
  }

  if (state.step === 5) {
    return (
      <SignupShell
        step={5}
        totalSteps={maxStep}
        title={<>Suas<br />especialidades</>}
        subtitle="Selecione os serviços que você oferece às clientes."
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADE_CATEGORIES.map((cat) => {
              const selected = state.especialidade.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? state.especialidade.filter((id) => id !== cat.id)
                      : [...state.especialidade, cat.id];
                    update("especialidade", next);
                  }}
                  className="rounded-full px-4 py-2 text-[12px] font-semibold transition-all"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    background: selected ? "var(--wine-800)" : "rgba(92,3,49,0.06)",
                    color: selected ? "var(--cream-100)" : "var(--wine-800)",
                    border: `1.5px solid ${selected ? "var(--wine-800)" : "rgba(92,3,49,0.2)"}`,
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {state.especialidade.length === 0 && (
            <p className="text-[11px]" style={{ color: "rgba(92,3,49,0.5)", fontFamily: "var(--font-manrope)" }}>
              Selecione ao menos uma especialidade.
            </p>
          )}
        </div>
      </SignupShell>
    );
  }

  if (state.step === 6) {
    return (
      <SignupShell
        step={6}
        totalSteps={maxStep}
        title={<>Seus<br />documentos</>}
        subtitle="Envie seus documentos para verificarmos seu perfil. Aceitamos foto ou PDF."
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance && !submitting}
        isFinalStep
        nextLabel={submitting ? "Enviando..." : "Concluir cadastro"}
      >
        <StepDocumentos
          bio={state.bio}
          instagram={state.instagram}
          especialidades={state.especialidade}
          docIdentidade={state.docIdentidade}
          docCertificados={state.docCertificados}
          docAntecedentes={state.docAntecedentes}
          onBioChange={(v) => update("bio", v)}
          onInstagramChange={(v) => update("instagram", v)}
          onDocIdentidadeChange={(file) => update("docIdentidade", file)}
          onDocCertificadosChange={(id, file) =>
            setState((s) => ({
              ...s,
              docCertificados: { ...s.docCertificados, [id]: file },
            }))
          }
          onDocAntecedentesChange={(file) => update("docAntecedentes", file)}
        />
      </SignupShell>
    );
  }

  return (
    <SignupShell
      step={4}
      totalSteps={maxStep}
      title={
        <>
          Quase lá.
          <br />
          Onde você está?
        </>
      }
      subtitle={
        state.tipo === "profissional"
          ? "Endereço base de onde você sai para atender."
          : "Endereço onde costuma receber serviços. Você pode adicionar mais depois."
      }
      onBack={handleBack}
      onNext={handleNext}
      canAdvance={canAdvance && !submitting}
      isFinalStep={isFinalStep}
      nextLabel={submitting ? "Salvando..." : "Concluir cadastro"}
    >
      <StepEndereco
        cep={state.cep}
        endereco={state.endereco}
        numero={state.numero}
        complemento={state.complemento}
        raioAtendimento={state.raioAtendimento}
        cidadeBase={state.cidadeBase}
        onCepChange={(v) => update("cep", v)}
        onEnderecoChange={(v) => update("endereco", v)}
        onNumeroChange={(v) => update("numero", v)}
        onComplementoChange={(v) => update("complemento", v)}
        onRaioAtendimentoChange={(v) => update("raioAtendimento", v)}
        onCidadeBaseChange={(v) => update("cidadeBase", v)}
        tipo={state.tipo}
      />
    </SignupShell>
  );
}
