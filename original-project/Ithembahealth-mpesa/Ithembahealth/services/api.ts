// services/api.ts
import { ServiceClient } from "../services/ithemba.client";
import { miniFetch } from "./mini-fetch";

type Tokens = { accessToken: string; refreshToken: string };
const KEY_AT = 'ih_at'; const KEY_RT = 'ih_rt';

function apiBase(): string {
  // strip trailing slash just in case
  const app = (typeof getApp === 'function') ? getApp() : null as any;
  const base = app && app.globalData && app.globalData.apiBase ? app.globalData.apiBase : "";
  return base.replace(/\/+$/, "");
}

function getTokens(): Tokens | null {
  try {
    const at = my.getStorageSync({ key: KEY_AT }).data || '';
    const rt = my.getStorageSync({ key: KEY_RT }).data || '';
    return (at || rt) ? { accessToken: at, refreshToken: rt } : null;
  } catch { return null; }
}
function saveTokens(t: Tokens | null) {
  try { my.setStorageSync({ key: KEY_AT, data: t?.accessToken || '' }); } catch {}
  try { my.setStorageSync({ key: KEY_RT, data: t?.refreshToken || '' }); } catch {}
}

async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const t = getTokens();
  const headers = { ...(init?.headers as any || {}) };
  if (t?.accessToken) headers['Authorization'] = `Bearer ${String(t.accessToken)}`;

  const res = await miniFetch(input as string, { ...(init||{}), headers });

  if ((res as any).status === 401 && t?.refreshToken) {
    const base = apiBase();
    const raw = new ServiceClient.Ithembahealth.Services.Client(base, { fetch: miniFetch });
    try {
      const refreshed = await raw.refresh({ refreshToken: t.refreshToken }); // adjust if your method name differs
      saveTokens({ accessToken: String(refreshed.accessToken || ''), refreshToken: String(refreshed.refreshToken || t.refreshToken) });
      const headers2 = { ...(init?.headers as any || {}), Authorization: `Bearer ${String(refreshed.accessToken || '')}` };
      return miniFetch(input as string, { ...(init||{}), headers: headers2 });
    } catch {
      saveTokens(null);
      return res as any;
    }
  }
  return res as any;
}

export function apiClient() {
  const base = apiBase();
  return new ServiceClient.Ithembahealth.Services.Client(base, { fetch: authFetch });
}
export async function login(phoneNumber: string, password: string) {
  const client = apiClient();
  const r = await client.login({ phoneNumber, password });
  saveTokens({ accessToken: String(r.accessToken || ''), refreshToken: String(r.refreshToken || '') });
  return r;
}
export function logout(){ saveTokens(null); }
