import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

// Routes publiques (pas besoin d'être connecté).
// Le préfixe locale (/fr ou /en) est strippé avant le match.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback", "/dev"];

function stripLocale(pathname: string): string {
  for (const l of routing.locales) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

function isPublic(pathname: string): boolean {
  const p = stripLocale(pathname);
  return PUBLIC_PATHS.some((pub) => p === pub || p.startsWith(pub + "/"));
}

export default async function proxy(request: NextRequest) {
  // 1. Refresh la session Supabase (rotation cookies) + récupère l'utilisateur
  const { response: authResponse, user } = await updateSupabaseSession(request);

  // 2. Route i18n par-dessus
  const intlResponse = intlMiddleware(request);

  // Si i18n veut rediriger (locale manquante), on respecte avec les cookies de refresh
  if (intlResponse.headers.get("location")) {
    authResponse.cookies.getAll().forEach((c) => intlResponse.cookies.set(c));
    return intlResponse;
  }

  // 3. Garde-fou auth : route privée + pas d'user → /login (avec ?next=)
  const { pathname, search } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    url.pathname = `/${locale}/login`;
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return authResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
