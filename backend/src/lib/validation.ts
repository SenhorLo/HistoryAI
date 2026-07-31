/*
  Regras de cadastro. Este arquivo é a AUTORIDADE: o frontend tem uma cópia
  (frontend/src/lib/validation.ts) só para dar feedback enquanto se digita.
  Mudou aqui, mude lá — e o servidor sempre revalida, então divergência
  falha fechado (rejeita), nunca aberto.
*/

export const PASSWORD_MIN_LENGTH = 8;

/** Cada requisito da senha, na ordem em que é mostrado ao usuário. */
export const PASSWORD_RULES = [
  {
    id: "length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (v: string) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    // \p{Lu} pega maiúscula em qualquer alfabeto, não só A-Z
    label: "Uma letra maiúscula",
    test: (v: string) => /\p{Lu}/u.test(v),
  },
  {
    id: "digit",
    label: "Um número",
    test: (v: string) => /\p{N}/u.test(v),
  },
  {
    id: "special",
    // "especial" = não é letra nem número em nenhum alfabeto. Definir como
    // [^A-Za-z0-9] faria um "á" contar como especial, o que não é a intenção.
    label: "Um caractere especial (ex.: ! @ # $ %)",
    test: (v: string) => /[^\p{L}\p{N}]/u.test(v),
  },
] as const;

/** Requisitos ainda não atendidos. Vazio = senha válida. */
export function passwordFailures(password: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
}

export function isPasswordValid(password: string): boolean {
  return passwordFailures(password).length === 0;
}

/*
  E-mail: formato + domínio plausível. Não é lista fechada de provedores —
  e-mail corporativo e acadêmico precisam passar.
*/
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;
const LOCAL_PART = /^[A-Za-z0-9._%+-]+$/;
const DOMAIN_LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TLD = /^[A-Za-z]{2,24}$/;

/*
  Domínios que existem só como exemplo. Os TLDs vêm da RFC 2606, que os
  reserva justamente para documentação e teste — nunca são entregáveis.
*/
const RESERVED_TLDS = new Set(["test", "example", "invalid", "localhost"]);
const PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "exemplo.com",
  "exemplo.com.br",
  "teste.com",
  "teste.com.br",
  "test.com",
  "email.test",
]);

export function emailFailure(email: string): string | null {
  const value = email.trim().toLowerCase();

  if (!value) return "Informe seu e-mail.";
  if (!EMAIL_SHAPE.test(value)) return "E-mail inválido.";

  const at = value.lastIndexOf("@");
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);

  if (local.length > 64 || !LOCAL_PART.test(local)) return "E-mail inválido.";
  if (value.length > 254) return "E-mail inválido.";

  const labels = domain.split(".");
  if (labels.length < 2) {
    return "O domínio do e-mail está incompleto (falta algo como .com).";
  }
  if (!labels.every((l) => DOMAIN_LABEL.test(l))) return "E-mail inválido.";

  const tld = labels[labels.length - 1];
  if (!TLD.test(tld)) return "O domínio do e-mail não parece válido.";
  if (RESERVED_TLDS.has(tld) || PLACEHOLDER_DOMAINS.has(domain)) {
    return "Use um e-mail real — este domínio existe apenas para testes.";
  }

  return null;
}

export function isEmailValid(email: string): boolean {
  return emailFailure(email) === null;
}

/** Normaliza para gravar e comparar sempre da mesma forma. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const DISPLAY_NAME_MAX = 40;

export function displayNameFailure(name: string): string | null {
  const value = name.trim();
  if (value.length < 2) return "Use pelo menos 2 caracteres.";
  if (value.length > DISPLAY_NAME_MAX) {
    return `Use no máximo ${DISPLAY_NAME_MAX} caracteres.`;
  }
  return null;
}
