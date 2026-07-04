// Client-side API helper. The session (token + tenant config) lives in
// localStorage; every request is Bearer-authenticated and any 401 bounces
// back to the login page. Tenant identity comes from the token — the
// dashboard never sends a tenant id.

import type { TenantConfig } from "@hpas/types";

export interface Session {
  token: string;
  tenant: { id: string; name: string; config: TenantConfig };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("hpas_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  window.localStorage.setItem("hpas_session", JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem("hpas_session");
}

export async function login(tenant: string, password: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "login failed");
  const body = await res.json();
  const session = { token: body.token, tenant: body.tenant } as Session;
  setSession(session);
  return session;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const session = getSession();
  if (!session) {
    window.location.href = "/";
    throw new Error("not logged in");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.token}`);
  if (init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}/v1/app${path}`, { ...init, headers });
  if (res.status === 401) {
    clearSession();
    window.location.href = "/";
    throw new Error("session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
