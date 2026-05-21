"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signInAction, type AuthState } from "@/lib/auth";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState | null, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("fields.email")}
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("fields.password")}
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      {state && state.ok === false && (
        <p className="text-srs-again text-xs">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-fg px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? t("submitting") : t("login.cta")}
      </button>
    </form>
  );
}
