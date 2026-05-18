/**
 * Wrapper fetch typé vers l'API FastAPI.
 *
 * Côté serveur (RSC, Server Actions, route handlers) : on récupère le JWT
 * Supabase de la session courante et on l'envoie en Authorization header.
 *
 * Pour les appels côté client (use client), passer par fetch direct ou créer
 * un helper séparé qui utilise le client Supabase navigateur.
 */
import { createSupabaseServerClient } from "./supabase/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`);
  }
}

async function authHeader(): Promise<HeadersInit> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), ...(await authHeader()) },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
      ...(await authHeader()),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
      ...(await authHeader()),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}
