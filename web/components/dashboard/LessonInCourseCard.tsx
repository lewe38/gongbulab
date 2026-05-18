import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { BookOpenText, Play } from "@/components/ui/icons";

export type LessonInCourse = {
  level: number;
  chapter: number;
  section: number;
  title_ko: string;
  intent: string | null;
  progress_done: number;
  progress_total: number;
};

export async function LessonInCourseCard({ lesson }: { lesson: LessonInCourse }) {
  const t = await getTranslations("dashboard.lessonInCourse");
  const locale = await getLocale();
  const pct = Math.min(
    100,
    Math.round((lesson.progress_done / Math.max(1, lesson.progress_total)) * 100),
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
      <header className="flex items-center gap-2 text-text-muted">
        <BookOpenText size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{t("title")}</span>
      </header>

      <div className="flex items-start gap-4 md:gap-6">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-2xl md:text-3xl font-bold tracking-tight truncate">
            {lesson.title_ko}
          </p>
          {lesson.intent && (
            <p className="text-text-muted text-sm md:text-base">{lesson.intent}</p>
          )}
        </div>
        {/* Mini illustration sobre — feuille en SVG inline, placeholder léger */}
        <svg
          width="56" height="56" viewBox="0 0 56 56" fill="none"
          className="text-accent-strong/60 dark:text-accent/60 shrink-0 hidden sm:block"
          aria-hidden
        >
          <path d="M10 46c8-26 30-32 38-32 0 18-10 36-30 36-4 0-8-1-8-4z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 42c10-14 22-22 30-26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted text-right tabular-nums">
          {t("progress", { done: lesson.progress_done, total: lesson.progress_total })}
        </p>
      </div>

      <Link
        href={`/${locale}/lessons/${lesson.level}/${lesson.chapter}/${lesson.section}`}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg px-4 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Play size={14} />
        {t("resumeCta")}
      </Link>
    </div>
  );
}
