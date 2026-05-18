"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "./nav-items";

/**
 * Sidebar gauche pour desktop (md+).
 * Toujours en mode plein largeur pour l'instant (64). Plus tard on ajoutera un mode "collapsed".
 */
export function Sidebar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:border-r md:border-border md:bg-surface">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 group">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
            공
          </span>
          <span className="font-bold tracking-tight">{tCommon("appName")}</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
          return (
            <Link
              key={href}
              href={fullHref}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent-strong dark:text-accent"
                  : "text-text-muted hover:bg-accent-soft/50 hover:text-text"
              }`}
            >
              <Icon size={18} />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <p className="text-[11px] text-text-muted text-center">{tCommon("tagline")}</p>
      </div>
    </aside>
  );
}
