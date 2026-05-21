"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";

/**
 * Topbar minimale.
 * - Mobile (<md) : logo à gauche, theme toggle + user menu à droite
 * - Desktop (md+) : logo masqué (sidebar a déjà le logo), toggle + menu à droite
 */
export function Topbar({ userEmail }: { userEmail: string | null }) {
  const tCommon = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-10">
      <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 md:invisible">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
          공
        </span>
        <span className="font-bold tracking-tight">{tCommon("appName")}</span>
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
