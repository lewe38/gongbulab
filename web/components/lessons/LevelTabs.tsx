"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Sprout } from "@/components/ui/icons";

/**
 * Onglets pour filtrer la liste des leçons par niveau (1-4).
 * Utilise un search param `?level=N` pour rester en page statique côté serveur.
 */
export function LevelTabs({ activeLevel }: { activeLevel: number }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale;
  const levels = [1, 2, 3, 4] as const;

  const buildHref = (lvl: number) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("level", String(lvl));
    return `/${locale}/lessons?${sp.toString()}`;
  };

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      {levels.map((l) => {
        const active = l === activeLevel;
        return (
          <Link
            key={l}
            href={buildHref(l)}
            className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-primary text-primary-fg"
                : "bg-surface text-text-muted border border-border hover:text-text"
            }`}
          >
            {active && <Sprout size={14} className="-mt-0.5" />}
            <span>{t("level", { n: l })}</span>
            <span className="opacity-60 text-xs">
              · {t(`levelLabels.${l}` as `levelLabels.${1 | 2 | 3 | 4}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
