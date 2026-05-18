import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function VocabPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-3xl px-5 md:px-8 py-8 md:py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("vocab")}</h1>
      <p className="text-text-muted mt-2">SRS via FSRS · ~2000 mots prêts à enroller au fil des leçons.</p>
    </div>
  );
}
