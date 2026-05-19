const KEYS = {
  accessToken:  "dropbox-access-token",
  refreshToken: "dropbox-refresh-token",
  expiresAt:    "dropbox-token-expires-at",
  accountName:  "dropbox-account-name",
} as const;

export interface TokenBundle {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number; // ms since epoch
  accountName:  string;
}

export function saveTokens(bundle: TokenBundle): void {
  localStorage.setItem(KEYS.accessToken,  bundle.accessToken);
  localStorage.setItem(KEYS.refreshToken, bundle.refreshToken);
  localStorage.setItem(KEYS.expiresAt,    String(bundle.expiresAt));
  localStorage.setItem(KEYS.accountName,  bundle.accountName);
}

export function loadTokens(): TokenBundle | null {
  const accessToken  = localStorage.getItem(KEYS.accessToken);
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  const expiresAt    = localStorage.getItem(KEYS.expiresAt);
  const accountName  = localStorage.getItem(KEYS.accountName);
  if (!accessToken || !refreshToken || !expiresAt || !accountName) return null;
  return { accessToken, refreshToken, expiresAt: Number(expiresAt), accountName };
}

export function clearTokens(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// 60-second buffer so we refresh before the token actually expires
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt - 60_000;
}

// Module-level singleton prevents concurrent refresh races
export let refreshPromise: Promise<string | null> | null = null;
export function setRefreshPromise(p: Promise<string | null> | null): void {
  refreshPromise = p;
}
