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
} from "./StepEndereco";

type OnboardingWizardProps = {
  onComplete: () => void;
};

type WizardState = {
  step: 1 | 2 | 3 | 4;
  tipo: AccountType;
  fotoFile: File | null;
  fotoPreviewUrl: string | null;
  nome: string;
  nascimento: string;
  celular: string;
  cpf: string;
  rg: string;
  bio: string;
  instagram: string;
  especialidade: string;
  raioAtendimento: string;
  cidadeBase: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
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
      cpf: "",
      rg: "",
      bio: "",
      instagram: "",
      especialidade: "",
      raioAtendimento: "",
      cidadeBase: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
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
            isValidEspecialidade(state.especialidade) &&
            isValidRaioAtendimento(state.raioAtendimento) &&
            isValidCidadeBase(state.cidadeBase)
          );
        }
        return addressValid;
      }
    }
  }, [state]);

  async function handleNext() {
    if (!canAdvance) return;

    if (state.step < 4) {
      setState((s) => ({ ...s, step: (s.step + 1) as WizardState["step"] }));
      return;
    }

    if (!user) return;
    setSubmitting(true);

    let avatarStoragePath: string | null = null;

    try {
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

  const isFinalStep = state.step === 4;

  if (state.step === 1) {
    return (
      <SignupShell
        step={1}
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
          cpf={state.cpf}
          rg={state.rg}
          bio={state.bio}
          instagram={state.instagram}
          tipo={state.tipo}
          onNomeChange={(v) => update("nome", v)}
          onNascimentoChange={(v) => update("nascimento", v)}
          onCelularChange={(v) => update("celular", v)}
          onCpfChange={(v) => update("cpf", v)}
          onRgChange={(v) => update("rg", v)}
          onBioChange={(v) => update("bio", v)}
          onInstagramChange={(v) => update("instagram", v)}
        />
      </SignupShell>
    );
  }

  return (
    <SignupShell
      step={4}
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
        especialidade={state.especialidade}
        raioAtendimento={state.raioAtendimento}
        cidadeBase={state.cidadeBase}
        onCepChange={(v) => update("cep", v)}
        onEnderecoChange={(v) => update("endereco", v)}
        onNumeroChange={(v) => update("numero", v)}
        onComplementoChange={(v) => update("complemento", v)}
        onEspecialidadeChange={(v) => update("especialidade", v)}
        onRaioAtendimentoChange={(v) => update("raioAtendimento", v)}
        onCidadeBaseChange={(v) => update("cidadeBase", v)}
        tipo={state.tipo}
      />
    </SignupShell>
  );
}
