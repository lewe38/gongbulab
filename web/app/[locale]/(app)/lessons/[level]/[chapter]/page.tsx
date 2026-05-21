import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChevronLeft } from "@/components/ui/icons";
import { getChapterDetail } from "@/lib/lesson-detail";
import type { Locale } from "@/lib/lessons";

type Props = {
  params: Promise<{ locale: string; level: string; chapter: string }>;
};

export default async function ChapterPage({ params }: Props) {
  const { locale, level: lvlStr, chapter: chStr } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const level = Number(lvlStr);
  const chapter = Number(chStr);

  if (![1, 2, 3, 4].includes(level) || !Number.isFinite(chapter)) notFound();

  const detail = await getChapterDetail(level, chapter, locale as Locale);
  if (!detail || detail.sections.length === 0) notFound();

  const firstIntent = detail.sections[0].intent;
  const chapterTitleKo = detail.chapter_title_ko ?? detail.sections[0].title_ko;
  const chapterTitleTr = detail.chapter_title_translated ?? detail.sections[0].title_translated;

  return (
    <article className="mx-auto max-w-3xl px-5 md:px-8 py-6 md:py-10 space-y-10">
      <header className="space-y-3">
        <Link
          href={`/${locale}/lessons?level=${level}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft size={16} />
          {t("lessons.title")}
        </Link>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-accent-strong dark:text-accent text-sm font-semibold">
            {t("dashboard.level", { n: level })} · {chapter}과
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{chapterTitleKo}</h1>
        {chapterTitleTr && chapterTitleTr !== chapterTitleKo && (
          <p className="text-text-muted text-lg">{chapterTitleTr}</p>
        )}
        {firstIntent && <p className="text-text-muted italic">{firstIntent}</p>}
      </header>

      {detail.sections.map((sec, i) => (
        <section key={sec.id} className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Section {sec.section_number}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{sec.title_ko}</h2>
            {sec.title_translated && (
              <p className="text-text-muted">{sec.title_translated}</p>
            )}
          </div>

          {sec.dialogue_ko && (
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Dialogue
              </p>
              <p className="whitespace-pre-line text-lg leading-relaxed">{sec.dialogue_ko}</p>
              {sec.dialogue_translated && (
                <p className="whitespace-pre-line text-sm text-text-muted italic border-t border-dashed border-border pt-3">
                  {sec.dialogue_translated}
                </p>
              )}
            </div>
          )}

          {sec.vocab.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Vocabulaire
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {sec.vocab.map((w) => (
                  <li
                    key={`${sec.id}-${w.hangeul}`}
                    className="flex items-baseline justify-between gap-3 py-1 border-b border-dashed border-border last:border-0"
                  >
                    <span className="font-semibold tabular-nums truncate">{w.hangeul}</span>
                    <span className="text-text-muted text-sm text-right truncate">
                      {w.translation ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sec.grammar_points.map((gp) => (
            <div key={gp.id} className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
              <header>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-xl font-bold tracking-tight">{gp.title_ko}</h3>
                  {gp.title_translit && (
                    <span className="text-text-muted text-sm">· {gp.title_translit}</span>
                  )}
                </div>
                {gp.summary && <p className="text-text-muted mt-1">{gp.summary}</p>}
              </header>

              {gp.explanation && (
                <p className="leading-relaxed text-[15px]">{gp.explanation}</p>
              )}

              {gp.form_notes && (
                <div className="rounded-xl bg-bg p-4 border border-border text-sm leading-relaxed whitespace-pre-line">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Forme
                  </p>
                  {gp.form_notes}
                </div>
              )}

              {gp.examples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Exemples
                  </p>
                  <ul className="space-y-3">
                    {gp.examples.map((ex) => (
                      <li key={ex.id} className="space-y-0.5">
                        <p className="whitespace-pre-line">{ex.korean}</p>
                        {ex.translation && (
                          <p className="text-text-muted text-sm italic">{ex.translation}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {gp.notes && (
                <p className="text-xs text-text-muted italic border-t border-dashed border-border pt-3">
                  {gp.notes}
                </p>
              )}
            </div>
          ))}

          {i < detail.sections.length - 1 && <hr className="border-border" />}
        </section>
      ))}
    </article>
  );
}
