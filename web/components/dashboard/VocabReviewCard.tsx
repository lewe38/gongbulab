import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Cards } from "@/components/ui/icons";

export type VocabPreview = { hangeul: string; translation: string };

export async function VocabReviewCard({
  cards_count,
  locked,
  preview,
}: {
  cards_count: number;
  locked: boolean;
  preview: VocabPreview[];
}) {
  const t = await getTranslations("dashboard.vocabReview");
  const locale = await getLocale();

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
      <header className="flex items-center gap-2 text-text-muted">
        <Cards size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{t("title")}</span>
      </header>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold">{t("cardsCount", { count: cards_count })}</p>
          {locked && <p className="text-text-muted text-sm">{t("lockedNote")}</p>}
        </div>
        <div className="hidden md:flex items-stretch gap-2 shrink-0">
          {preview.slice(0, 3).map((p) => (
            <div
              key={p.hangeul}
              className="min-w-[64px] rounded-xl border border-border bg-bg/50 px-3 py-2 text-center"
            >
              <p className="font-semibold text-sm">{p.hangeul}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{p.translation}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={locked ? "#" : `/${locale}/vocab`}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors border ${
          locked
            ? "border-border text-text-muted cursor-not-allowed"
            : "border-accent text-accent-strong dark:text-accent hover:bg-accent-soft"
        }`}
        aria-disabled={locked}
      >
        <Cards size={14} />
        {t("openCta")}
      </Link>
    </div>
  );
}
