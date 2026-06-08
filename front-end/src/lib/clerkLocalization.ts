import { ptBR } from "@clerk/localizations";

type LocaleObject = Record<string, unknown>;

function deepMerge<T extends LocaleObject>(base: T, override: LocaleObject): T {
  const out: LocaleObject = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = (base as LocaleObject)[key];
    const overrideVal = override[key];
    if (
      baseVal &&
      overrideVal &&
      typeof baseVal === "object" &&
      typeof overrideVal === "object" &&
      !Array.isArray(baseVal) &&
      !Array.isArray(overrideVal)
    ) {
      out[key] = deepMerge(baseVal as LocaleObject, overrideVal as LocaleObject);
    } else {
      out[key] = overrideVal;
    }
  }
  return out as T;
}

const overrides: LocaleObject = {
  socialButtonsBlockButton: "Continuar com {{provider|titleize}}",
  dividerText: "ou",
  formFieldLabel__emailAddress: "E-mail",
  formFieldLabel__emailAddress_username: "E-mail ou usuário",
  formFieldLabel__emailAddress_phoneNumber: "E-mail ou telefone",
  formFieldLabel__phoneNumber: "Telefone",
  formFieldLabel__password: "Senha",
  formFieldLabel__newPassword: "Nova senha",
  formFieldLabel__confirmPassword: "Confirmar senha",
  formFieldLabel__currentPassword: "Senha atual",
  formFieldLabel__firstName: "Nome",
  formFieldLabel__lastName: "Sobrenome",
  formFieldLabel__username: "Usuário",
  formFieldInputPlaceholder__password: "Digite sua senha",
  formFieldInputPlaceholder__confirmPassword: "Confirme sua senha",
  formFieldInputPlaceholder__emailAddress: "seu@email.com",
  formFieldInputPlaceholder__phoneNumber: "Seu telefone",
  formFieldAction__forgotPassword: "Esqueci minha senha",
  formButtonPrimary: "Continuar",
  formButtonPrimary__verify: "Verificar",
  signIn: {
    start: {
      title: "Entrar",
      subtitle: "Bem-vinda de volta",
      actionText: "Novo por aqui?",
      actionLink: "Cadastre-se",
    },
    password: {
      title: "Digite sua senha",
      subtitle: "para continuar no POPYNS",
      actionLink: "Use outro método",
    },
    forgotPassword: {
      title_email: "Verifique seu e-mail",
      title_phone: "Verifique seu telefone",
      subtitle: "para redefinir sua senha",
      formTitle: "Código de redefinição de senha",
      formSubtitle_email: "Digite o código enviado para seu e-mail",
      formSubtitle_phone: "Digite o código enviado para seu telefone",
      resendButton: "Não recebi o código. Reenviar",
    },
    resetPassword: {
      title: "Redefinir sua senha",
      formButtonPrimary: "Redefinir senha",
      successMessage: "Sua senha foi redefinida. Entrando...",
    },
  },
  signUp: {
    start: {
      title: "Criar conta",
      subtitle: "Bem-vinda ao POPYNS",
      actionText: "Já tem conta?",
      actionLink: "Entrar",
    },
    emailCode: {
      title: "Verifique seu e-mail",
      subtitle: "para concluir seu cadastro",
      formTitle: "Código de verificação",
      formSubtitle: "Digite o código enviado para seu e-mail",
      resendButton: "Não recebi o código. Reenviar",
    },
    phoneCode: {
      title: "Verifique seu telefone",
      subtitle: "para concluir seu cadastro",
      formTitle: "Código de verificação",
      formSubtitle: "Digite o código enviado para seu telefone",
      resendButton: "Não recebi o código. Reenviar",
    },
    continue: {
      title: "Falta pouco",
      subtitle: "Complete seu cadastro",
      actionText: "Já tem conta?",
      actionLink: "Entrar",
    },
  },
  unstable__errors: {
    form_password_pwned:
      "Essa senha foi exposta em vazamentos públicos. Escolha outra.",
    form_password_not_strong_enough: "Sua senha não está forte o suficiente.",
    form_password_length_too_short:
      "Sua senha é curta demais. Tente novamente.",
    form_password_incorrect: "Senha incorreta.",
    form_password_or_identifier_incorrect:
      "E-mail/telefone ou senha incorretos. Tente novamente.",
    form_identifier_not_found:
      "Nenhuma conta encontrada com esses dados.",
    form_identifier_exists__email_address:
      "Esse e-mail já está em uso.",
    form_identifier_exists__phone_number:
      "Esse telefone já está em uso.",
    form_param_format_invalid__email_address: "Digite um e-mail válido.",
    form_param_format_invalid__phone_number: "Digite um telefone válido.",
    form_param_nil: "Esse campo é obrigatório.",
  },
};

export const popynsLocalization = deepMerge(
  ptBR as unknown as LocaleObject,
  overrides,
) as typeof ptBR;
