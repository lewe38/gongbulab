import { getTranslations, setRequestLocale } from "next-intl/server";

import { signOutAction } from "@/lib/auth";
import { getCurrentUserState } from "@/lib/user-state";

import { ProfileForm } from "./ProfileForm";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const state = await getCurrentUserState();
  if (!state) return null; // proxy redirige

  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8 py-6 md:py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-accent-strong dark:text-accent text-sm font-semibold flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {t("nav.profile")}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {state.display_name ?? state.email?.split("@")[0] ?? "Utilisateur"}
        </h1>
        <p className="text-text-muted text-sm flex items-center gap-2 flex-wrap">
          <span>{state.email}</span>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              state.plan === "premium"
                ? "bg-accent text-white"
                : "bg-accent-soft text-accent-strong dark:text-accent"
            }`}
          >
            {state.plan === "premium" ? "Premium" : "Gratuit"}
          </span>
        </p>
      </header>

      <ProfileForm
        initial={{
          display_name: state.display_name,
          interface_lang: state.current_level ? (locale as "fr" | "en") : "fr",
          current_level: state.current_level,
        }}
      />

      <section className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Compte
        </h2>
        <p className="text-sm">
          Connecté depuis le {new Date(state.created_at).toLocaleDateString(locale)}.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-xl border border-srs-again text-srs-again px-4 py-2 text-sm font-semibold hover:bg-srs-again/10 transition-colors"
          >
            {t("nav.signOut")}
          </button>
        </form>
      </section>
    </div>
  );
}
