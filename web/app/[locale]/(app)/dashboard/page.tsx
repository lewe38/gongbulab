import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LevelProgress } from "@/components/dashboard/LevelProgress";
import { SessionSteps } from "@/components/dashboard/SessionSteps";
import { Sparkle, BookOpenText, Cards } from "@/components/ui/icons";
import { getCurrentUserState } from "@/lib/user-state";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const state = await getCurrentUserState();
  // Le proxy garantit que cette route est auth-required, mais TS l'ignore.
  if (!state) {
    return null;
  }

  const isBrandNew = state.total_cards_count === 0 && state.streak_days === 0;
  const hello = state.display_name
    ? state.display_name.split(" ")[0]
    : state.email?.split("@")[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* Hero */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-accent-strong dark:text-accent text-sm font-semibold flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            {t("sessionToday")}
            {hello && <span className="text-text-muted">· {hello}</span>}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {t("heroKo")}
          </h1>
        </div>
        <LevelProgress current={state.current_level} />
      </header>

      {isBrandNew ? (
        <WelcomeNewUser locale={locale} />
      ) : (
        <ReturningUserContent locale={locale} state={state} />
      )}
    </div>
  );
}

function WelcomeNewUser({ locale }: { locale: string }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-8 md:p-12 text-center space-y-6">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong dark:text-accent">
        <Sparkle size={28} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Bienvenue 👋</h2>
        <p className="text-text-muted max-w-md mx-auto">
          On commence par une leçon. Tu pourras ensuite ajouter du vocabulaire à tes
          révisions et garder ta série jour après jour.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/${locale}/lessons?level=1`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <BookOpenText size={16} />
          Commencer le niveau 1
        </Link>
        <Link
          href={`/${locale}/lessons`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-accent-soft transition-colors"
        >
          Voir tout le programme
        </Link>
      </div>
    </section>
  );
}

function ReturningUserContent({
  locale,
  state,
}: {
  locale: string;
  state: NonNullable<Awaited<ReturnType<typeof getCurrentUserState>>>;
}) {
  return (
    <>
      <SessionSteps />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SrsTodayCard
          locale={locale}
          due={state.due_cards_count}
          total={state.total_cards_count}
          reviewsToday={state.reviews_today}
        />
        <KeepLearningCard locale={locale} level={state.current_level} />
      </section>

      <StreakSummary streak={state.streak_days} />
    </>
  );
}

function SrsTodayCard({
  locale,
  due,
  total,
  reviewsToday,
}: {
  locale: string;
  due: number;
  total: number;
  reviewsToday: number;
}) {
  const noneDue = due === 0;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
      <header className="flex items-center gap-2 text-text-muted">
        <Cards size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Révision SRS du jour
        </span>
      </header>
      <div className="space-y-1">
        <p className="font-semibold text-lg">
          {noneDue
            ? "Rien à réviser aujourd'hui"
            : `${due} carte${due > 1 ? "s" : ""} à revoir`}
        </p>
        <p className="text-text-muted text-sm">
          {total === 0
            ? "Tu n'as encore ajouté aucune carte à tes révisions."
            : `${total} carte${total > 1 ? "s" : ""} suivie${total > 1 ? "s" : ""} au total · ${reviewsToday} aujourd'hui`}
        </p>
      </div>
      <Link
        href={`/${locale}/vocab`}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors border ${
          noneDue
            ? "border-border text-text-muted"
            : "border-accent text-accent-strong dark:text-accent hover:bg-accent-soft"
        }`}
      >
        <Cards size={14} />
        {noneDue ? "Voir mes cartes" : "Commencer la révision"}
      </Link>
    </div>
  );
}

function KeepLearningCard({ locale, level }: { locale: string; level: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
      <header className="flex items-center gap-2 text-text-muted">
        <BookOpenText size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">Continuer</span>
      </header>
      <div className="space-y-1">
        <p className="font-semibold text-lg">Reprends une leçon du niveau {level}</p>
        <p className="text-text-muted text-sm">
          Explore ou continue tes chapitres en cours.
        </p>
      </div>
      <Link
        href={`/${locale}/lessons?level=${level}`}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg px-4 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <BookOpenText size={14} />
        Voir les leçons
      </Link>
    </div>
  );
}

function StreakSummary({ streak }: { streak: number }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6 flex items-center gap-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-strong dark:text-accent text-xl font-bold tabular-nums">
        {streak}
      </span>
      <div>
        <p className="font-semibold">
          {streak === 0
            ? "Démarre ta série aujourd'hui"
            : `${streak} jour${streak > 1 ? "s" : ""} de suite`}
        </p>
        <p className="text-text-muted text-sm">
          {streak === 0
            ? "Fais une révision aujourd'hui pour amorcer ton compte."
            : "Reviens demain pour la prolonger."}
        </p>
      </div>
    </section>
  );
}
