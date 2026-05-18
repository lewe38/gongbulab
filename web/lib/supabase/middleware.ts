import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "../db.types";

/**
 * Rafraîchit la session Supabase à chaque requête (refresh token rotation).
 * À appeler depuis le proxy avant/après le routing i18n.
 *
 * Renvoie la response (avec les cookies mis à jour) et l'utilisateur courant
 * pour qu'on puisse rediriger vers /login si nécessaire dans le proxy.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠ ne JAMAIS appeler getSession() côté serveur — il ne valide pas le token.
  // getUser() refait un round-trip Auth qui valide réellement.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
