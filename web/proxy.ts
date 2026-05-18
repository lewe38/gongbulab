import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match toutes les routes SAUF :
  // - les internes Next (_next, _vercel)
  // - les fichiers statiques (avec un point dans le nom : .ico, .png, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
