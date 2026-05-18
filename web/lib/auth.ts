"use server";

/**
 * Server Actions d'auth — utilisables directement depuis des formulaires
 * (action={signUpAction}) ou appelées en client via React.useTransition.
 *
 * Le proxy s'occupe de rafraîchir la session à chaque requête,
 * on a juste à set les cookies au moment du sign-in.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "./supabase/server";

// ─── Schémas de validation ─────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

const signUpSchema = credentialsSchema.extend({
  display_name: z.string().min(1).max(60).optional(),
});

export type AuthState = { ok: true } | { ok: false; error: string };

// ─── Helpers ───────────────────────────────────────────────────────
async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function localeFromPath(next: string | null): string {
  if (!next) return routing.defaultLocale;
  const first = next.split("/").filter(Boolean)[0];
  return (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale;
}

// ─── Actions ───────────────────────────────────────────────────────
export async function signUpAction(_: AuthState | null, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    display_name: formData.get("display_name") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.display_name ? { display_name: parsed.data.display_name } : undefined,
      emailRedirectTo: `${await originFromHeaders()}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: error.message };

  // Le trigger `handle_new_user` crée la row profiles automatiquement
  return { ok: true };
}

export async function signInAction(_: AuthState | null, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message };

  const next = (formData.get("next") as string) || "/dashboard";
  redirect(`/${localeFromPath(next)}${next.startsWith("/") ? next : "/" + next}`);
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const next = (formData.get("next") as string) || "/dashboard";
  const supabase = await createSupabaseServerClient();
  const origin = await originFromHeaders();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw new Error(error.message);
  if (data.url) redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${routing.defaultLocale}/login`);
}
