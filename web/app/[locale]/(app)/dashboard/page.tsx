import { getTranslations, setRequestLocale } from "next-intl/server";

import { Sparkle } from "@/components/ui/icons";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  // Stats fictives pour le placeholder — viendront de l'API/DB plus tard
  const stats = [
    { label: t("todayCards"), value: 0 },
    { label: t("streak"), value: "1 j" },
    { label: t("currentLevel"), value: "1" },
    { label: t("lessonsDone"), value: "0 / 164" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-8 md:py-10 space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-text-muted mt-2">{t("subtitle")}</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {s.label}
            </p>
            <p className="text-2xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong dark:text-accent">
            <Sparkle size={18} />
          </span>
          <h2 className="text-lg font-semibold">{t("todayNothing")}</h2>
        </div>
        <p className="text-text-muted text-sm">
          Le module SRS s'affichera ici quand on aura câblé l'API. En attendant, vas voir la liste des leçons.
        </p>
      </section>
    </div>
  );
}
