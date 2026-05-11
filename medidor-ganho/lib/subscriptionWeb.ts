import { Platform } from 'react-native';

const STORAGE_KEY = 'medidor_access_token';

/** Mensalidade: só ativa com EXPO_PUBLIC_REQUIRE_SUBSCRIPTION=1 (e fluxo de token). */
export function requireSubscription(): boolean {
  return process.env.EXPO_PUBLIC_REQUIRE_SUBSCRIPTION === '1';
}

export function isSkipPaywall(): boolean {
  if (process.env.EXPO_PUBLIC_SKIP_PAYWALL === '1') return true;
  if (!requireSubscription()) return true;
  return false;
}

export function showTestHint(): boolean {
  return process.env.EXPO_PUBLIC_SHOW_TEST_HINT === '1';
}

export function checkoutUrl(): string {
  return process.env.EXPO_PUBLIC_CHECKOUT_URL ?? '';
}

export function loadStoredToken(): string | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function saveStoredToken(token: string): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, token.trim());
  }
}

export function clearStoredToken(): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function apiBase(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export async function refreshAccessFromApi(token: string): Promise<{ active: boolean }> {
  try {
    const base = apiBase();
    const url = `${base}/api/me`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { active: false };
    const data = (await res.json()) as { active?: boolean };
    return { active: Boolean(data.active) };
  } catch {
    return { active: false };
  }
}
