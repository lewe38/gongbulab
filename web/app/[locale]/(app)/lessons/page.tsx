import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChapterCard } from "@/components/lessons/ChapterCard";
import { LevelTabs } from "@/components/lessons/LevelTabs";
import { getChaptersByLevel, type Locale } from "@/lib/lessons";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string }>;
};

const VALID_LEVELS = [1, 2, 3, 4] as const;

export default async function LessonsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("lessons");
  const tD = await getTranslations("dashboard");

  const requested = Number(sp.level);
  const level = (VALID_LEVELS as readonly number[]).includes(requested)
    ? (requested as 1 | 2 | 3 | 4)
    : 1;

  let chaptersByLevel: Awaited<ReturnType<typeof getChaptersByLevel>> = {};
  let fetchError: string | null = null;
  try {
    chaptersByLevel = await getChaptersByLevel(locale as Locale);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  const chapters = chaptersByLevel[level] ?? [];
  // TODO : la progression et l'état viendront de la table user_progress (à créer)
  //        + jointure srs_cards. Pour l'instant tout est en "todo".

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-accent-strong dark:text-accent text-sm font-semibold flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {t("title")}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {tD("level", { n: level })} · {tD(`levelLabels.${level}` as `levelLabels.${1 | 2 | 3 | 4}`)}
        </h1>
        <p className="text-text-muted">{t("subtitle")}</p>
      </header>

      <LevelTabs activeLevel={level} />

      {fetchError && (
        <div className="rounded-xl border border-srs-again/30 bg-srs-again/5 p-4 text-sm text-srs-again">
          Impossible de charger les leçons : {fetchError}
        </div>
      )}

      {!fetchError && chapters.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-text-muted">
            Aucun chapitre trouvé pour ce niveau. Le contenu est en cours d'import.
          </p>
        </div>
      )}

      {chapters.length > 0 && (
        <ul className="space-y-2 md:space-y-3">
          {chapters.map((c) => (
            <li key={`${c.level}-${c.chapter_number}`}>
              <ChapterCard
                href={`/${locale}/lessons/${c.level}/${c.chapter_number}`}
                number={c.chapter_number}
                title_ko={c.title_ko}
                intent={c.intent ?? c.title_translated}
                sections_count={c.sections_count}
                grammar_count={c.grammar_count}
                status="todo"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
