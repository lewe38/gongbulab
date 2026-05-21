"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { DueCard } from "@/lib/srs-state";
import { submitReviewAction, type ReviewState } from "@/lib/review-actions";

type Grade = "again" | "hard" | "good" | "easy";

const GRADE_META: Record<
  Grade,
  { label: string; hint: string; cls: string }
> = {
  again: { label: "Again", hint: "<1m", cls: "border-srs-again text-srs-again hover:bg-srs-again/10" },
  hard: { label: "Hard", hint: "6m", cls: "border-srs-hard text-srs-hard hover:bg-srs-hard/10" },
  good: { label: "Good", hint: "10m", cls: "border-srs-good text-srs-good hover:bg-srs-good/10" },
  easy: { label: "Easy", hint: "4j", cls: "border-srs-easy text-srs-easy hover:bg-srs-easy/10" },
};

export function ReviewSession({ cards, locale }: { cards: DueCard[]; locale: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (idx >= cards.length) {
    return (
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-4xl">🎉</p>
          <h1 className="text-2xl font-bold tracking-tight">Session terminée</h1>
          <p className="text-text-muted">Tu as révisé {cards.length} cartes. À demain.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={`/${locale}/vocab`}
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-fg px-5 py-3 text-sm font-semibold"
            >
              Retour
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const card = cards[idx];

  const grade = (g: Grade) => {
    if (pending) return;
    setError(null);
    const elapsed = Date.now() - shownAt;
    const fd = new FormData();
    fd.set("card_id", String(card.card_id));
    fd.set("rating", g);
    fd.set("time_taken_ms", String(elapsed));

    startTransition(async () => {
      const result: ReviewState = await submitReviewAction(null, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIdx((i) => i + 1);
      setFlipped(false);
      setShownAt(Date.now());
    });
  };

  return (
    <main className="flex-1 flex flex-col px-4 md:px-6 py-6 md:py-10">
      {/* progress */}
      <div className="max-w-md w-full mx-auto space-y-1 mb-8">
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${(idx / cards.length) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-text-muted text-right tabular-nums">
          {idx} / {cards.length}
        </p>
      </div>

      {/* card */}
      <div className="flex-1 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-10 md:p-14 text-center min-h-[260px] flex flex-col items-center justify-center gap-3 hover:bg-accent-soft/20 transition-colors"
          aria-label={flipped ? "Cacher" : "Révéler"}
        >
          <p className="text-5xl md:text-6xl font-bold tracking-tight">{card.hangeul}</p>
          {card.romanization && (
            <p className="text-text-muted text-sm">{card.romanization}</p>
          )}
          {flipped ? (
            <>
              <hr className="my-3 w-12 border-dashed border-border" />
              <p className="text-xl md:text-2xl font-medium">{card.translation ?? "—"}</p>
              {card.part_of_speech && (
                <p className="text-text-muted text-xs italic">{card.part_of_speech}</p>
              )}
            </>
          ) : (
            <p className="text-text-muted text-xs mt-2">Clique pour révéler</p>
          )}
        </button>
      </div>

      {/* grade buttons */}
      <div className="max-w-md w-full mx-auto mt-6">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(GRADE_META) as Grade[]).map((g) => (
              <button
                key={g}
                onClick={() => grade(g)}
                disabled={pending}
                className={`rounded-xl border-[1.5px] px-2 py-3 font-semibold text-sm transition-colors disabled:opacity-50 ${GRADE_META[g].cls}`}
              >
                {GRADE_META[g].label}
                <span className="block text-[10px] font-medium opacity-75 mt-0.5">
                  {GRADE_META[g].hint}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full rounded-xl bg-primary text-primary-fg px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Révéler la réponse
          </button>
        )}
        {error && <p className="text-srs-again text-xs text-center mt-3">{error}</p>}
      </div>
    </main>
  );
}
