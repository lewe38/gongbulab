import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function SrsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-3xl px-5 md:px-8 py-8 md:py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("srs")}</h1>
      <p className="text-text-muted mt-2">Bientôt — algo FSRS sur les 2003 mots déjà en DB.</p>
    </div>
  );
}
