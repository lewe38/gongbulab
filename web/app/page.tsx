"use client";

import { useEffect, useState } from "react";

/**
 * Page de smoke-test du design system.
 * À supprimer dès qu'on a un vrai dashboard. Sert juste à valider :
 *   - Pretendard chargé
 *   - Utilities tokens (bg-bg, text-text, bg-primary, bg-accent, bg-srs-*) fonctionnelles
 *   - Toggle dark mode propre (avec persistance localStorage)
 *   - Affichage correct du Hangul
 */
export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">gongbulab</h1>
            <p className="text-text-muted text-sm mt-1">
              smoke-test design system · 공부 + lab
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-accent-soft transition-colors"
          >
            {theme === "dark" ? "☀ light" : "☾ dark"}
          </button>
        </header>

        <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Carte SRS
          </h2>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-4xl font-semibold">학교</p>
            <p className="text-text-muted text-sm mt-1">hakgyo</p>
            <p className="mt-4 pt-4 border-t border-dashed border-border">école</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button className="rounded-xl border-[1.5px] border-srs-again text-srs-again hover:bg-srs-again/10 px-2 py-3 font-semibold text-sm transition-colors">
              Again
              <span className="block text-[10px] font-medium opacity-75 mt-0.5">&lt;1m</span>
            </button>
            <button className="rounded-xl border-[1.5px] border-srs-hard text-srs-hard hover:bg-srs-hard/10 px-2 py-3 font-semibold text-sm transition-colors">
              Hard
              <span className="block text-[10px] font-medium opacity-75 mt-0.5">6m</span>
            </button>
            <button className="rounded-xl border-[1.5px] border-srs-good text-srs-good hover:bg-srs-good/10 px-2 py-3 font-semibold text-sm transition-colors">
              Good
              <span className="block text-[10px] font-medium opacity-75 mt-0.5">10m</span>
            </button>
            <button className="rounded-xl border-[1.5px] border-srs-easy text-srs-easy hover:bg-srs-easy/10 px-2 py-3 font-semibold text-sm transition-colors">
              Easy
              <span className="block text-[10px] font-medium opacity-75 mt-0.5">4j</span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Composants
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <button className="rounded-xl bg-primary text-primary-fg px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity">
              Continuer
            </button>
            <button className="rounded-xl bg-accent text-white px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity">
              Action accent
            </button>
            <button className="rounded-xl border border-border px-5 py-2.5 font-semibold text-sm hover:bg-accent-soft transition-colors">
              Plus tard
            </button>
            <span className="rounded-full bg-accent-soft text-accent-strong px-3 py-1 text-xs font-semibold">
              Niveau 1
            </span>
            <a className="text-accent-strong dark:text-accent font-semibold text-sm" href="#">
              leçon suivante →
            </a>
          </div>
        </section>

        <p className="text-text-muted text-xs text-center">
          Si tu vois cette page propre (Pretendard chargé, couleurs cohérentes, dark mode qui
          bascule, Hangul net) → design system OK ✓
        </p>
      </div>
    </main>
  );
}
