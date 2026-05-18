"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  // Évite un flash avant l'hydratation : on rend un placeholder de même taille
  if (isDark === null) {
    return <span className={`inline-block h-8 w-8 ${className}`} aria-hidden />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={t("toggleTheme")}
      title={isDark ? t("lightMode") : t("darkMode")}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-accent-soft hover:text-accent-strong dark:hover:text-accent transition-colors ${className}`}
    >
      {isDark ? (
        // Sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
