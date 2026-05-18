/**
 * Callback OAuth — Supabase redirige ici après le flow Google/Apple/etc.
 * On échange le `code` contre une session puis on redirige vers `next`.
 *
 * Placé hors de [locale] car ouvert au callback externe.
 */
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const locale = (() => {
    const first = next.split("/").filter(Boolean)[0];
    return (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale;
  })();

  const dest = next.startsWith("/") ? next : `/${next}`;
  const fullDest = dest.startsWith(`/${locale}`) ? dest : `/${locale}${dest}`;

  if (!code) return NextResponse.redirect(new URL(`/${locale}/login`, url.origin));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(fullDest, url.origin));
}
