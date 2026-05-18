import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "../db.types";

/**
 * Client Supabase pour les Server Components, Server Actions, Route Handlers.
 *
 * Lit/écrit les cookies de session via next/headers. En Server Components on
 * a accès en lecture seule — l'écriture (setAll) déclenche une erreur silencieuse
 * gérée par le try/catch (les MAJ de session ont lieu dans le proxy, pas en RSC).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC : le store cookies est read-only. Le proxy s'occupe du refresh.
          }
        },
      },
    },
  );
}
