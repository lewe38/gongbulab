import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BookOpenText, Cards, Sparkle } from "@/components/ui/icons";
import { getSrsOverview } from "@/lib/srs-state";
import type { Locale } from "@/lib/lessons";

type Props = { params: Promise<{ locale: string }> };

export default async function VocabPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const o = await getSrsOverview(locale as Locale);
  if (!o) return null; // proxy redirige vers /login

  if (o.total === 0) return <EmptyState locale={locale} />;

  return (
    <div className="mx-auto max-w-3xl px-5 md:px-8 py-6 md:py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-accent-strong dark:text-accent text-sm font-semibold flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {t("nav.vocab")}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {o.due_now > 0
            ? `${o.due_now} carte${o.due_now > 1 ? "s" : ""} à réviser`
            : "Rien à réviser maintenant"}
        </h1>
        <p className="text-text-muted">
          {o.total} carte{o.total > 1 ? "s" : ""} dans tes révisions au total.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Nouvelles" value={o.by_state.new} />
        <Stat label="En apprentissage" value={o.by_state.learning + o.by_state.relearning} />
        <Stat label="En révision" value={o.by_state.review} />
        <Stat label="À faire aujourd'hui" value={o.due_now} highlight />
      </section>

      {o.due_now > 0 ? (
        <Link
          href={`/${locale}/vocab/review`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-fg px-6 py-4 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          <Cards size={18} />
          Commencer la session
        </Link>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center space-y-3">
          <p className="font-semibold">Tu es à jour 🎉</p>
          <p className="text-text-muted text-sm">
            Reviens demain ou ajoute du vocabulaire depuis une leçon.
          </p>
          <Link
            href={`/${locale}/lessons`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent-soft transition-colors"
          >
            <BookOpenText size={14} />
            Voir les leçons
          </Link>
        </div>
      )}

      {o.recently_added.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Récemment ajouté
          </h2>
          <ul className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {o.recently_added.map((c) => (
              <li
                key={c.card_id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold tabular-nums truncate">{c.hangeul}</p>
                  <p className="text-text-muted text-xs truncate">{c.translation ?? "—"}</p>
                </div>
                <StatePill state={c.state} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-accent bg-accent-soft text-accent-strong dark:text-accent"
          : "border-border bg-surface"
      }`}
    >
      <p className="text-2xl md:text-3xl font-extrabold tabular-nums">{value}</p>
      <p className={`text-xs mt-1 ${highlight ? "" : "text-text-muted"}`}>{label}</p>
    </div>
  );
}

function StatePill({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Nouveau", cls: "bg-accent-soft text-accent-strong dark:text-accent" },
    learning: { label: "Apprentissage", cls: "bg-srs-hard/15 text-srs-hard" },
    review: { label: "Révision", cls: "bg-srs-good/15 text-srs-good" },
    relearning: { label: "Réappr.", cls: "bg-srs-again/15 text-srs-again" },
  };
  const { label, cls } = map[state] ?? { label: state, cls: "bg-border text-text-muted" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8 py-12 md:py-20">
      <div className="rounded-3xl border border-border bg-surface p-8 md:p-12 text-center space-y-6">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong dark:text-accent">
          <Sparkle size={28} />
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pas encore de cartes</h2>
          <p className="text-text-muted max-w-md mx-auto">
            Ouvre une leçon, puis clique "Ajouter aux révisions" sur la section de
            vocabulaire pour démarrer ton apprentissage espacé.
          </p>
        </div>
        <Link
          href={`/${locale}/lessons?level=1`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <BookOpenText size={16} />
          Choisir une leçon
        </Link>
      </div>
    </div>
  );
}
