"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "./nav-items";

/**
 * Bottom navigation pour mobile (<md). Liquid-glass via backdrop-blur.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border bg-surface/75 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
          return (
            <li key={href}>
              <Link
                href={fullHref}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-accent-strong dark:text-accent"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <Icon size={20} />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
