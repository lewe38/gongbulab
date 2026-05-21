"use client";

import { useActionState } from "react";

import { enrollSectionVocabAction, type EnrollResult } from "@/lib/srs-actions";
import { Cards } from "@/components/ui/icons";

export function EnrollVocabButton({
  lessonId,
  vocabCount,
  isAuthenticated,
  loginHref,
}: {
  lessonId: number;
  vocabCount: number;
  isAuthenticated: boolean;
  loginHref: string;
}) {
  const [state, action, pending] = useActionState<EnrollResult | null, FormData>(
    enrollSectionVocabAction,
    null,
  );

  if (!isAuthenticated) {
    return (
      <a
        href={loginHref}
        className="inline-flex items-center gap-2 rounded-xl border border-accent text-accent-strong dark:text-accent px-3 py-2 text-xs font-semibold hover:bg-accent-soft transition-colors"
      >
        <Cards size={14} />
        Se connecter pour réviser
      </a>
    );
  }

  if (state?.ok) {
    return (
      <p className="text-xs text-accent-strong dark:text-accent">
        ✓ {state.enrolled} mot{state.enrolled > 1 ? "s" : ""} ajouté
        {state.enrolled > 1 ? "s" : ""} aux révisions
        {state.already_known > 0 && ` (${state.already_known} déjà connu${state.already_known > 1 ? "s" : ""})`}
      </p>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-accent text-accent-strong dark:text-accent px-3 py-2 text-xs font-semibold hover:bg-accent-soft disabled:opacity-50 transition-colors"
      >
        <Cards size={14} />
        {pending
          ? "Ajout…"
          : `Ajouter ${vocabCount} mot${vocabCount > 1 ? "s" : ""} aux révisions`}
      </button>
      {state && !state.ok && (
        <p className="text-srs-again text-xs mt-2">{state.error}</p>
      )}
    </form>
  );
}
