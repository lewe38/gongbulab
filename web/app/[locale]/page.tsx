import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BookOpenText, Cards, ChatCircleDots, Sprout } from "@/components/ui/icons";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // Si déjà connecté → direct au dashboard, on saute la landing
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/${locale}/dashboard`);

  return (
    <main className="min-h-screen bg-bg text-text">
      {/* Topbar publique */}
      <header className="h-14 flex items-center justify-between px-5 md:px-8 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
            공
          </span>
          <span className="font-bold tracking-tight">{t("common.appName")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/lessons`}
            className="hidden sm:inline-block rounded-full px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            {t("nav.lessons")}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            {t("auth.login.cta")}
          </Link>
          <Link
            href={`/${locale}/signup`}
            className="rounded-full bg-primary text-primary-fg px-3.5 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("auth.signup.cta")}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 md:px-8 py-16 md:py-24 text-center space-y-6">
        <p className="inline-flex items-center gap-2 text-accent-strong dark:text-accent text-sm font-semibold">
          <Sprout size={16} />
          {t("common.tagline")}
        </p>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
          {t("dashboard.heroKo")}
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          {locale === "en"
            ? "Korean grammar lessons, vocabulary review with spaced repetition, and an AI tutor — all in one place."
            : "Des leçons de grammaire coréenne, du vocabulaire en révision espacée, et un tuteur IA — tout au même endroit."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href={`/${locale}/signup`}
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-fg px-6 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
          >
            {t("auth.signup.cta")}
          </Link>
          <Link
            href={`/${locale}/lessons`}
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-base font-semibold hover:bg-accent-soft transition-colors"
          >
            {locale === "en" ? "Browse lessons" : "Explorer les leçons"}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 md:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature
            Icon={BookOpenText}
            title={locale === "en" ? "Grammar lessons" : "Leçons de grammaire"}
            body={
              locale === "en"
                ? "164 sections from beginner to advanced, with Korean examples and clear explanations."
                : "164 sections du niveau débutant à avancé, avec exemples coréens et explications claires."
            }
          />
          <Feature
            Icon={Cards}
            title={locale === "en" ? "Spaced repetition" : "Révision espacée"}
            body={
              locale === "en"
                ? "Memorize 2,000+ words effectively with the FSRS algorithm used by Anki."
                : "Mémorise 2000+ mots efficacement grâce à l'algorithme FSRS d'Anki."
            }
          />
          <Feature
            Icon={ChatCircleDots}
            title={locale === "en" ? "AI tutor" : "Tuteur IA"}
            body={
              locale === "en"
                ? "Ask anything about Korean grammar to a chatbot that knows the lesson you're on."
                : "Pose tes questions sur la grammaire à un chatbot qui connaît la leçon en cours."
            }
          />
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-text-muted">
        gongbulab · 공부하다 · {new Date().getFullYear()}
      </footer>
    </main>
  );
}

function Feature({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 space-y-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong dark:text-accent">
        <Icon size={20} />
      </span>
      <h3 className="font-bold text-lg tracking-tight">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{body}</p>
    </article>
  );
}
