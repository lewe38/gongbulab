import { getTranslations } from "next-intl/server";

import { Check, Cross, Flame } from "@/components/ui/icons";

export type StreakDay = {
  date: string; // ISO YYYY-MM-DD
  status: "lesson" | "vocab" | "miss";
};

export async function StreakGrid({
  days,
  streak,
}: {
  days: StreakDay[]; // ordre chronologique, du plus ancien au plus récent
  streak: number;
}) {
  const t = await getTranslations("dashboard.streak");

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6 space-y-4">
      <header className="flex items-center gap-2 text-text-muted">
        <Flame size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{t("title")}</span>
      </header>

      <p className="font-semibold">
        <span className="text-2xl md:text-3xl tabular-nums mr-1">{streak}</span>
        {t("daysInARow", { count: streak })}
      </p>

      <ul className="grid grid-flow-col auto-cols-fr gap-3 md:gap-4 overflow-x-auto">
        {days.map((d) => {
          const passed = d.status !== "miss";
          return (
            <li key={d.date} className="flex flex-col items-center gap-1 min-w-[36px]">
              <span className="text-[10px] text-text-muted tabular-nums">{fmt(d.date)}</span>
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                  passed
                    ? "bg-accent-soft text-accent-strong dark:text-accent"
                    : "bg-bg text-text-muted border border-border"
                }`}
              >
                {passed ? <Check size={14} /> : <Cross size={14} />}
              </span>
              <span className="text-[10px] text-text-muted">
                {d.status === "lesson"
                  ? t("labelLesson")
                  : d.status === "vocab"
                    ? t("labelVocab")
                    : t("labelMiss")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
