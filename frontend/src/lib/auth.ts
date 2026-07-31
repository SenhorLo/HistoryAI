const TOKEN_KEY = "historyai_token";
const EMAIL_KEY = "historyai_email";
const NAME_KEY = "historyai_display_name";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

/**
 * Nome escolhido pelo usuário. Espelho local do que está no banco — a fonte
 * da verdade é o servidor, que devolve o valor no login.
 */
export function getDisplayName(): string | null {
  return localStorage.getItem(NAME_KEY) || null;
}

export function saveDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function saveSession(
  token: string,
  email: string,
  displayName: string | null,
) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  // limpa o nome de uma sessão anterior: trocar de conta não pode herdar
  // o apelido de quem estava logado antes
  if (displayName) localStorage.setItem(NAME_KEY, displayName);
  else localStorage.removeItem(NAME_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
}
