import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function LessonsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lessons");

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-8 md:py-10 space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-text-muted mt-2">{t("subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-text-muted">
          Liste à câbler depuis Supabase — viendra dans le prochain commit.
        </p>
      </div>
    </div>
  );
}
