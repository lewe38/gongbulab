import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ReviewSession } from "./ReviewSession";
import { getDueCardsForReview } from "@/lib/srs-state";
import type { Locale } from "@/lib/lessons";

type Props = { params: Promise<{ locale: string }> };

export default async function VocabReviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations(); // trigger setRequestLocale

  const cards = await getDueCardsForReview(locale as Locale, 50);
  if (cards.length === 0) {
    redirect(`/${locale}/vocab`);
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 md:px-6 border-b border-border">
        <Link
          href={`/${locale}/vocab`}
          className="text-sm text-text-muted hover:text-text"
        >
          ← Quitter
        </Link>
      </header>
      <ReviewSession cards={cards} locale={locale} />
    </div>
  );
}
