import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignupForm } from "./SignupForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <main className="min-h-screen bg-bg text-text flex flex-col">
      <header className="px-6 py-5">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
            공
          </span>
          <span className="font-bold tracking-tight">gongbulab</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 pb-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {t("signup.title")}
            </h1>
            <p className="text-text-muted text-sm">{t("signup.subtitle")}</p>
          </div>

          <SignupForm next={next ?? `/${locale}/dashboard`} />

          <p className="text-center text-sm text-text-muted">
            {t("signup.haveAccount")}{" "}
            <Link
              href={`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-accent-strong dark:text-accent font-semibold hover:underline"
            >
              {t("signup.login")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
