"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../db.types";

/**
 * Client Supabase pour les composants "use client" (Browser).
 * Les sessions sont stockées en cookies HttpOnly côté serveur (via le proxy),
 * et lues côté client via les cookies non-HttpOnly du domaine.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
