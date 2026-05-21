"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

import { signOutAction } from "@/lib/auth";
import { UserCircle } from "@/components/ui/icons";

export function UserMenu({ email }: { email: string | null }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!email) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-strong dark:text-accent hover:opacity-80 transition-opacity"
        title={email}
      >
        <UserCircle size={20} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg z-30"
        >
          <p className="px-3 py-2 text-xs text-text-muted border-b border-border truncate">
            {email}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent-soft hover:text-accent-strong dark:hover:text-accent transition-colors"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
