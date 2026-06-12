"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SignIn, SignUp, useClerk, useUser } from "@clerk/nextjs";
import { ForgotPasswordFlow } from "@/components/ForgotPasswordFlow";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PopynsLogoAnimated } from "@/components/PopynsLogoAnimated";
import { ClientProfile } from "@/components/profile/ClientProfile";
import { ProfessionalHome } from "@/components/professional/ProfessionalHome";

type Appearance = NonNullable<
  React.ComponentProps<typeof SignIn>["appearance"]
>;

type Phase =
  | "loading"
  | "splash"
  | "welcome"
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "onboarding"
  | "signed-in";

const SPLASH_TO_WELCOME_MS = 3400;
const SPLASH_SIZE = 60;
const WELCOME_SIZE = 44;
const EASE = [0.22, 1, 0.36, 1] as const;

const CREAM = "#F5EFE6";
const WINE = "#5C0331";
const ROSE = "#EAC8C0";

const PILL_BASE =
  "flex h-12 w-full items-center justify-center rounded-full px-6 text-[12px] font-bold uppercase tracking-[0.16em] transition-opacity active:opacity-80 disabled:opacity-50";

const clerkAppearance: Appearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    showOptionalFields: false,
    logoPlacement: "none",
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: CREAM,
    colorBackground: "transparent",
    colorText: CREAM,
    colorTextSecondary: "rgba(245,239,230,0.65)",
    colorTextOnPrimaryBackground: WINE,
    colorInputBackground: "rgba(245,239,230,0.10)",
    colorInputText: CREAM,
    colorNeutral: "rgba(245,239,230,0.40)",
    colorDanger: ROSE,
    colorSuccess: ROSE,
    colorWarning: ROSE,
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-manrope), system-ui, sans-serif",
    borderRadius: "1rem",
    fontSize: "14px",
    spacingUnit: "0.875rem",
  },
  elements: {
    rootBox: "!w-full !overflow-visible",
    cardBox: "!w-full !max-w-none !shadow-none !border-none !bg-transparent !p-0 !overflow-visible !rounded-none",
    card: "!shadow-none !border-none !bg-transparent !p-0 !overflow-visible !rounded-none",
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    logoBox: "!hidden",
    logoImage: "!hidden",
    main: "!gap-3.5",
    socialButtons: "!gap-2",
    socialButtonsBlockButton:
      "!h-12 !rounded-2xl !bg-transparent !border !border-[rgba(245,239,230,0.4)] hover:!bg-[rgba(245,239,230,0.06)] !transition-colors",
    socialButtonsBlockButtonText:
      "!text-[#F5EFE6] !font-semibold !normal-case !text-[13px] !tracking-normal",
    socialButtonsProviderIcon: "!h-5 !w-5",
    dividerRow: "!my-1",
    dividerLine: "!bg-[rgba(245,239,230,0.2)]",
    dividerText:
      "!text-[rgba(245,239,230,0.55)] !uppercase !tracking-[0.18em] !text-[10px] !font-semibold",
    formFieldRow: "!gap-1",
    formFieldLabelRow: "!mb-1",
    formFieldLabel:
      "!text-[rgba(245,239,230,0.55)] !uppercase !tracking-[0.14em] !text-[10px] !font-semibold",
    formFieldInput:
      "!h-12 !rounded-2xl !bg-[rgba(245,239,230,0.10)] !border !border-[rgba(245,239,230,0.20)] !text-[#F5EFE6] !px-5 !text-[14px] focus:!border-[rgba(245,239,230,0.5)] focus:!ring-0 placeholder:!text-[rgba(245,239,230,0.35)]",
    formFieldInputShowPasswordButton:
      "!text-[rgba(245,239,230,0.6)] hover:!text-[#F5EFE6]",
    phoneInputBox:
      "!rounded-2xl !bg-[rgba(245,239,230,0.10)] !border !border-[rgba(245,239,230,0.20)] !text-[#F5EFE6]",
    selectButton:
      "!bg-transparent !border-none !text-[#F5EFE6] hover:!bg-[rgba(245,239,230,0.06)]",
    selectButtonIcon: "!text-[#F5EFE6]",
    selectOptionsContainer:
      "!bg-[#3D0220] !border !border-[rgba(245,239,230,0.20)] !text-[#F5EFE6] !rounded-2xl",
    selectOption:
      "!text-[#F5EFE6] hover:!bg-[rgba(245,239,230,0.08)]",
    selectSearchInput:
      "!bg-[rgba(245,239,230,0.06)] !text-[#F5EFE6] !border !border-[rgba(245,239,230,0.20)] !rounded-xl",
    formFieldAction: "!text-[#EAC8C0] !font-semibold !text-[11px]",
    formFieldHintText: "!hidden",
    formFieldInfoText:
      "!text-[rgba(245,239,230,0.65)] !text-[11px] !leading-relaxed",
    formFieldSuccessText:
      "!text-[rgba(245,239,230,0.65)] !text-[11px] !leading-relaxed",
    formFieldWarningText: "!text-[#EAC8C0] !text-[11px] !leading-relaxed",
    formFieldErrorText: "!text-[#EAC8C0] !text-[11px]",
    formButtonPrimary:
      "!h-12 !rounded-2xl !bg-[#F5EFE6] !text-[#5C0331] !font-bold !uppercase !tracking-[0.16em] !text-[12px] !shadow-none !border-none hover:!opacity-90 focus:!ring-0 !normal-case",
    otpCodeField: "!flex !gap-2 !justify-center !bg-transparent !p-0",
    otpCodeFieldInputs: "!gap-2 !bg-transparent",
    otpCodeFieldInput:
      "!h-12 !w-10 !rounded-2xl !bg-[rgba(245,239,230,0.10)] !border !border-[rgba(245,239,230,0.20)] !text-[#F5EFE6] !text-center !text-[16px] focus:!border-[rgba(245,239,230,0.5)] focus:!ring-0",
    formResendCodeLink:
      "!text-[#EAC8C0] !font-semibold !text-[12px] hover:!underline !bg-transparent",
    formButtonReset:
      "!h-12 !rounded-2xl !bg-transparent !border !border-[rgba(245,239,230,0.30)] !text-[#F5EFE6] !font-semibold !text-[12px] hover:!bg-[rgba(245,239,230,0.06)]",
    headerBackRow: "!mb-3",
    headerBackLink: "!text-[#EAC8C0] !font-semibold !text-[12px] !bg-transparent",
    headerBackIcon: "!text-[#EAC8C0]",
    formHeaderTitle: "!hidden",
    formHeaderSubtitle: "!hidden",
    alert:
      "!rounded-2xl !bg-[rgba(234,200,192,0.08)] !border !border-[rgba(234,200,192,0.3)]",
    alertText: "!text-[#F5EFE6]",
    identityPreview:
      "!rounded-2xl !bg-[rgba(245,239,230,0.10)] !border !border-[rgba(245,239,230,0.20)] !px-4",
    identityPreviewText: "!text-[#F5EFE6]",
    identityPreviewEditButton: "!text-[#EAC8C0]",
    captchaContainer: "!my-2 !flex !justify-center !w-full",
    captcha: "!mx-auto",
    backRow: "!mb-2",
    backLink: "!text-[#EAC8C0] !font-semibold",
    footer: "!hidden",
    footerAction: "!hidden",
    footerActionText: "!text-[rgba(245,239,230,0.55)]",
    footerActionLink: "!text-[#EAC8C0] !font-semibold",
    badge: "!hidden !w-0 !h-0 !overflow-hidden !p-0 !m-0 !border-0 !absolute !opacity-0 !pointer-events-none",
    socialButtonsBlockButtonBadge:
      "!text-[#EAC8C0] !bg-[#5C0331] !border !border-[rgba(245,239,230,0.2)] !text-[9px] !font-bold !uppercase !tracking-wider !px-2.5 !py-0.5 !rounded-full !absolute !-top-2 !right-4 !shadow-md !flex !opacity-100 !pointer-events-auto",
    socialButtonsBlockButtonArrow: "!hidden",
  },
};

export default function HomePage() {
  const reduce = useReducedMotion();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();

  const [phase, setPhase] = useState<Phase>("loading");
  const [skipSplashAnim, setSkipSplashAnim] = useState(false);

  /* ── Desabilita validação nativa do browser nos forms do Clerk ──
     A tooltip "Please fill out this field." é do browser, não do Clerk.
     Colocamos noValidate em todos os <form> dentro do Clerk e traduzimos
     as mensagens de validação nativas para português. */
  useEffect(() => {
    function patchForms() {
      document
        .querySelectorAll<HTMLFormElement>(".cl-rootBox form")
        .forEach((form) => {
          form.noValidate = true;
        });

      document
        .querySelectorAll<HTMLInputElement>(".cl-rootBox input[required]")
        .forEach((input) => {
          input.addEventListener("invalid", () => {
            if (input.validity.valueMissing) {
              input.setCustomValidity("Por favor, preencha este campo.");
            } else if (input.validity.typeMismatch) {
              input.setCustomValidity("Por favor, insira um valor válido.");
            } else {
              input.setCustomValidity("");
            }
          });
          input.addEventListener("input", () => {
            input.setCustomValidity("");
          });
        });
    }

    patchForms();

    const observer = new MutationObserver(() => patchForms());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    if (isSignedIn) {
      setSkipSplashAnim(true);
      const onboardingComplete = Boolean(
        user?.unsafeMetadata?.onboardingComplete,
      );
      setPhase(onboardingComplete ? "signed-in" : "onboarding");
      return;
    }

    const seen =
      typeof window !== "undefined" &&
      sessionStorage.getItem("popyns-splash-seen") === "1";

    if (seen || reduce) {
      setSkipSplashAnim(true);
      setPhase("welcome");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("popyns-splash-seen", "1");
      }
      return;
    }

    setPhase("splash");
    const t = setTimeout(() => {
      setPhase("welcome");
      sessionStorage.setItem("popyns-splash-seen", "1");
    }, SPLASH_TO_WELCOME_MS);
    return () => clearTimeout(t);
  }, [userLoaded, isSignedIn, reduce, user]);

  async function handleSignOut() {
    await clerk.signOut();
    setSkipSplashAnim(true);
    setPhase("welcome");
  }

  if (phase === "loading") {
    return <main className="bg-wine-gradient halo-rose h-dvh w-full" />;
  }

  if (phase === "onboarding") {
    return (
      <OnboardingWizard onComplete={() => setPhase("signed-in")} />
    );
  }

  const isSplashPhase = phase === "splash";
  const isWelcomePhase = phase === "welcome";
  const isSignInPhase = phase === "sign-in";
  const isSignUpPhase = phase === "sign-up";
  const isForgotPasswordPhase = phase === "forgot-password";
  const isAuthPhase = isSignInPhase || isSignUpPhase || isForgotPasswordPhase;
  const isSignedInPhase = phase === "signed-in";

  const showLogo = isSplashPhase || isWelcomePhase;
  const logoTop = isSplashPhase ? "50%" : "38%";
  const logoScale = isSplashPhase ? 1 : WELCOME_SIZE / SPLASH_SIZE;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-wine-gradient halo-rose">
      <motion.div
        className="absolute z-10"
        initial={{
          top: skipSplashAnim ? "38%" : "50%",
          x: "-50%",
          y: "-50%",
          scale: skipSplashAnim ? WELCOME_SIZE / SPLASH_SIZE : 1,
          opacity: 1,
        }}
        animate={{
          top: logoTop,
          x: "-50%",
          y: "-50%",
          scale: logoScale,
          opacity: showLogo ? 1 : 0,
        }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ left: "50%", pointerEvents: showLogo ? "auto" : "none" }}
      >
        <PopynsLogoAnimated size={SPLASH_SIZE} skipEntrance={skipSplashAnim} />
      </motion.div>

      <motion.p
        className="absolute bottom-8 left-1/2 z-0 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSplashPhase ? 1 : 0 }}
        transition={{
          duration: isSplashPhase ? 0.6 : 0.35,
          delay: isSplashPhase ? 3.0 : 0,
          ease: EASE,
        }}
        style={{
          fontFamily: "var(--font-manrope)",
          fontWeight: 600,
          letterSpacing: "0.30em",
          color: "rgba(245,239,230,0.40)",
        }}
      >
        v 1.0 · 2026
      </motion.p>

      <motion.div
        className="absolute right-0 left-0 z-10 flex justify-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{
          opacity: isWelcomePhase ? 1 : 0,
          y: isWelcomePhase ? 0 : 24,
        }}
        transition={{
          duration: 0.6,
          delay: isWelcomePhase ? 0.3 : 0,
          ease: EASE,
        }}
        style={{
          top: "52%",
          pointerEvents: isWelcomePhase ? "auto" : "none",
        }}
      >
        <div className="flex w-full max-w-[420px] flex-col items-center px-8">
          <button
            type="button"
            onClick={() => setPhase("sign-in")}
            className="flex h-14 w-full items-center justify-center rounded-full px-6 text-[13px] font-bold uppercase tracking-[0.18em] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: CREAM,
              color: WINE,
              fontFamily: "var(--font-manrope)",
            }}
          >
            Entrar
          </button>

          <p
            className="mt-6 text-center text-[12px]"
            style={{
              color: "rgba(245,239,230,0.7)",
              fontFamily: "var(--font-manrope)",
            }}
          >
            Novo por aqui?{" "}
            <button
              type="button"
              onClick={() => setPhase("sign-up")}
              className="underline underline-offset-4 transition-opacity hover:opacity-80"
              style={{ color: ROSE, fontWeight: 600 }}
            >
              Cadastre-se
            </button>
          </p>

          <p
            className="mx-auto mt-4 max-w-[280px] text-center text-[10px] leading-relaxed"
            style={{
              color: "rgba(245,239,230,0.4)",
              fontFamily: "var(--font-manrope)",
            }}
          >
            Ao continuar, você concorda com nossos{" "}
            <Link
              href="/termos-de-uso"
              className="underline hover:text-[rgba(245,239,230,0.85)] transition-colors"
            >
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link
              href="/politica-de-privacidade"
              className="underline hover:text-[rgba(245,239,230,0.85)] transition-colors"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 z-20 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAuthPhase ? 1 : 0 }}
        transition={{
          duration: 0.5,
          delay: isAuthPhase ? 0.2 : 0,
          ease: EASE,
        }}
        style={{ pointerEvents: isAuthPhase ? "auto" : "none" }}
      >
        <div className="flex h-full w-full max-w-[420px] flex-col overflow-y-auto px-6 pt-4 pb-6">
          <button
            type="button"
            onClick={() => setPhase("welcome")}
            aria-label="Voltar"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[rgba(245,239,230,0.06)]"
            style={{ color: CREAM }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <header className="mt-4 shrink-0">
            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "34px",
                lineHeight: 1.1,
                color: CREAM,
              }}
            >
              {isForgotPasswordPhase ? (
                <>
                  Esqueceu
                  <br />
                  a senha?
                </>
              ) : isSignUpPhase ? (
                <>
                  Bem-vinda
                  <br />
                  ao POPYNS
                </>
              ) : (
                <>
                  Bem-vinda
                  <br />
                  de volta
                </>
              )}
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: "var(--font-manrope)",
                fontSize: "13px",
                color: "rgba(245,239,230,0.65)",
              }}
            >
              {isForgotPasswordPhase
                ? "Vamos te ajudar a recuperar"
                : isSignUpPhase
                  ? "Crie sua conta POPYNS"
                  : "Entre na sua conta POPYNS"}
            </p>
          </header>

          <div className="mt-6 shrink-0">
            {isSignInPhase && (
              <SignIn
                appearance={clerkAppearance}
                routing="hash"
                signUpUrl="#sign-up"
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              />
            )}
            {isSignUpPhase && (
              <SignUp
                appearance={clerkAppearance}
                routing="hash"
                signInUrl="#sign-in"
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              />
            )}
            {isForgotPasswordPhase && <ForgotPasswordFlow />}
          </div>

          <div
            className="mt-auto flex shrink-0 flex-col items-center gap-3 pt-6 text-center text-[11px]"
            style={{
              color: "rgba(245,239,230,0.55)",
              fontFamily: "var(--font-manrope)",
            }}
          >
            {isSignInPhase && (
              <>
                <button
                  type="button"
                  onClick={() => setPhase("forgot-password")}
                  className="underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: ROSE, fontWeight: 600, fontSize: "12px" }}
                >
                  Esqueci minha senha
                </button>
                <p>
                  Novo por aqui?{" "}
                  <button
                    type="button"
                    onClick={() => setPhase("sign-up")}
                    className="underline"
                    style={{ color: ROSE, fontWeight: 600 }}
                  >
                    Cadastre-se
                  </button>
                </p>
              </>
            )}

            {isSignUpPhase && (
              <p>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setPhase("sign-in")}
                  className="underline"
                  style={{ color: ROSE, fontWeight: 600 }}
                >
                  Entrar
                </button>
              </p>
            )}

            {isForgotPasswordPhase && (
              <p>
                Lembrou da senha?{" "}
                <button
                  type="button"
                  onClick={() => setPhase("sign-in")}
                  className="underline"
                  style={{ color: ROSE, fontWeight: 600 }}
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSignedInPhase ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ pointerEvents: isSignedInPhase ? "auto" : "none" }}
      >
        {user?.unsafeMetadata?.tipo === "cliente" ? (
          <ClientProfile />
        ) : user?.unsafeMetadata?.tipo === "profissional" ? (
          <ProfessionalHome />
        ) : (
          <div className="flex flex-col items-center justify-center px-8">
            <h1
              className="text-center"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "32px",
                lineHeight: 1.15,
                color: CREAM,
              }}
            >
              Olá, {user?.firstName ?? "linda"}
            </h1>
            <p
              className="mt-3 text-center"
              style={{
                fontFamily: "var(--font-manrope)",
                fontSize: "13px",
                color: "rgba(245,239,230,0.65)",
              }}
            >
              Você está conectada ao POPYNS.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className={`${PILL_BASE} mt-10 max-w-[260px]`}
              style={{
                backgroundColor: "transparent",
                color: CREAM,
                border: "1.5px solid rgba(245,239,230,0.4)",
                fontFamily: "var(--font-manrope)",
              }}
            >
              Sair
            </button>

            <button
              type="button"
              onClick={async () => {
                await user?.update({
                  unsafeMetadata: {
                    ...user.unsafeMetadata,
                    tipo: "cliente",
                  },
                });
              }}
              className={`${PILL_BASE} mt-4 max-w-[260px]`}
              style={{
                backgroundColor: CREAM,
                color: WINE,
                fontFamily: "var(--font-manrope)",
              }}
            >
              Simular como Cliente (Dev)
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
