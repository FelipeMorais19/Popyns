"use client";

import { CSSProperties, FormEvent, useState } from "react";
import { useSignIn } from "@clerk/nextjs";

const CREAM = "#F5EFE6";
const WINE = "#5C0331";
const ROSE = "#EAC8C0";

const INPUT_STYLE: CSSProperties = {
  width: "100%",
  height: "48px",
  padding: "0 20px",
  borderRadius: "16px",
  backgroundColor: "rgba(245,239,230,0.10)",
  border: "1px solid rgba(245,239,230,0.20)",
  color: CREAM,
  fontFamily: "var(--font-manrope)",
  fontSize: "14px",
  outline: "none",
};

const LABEL_STYLE: CSSProperties = {
  fontFamily: "var(--font-manrope)",
  fontWeight: 600,
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(245,239,230,0.55)",
};

const PRIMARY_BUTTON =
  "flex h-12 w-full items-center justify-center rounded-2xl px-6 text-[12px] font-bold uppercase tracking-[0.16em] transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

const PRIMARY_STYLE: CSSProperties = {
  backgroundColor: CREAM,
  color: WINE,
  fontFamily: "var(--font-manrope)",
};

type SubStep = "email" | "code" | "new-password" | "success";

export function ForgotPasswordFlow() {
  const { signIn, fetchStatus } = useSignIn();
  const [subStep, setSubStep] = useState<SubStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitting = fetchStatus === "fetching";

  async function handleSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!signIn) return;
    setError(null);

    const { error: createError } = await signIn.create({ identifier: email });

    if (createError) {
      setError(
        createError.longMessage ??
          "E-mail não encontrado. Verifique e tente novamente.",
      );
      return;
    }

    const { error: sendError } =
      await signIn.resetPasswordEmailCode.sendCode();

    if (sendError) {
      setError(
        sendError.longMessage ??
          "Não foi possível enviar o código de redefinição.",
      );
      return;
    }

    setSubStep("code");
  }

  async function handleVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!signIn) return;
    setError(null);

    const { error: verifyError } =
      await signIn.resetPasswordEmailCode.verifyCode({ code });

    if (verifyError) {
      setError(verifyError.longMessage ?? "Código inválido ou expirado.");
      return;
    }

    setSubStep("new-password");
  }

  async function handleSubmitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!signIn) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });

    if (submitError) {
      setError(
        submitError.longMessage ?? "Não foi possível redefinir a senha.",
      );
      return;
    }

    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        setError(
          finalizeError.longMessage ??
            "Senha redefinida, mas não foi possível entrar automaticamente.",
        );
        return;
      }
    }

    setSubStep("success");
  }

  async function handleResendCode() {
    if (!signIn) return;
    setError(null);
    const { error: resendError } =
      await signIn.resetPasswordEmailCode.sendCode();
    if (resendError) {
      setError(resendError.longMessage ?? "Não foi possível reenviar.");
    }
  }

  if (subStep === "email") {
    return (
      <form onSubmit={handleSendCode} className="flex flex-col gap-4">
        <p
          className="text-[13px]"
          style={{
            color: "rgba(245,239,230,0.7)",
            fontFamily: "var(--font-manrope)",
            lineHeight: 1.5,
          }}
        >
          Digite o e-mail da sua conta. Vamos enviar um código de 6 dígitos
          pra você redefinir a senha.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="fp-email" style={LABEL_STYLE}>
            E-mail
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={INPUT_STYLE}
          />
        </div>

        {error && (
          <p
            className="text-center text-[11px]"
            style={{ color: ROSE, fontFamily: "var(--font-manrope)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !signIn || !email}
          className={PRIMARY_BUTTON}
          style={PRIMARY_STYLE}
        >
          {submitting ? "Enviando..." : "Enviar código"}
        </button>
      </form>
    );
  }

  if (subStep === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
        <p
          className="text-center text-[13px]"
          style={{
            color: "rgba(245,239,230,0.7)",
            fontFamily: "var(--font-manrope)",
            lineHeight: 1.5,
          }}
        >
          Enviamos um código de 6 dígitos para
          <br />
          <span style={{ color: CREAM, fontWeight: 600 }}>{email}</span>
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="fp-code" style={LABEL_STYLE}>
            Código de verificação
          </label>
          <input
            id="fp-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            style={{
              ...INPUT_STYLE,
              textAlign: "center",
              letterSpacing: "0.4em",
              fontSize: "18px",
              fontWeight: 600,
            }}
          />
        </div>

        {error && (
          <p
            className="text-center text-[11px]"
            style={{ color: ROSE, fontFamily: "var(--font-manrope)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className={PRIMARY_BUTTON}
          style={PRIMARY_STYLE}
        >
          {submitting ? "Verificando..." : "Verificar código"}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={submitting}
          className="text-center text-[12px] underline underline-offset-4 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            color: ROSE,
            fontFamily: "var(--font-manrope)",
            fontWeight: 600,
          }}
        >
          Reenviar código
        </button>

        <button
          type="button"
          onClick={() => {
            setSubStep("email");
            setCode("");
            setError(null);
          }}
          className="text-center text-[11px] underline-offset-4 transition-opacity hover:opacity-80"
          style={{
            color: "rgba(245,239,230,0.55)",
            fontFamily: "var(--font-manrope)",
          }}
        >
          Usar outro e-mail
        </button>
      </form>
    );
  }

  if (subStep === "new-password") {
    const passwordsMatch =
      newPassword.length > 0 && newPassword === confirmPassword;
    const passwordLongEnough = newPassword.length >= 8;

    return (
      <form onSubmit={handleSubmitPassword} className="flex flex-col gap-4">
        <p
          className="text-[13px]"
          style={{
            color: "rgba(245,239,230,0.7)",
            fontFamily: "var(--font-manrope)",
            lineHeight: 1.5,
          }}
        >
          Código verificado. Agora escolha uma senha nova (mínimo 8
          caracteres).
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="fp-newpass" style={LABEL_STYLE}>
            Nova senha
          </label>
          <input
            id="fp-newpass"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fp-confirm" style={LABEL_STYLE}>
            Confirmar nova senha
          </label>
          <input
            id="fp-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={INPUT_STYLE}
          />
        </div>

        {error && (
          <p
            className="text-center text-[11px]"
            style={{ color: ROSE, fontFamily: "var(--font-manrope)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !passwordsMatch || !passwordLongEnough}
          className={PRIMARY_BUTTON}
          style={PRIMARY_STYLE}
        >
          {submitting ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: "rgba(78, 122, 74, 0.18)",
          color: "#A8D5A0",
          border: "1.5px solid rgba(168, 213, 160, 0.4)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p
        style={{
          color: CREAM,
          fontFamily: "var(--font-cormorant)",
          fontSize: "26px",
          fontStyle: "italic",
          lineHeight: 1.1,
        }}
      >
        Senha redefinida!
      </p>
      <p
        style={{
          color: "rgba(245,239,230,0.7)",
          fontFamily: "var(--font-manrope)",
          fontSize: "13px",
        }}
      >
        Entrando na sua conta...
      </p>
    </div>
  );
}
