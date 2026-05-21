"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updateProfileAction, type ProfileState } from "@/lib/profile-actions";

type Props = {
  initial: {
    display_name: string | null;
    interface_lang: "fr" | "en";
    current_level: 1 | 2 | 3 | 4;
  };
};

export function ProfileForm({ initial }: Props) {
  const t = useTranslations("auth.fields");
  const tD = useTranslations("dashboard");
  const [state, action, pending] = useActionState<ProfileState | null, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Préférences
      </h2>

      <label className="block">
        <span className="text-sm font-medium">{t("displayName")}</span>
        <input
          type="text"
          name="display_name"
          defaultValue={initial.display_name ?? ""}
          maxLength={60}
          className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">Langue de l'interface</legend>
        <div className="mt-2 flex gap-2">
          {(["fr", "en"] as const).map((l) => (
            <label
              key={l}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-strong dark:has-[:checked]:text-accent"
            >
              <input
                type="radio"
                name="interface_lang"
                value={l}
                defaultChecked={initial.interface_lang === l}
                className="sr-only"
              />
              {l === "fr" ? "Français" : "English"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Niveau cible</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <label
              key={n}
              className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-bg py-3 text-sm cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-strong dark:has-[:checked]:text-accent"
            >
              <input
                type="radio"
                name="current_level"
                value={n}
                defaultChecked={initial.current_level === n}
                className="sr-only"
              />
              <span className="text-lg font-bold tabular-nums">{n}</span>
              <span className="text-[11px] text-text-muted">
                {tD(`levelLabels.${n as 1 | 2 | 3 | 4}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state && state.ok === false && (
        <p className="text-srs-again text-xs">{state.error}</p>
      )}
      {state && state.ok === true && (
        <p className="text-accent-strong dark:text-accent text-xs">✓ Préférences enregistrées</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary text-primary-fg px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
