"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signUpAction, type AuthState } from "@/lib/auth";

export function SignupForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState | null, FormData>(
    signUpAction,
    null,
  );

  if (state && state.ok) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent-soft p-5 text-sm text-accent-strong dark:text-accent text-center space-y-2">
        <p className="font-semibold">{t("signup.successTitle")}</p>
        <p>{t("signup.successBody")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("fields.displayName")}
        </span>
        <input
          type="text"
          name="display_name"
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

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
          autoComplete="new-password"
          minLength={8}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <span className="text-[11px] text-text-muted mt-1 block">{t("fields.passwordHint")}</span>
      </label>

      {state && state.ok === false && (
        <p className="text-srs-again text-xs">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-fg px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? t("submitting") : t("signup.cta")}
      </button>
    </form>
  );
}
