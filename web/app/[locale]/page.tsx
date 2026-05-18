import { redirect } from "next/navigation";

import { routing } from "@/i18n/routing";

// La racine localisée (/fr ou /en) redirige vers le dashboard.
// Plus tard on pourra avoir une landing publique ici.
export default async function LocaleRoot({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
