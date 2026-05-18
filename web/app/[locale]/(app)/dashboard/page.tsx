import { getTranslations, setRequestLocale } from "next-intl/server";

import { LessonInCourseCard } from "@/components/dashboard/LessonInCourseCard";
import { LevelProgress } from "@/components/dashboard/LevelProgress";
import { SessionSteps } from "@/components/dashboard/SessionSteps";
import { StreakGrid, type StreakDay } from "@/components/dashboard/StreakGrid";
import { VocabReviewCard } from "@/components/dashboard/VocabReviewCard";

// LevelProgress est un client component, on doit l'utiliser tel quel ici (server)
// car Next 16 permet de rendre un client component dans un server component.

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  // TODO : remplacer ces placeholders par des fetchs DB une fois l'auth câblée.
  // Pour l'instant on rend la page avec des données fictives pour valider le layout.
  const currentLevel = 2 as const;
  const lesson = {
    level: 2,
    chapter: 4,
    section: 1,
    title_ko: "주말 계획",
    intent: "Parler de ses projets du week-end.",
    progress_done: 7,
    progress_total: 20,
  };
  const vocab = {
    cards_count: 24,
    locked: true,
    preview: [
      { hangeul: "계획", translation: "plan" },
      { hangeul: "주말", translation: "week-end" },
      { hangeul: "같이", translation: "ensemble" },
    ],
  };
  const streak = 12;
  const today = new Date();
  const days: StreakDay[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (9 - i));
    return {
      date: d.toISOString().slice(0, 10),
      status: i < 9 ? (i % 2 === 0 ? "lesson" : "vocab") : "miss",
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* Hero — Korean greeting + level indicator */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-accent-strong dark:text-accent text-sm font-semibold flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            {t("sessionToday")}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {t("heroKo")}
          </h1>
        </div>
        <LevelProgress current={currentLevel} />
      </header>

      <SessionSteps />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LessonInCourseCard lesson={lesson} />
        <VocabReviewCard {...vocab} />
      </section>

      <StreakGrid days={days} streak={streak} />
    </div>
  );
}
