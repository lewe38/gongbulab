import { getTranslations } from "next-intl/server";

import { ArrowRight } from "@/components/ui/icons";

/**
 * Plan de session en 3 étapes : Reprendre / Réviser / Garder la série.
 * Composition horizontale en desktop, stack verticale en mobile.
 */
export async function SessionSteps() {
  const t = await getTranslations("dashboard.session");
  const steps = [
    { n: 1, key: "resume" },
    { n: 2, key: "vocab" },
    { n: 3, key: "streak" },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 md:py-4">
      <ol className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        {steps.map((s, i) => (
          <li key={s.n} className="flex items-center gap-3 md:flex-1 md:justify-center">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong dark:text-accent text-xs font-semibold">
              {s.n}
            </span>
            <span className="text-sm font-medium">{t(s.key)}</span>
            {i < steps.length - 1 && (
              <ArrowRight size={16} className="hidden md:block text-text-muted ml-2" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
