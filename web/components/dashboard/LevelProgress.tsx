"use client";

import { useTranslations } from "next-intl";

import { Sprout } from "@/components/ui/icons";

export function LevelProgress({
  current,
  variant = "default",
}: {
  current: 1 | 2 | 3 | 4;
  variant?: "default" | "compact";
}) {
  const t = useTranslations("dashboard");
  const levels = [1, 2, 3, 4] as const;
  const dotSize = variant === "compact" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  const sproutSize = variant === "compact" ? 14 : 18;

  return (
    <div className={variant === "compact" ? "space-y-2" : "flex items-center gap-4"}>
      {variant === "default" && (
        <div className="flex flex-col items-end leading-tight">
          <p className="text-accent-strong dark:text-accent text-sm font-semibold">
            {t("level", { n: current })}
          </p>
          <p className="text-text-muted text-xs">
            {t(`levelLabels.${current}` as `levelLabels.${1 | 2 | 3 | 4}`)}
          </p>
        </div>
      )}
      {variant === "compact" && (
        <div className="leading-tight">
          <p className="text-sm font-semibold">{t("level", { n: current })}</p>
          <p className="text-text-muted text-xs">
            {t(`levelLabels.${current}` as `levelLabels.${1 | 2 | 3 | 4}`)}
          </p>
        </div>
      )}
      <div className="flex items-center">
        {levels.map((l, i) => {
          const isCurrent = l === current;
          const isPast = l < current;
          return (
            <div key={l} className="flex items-center">
              <div className="relative flex flex-col items-center">
                {isCurrent && (
                  <Sprout
                    size={sproutSize}
                    className="absolute -top-4 text-accent-strong dark:text-accent"
                  />
                )}
                <span
                  className={`inline-flex ${dotSize} items-center justify-center rounded-full font-semibold ${
                    isCurrent
                      ? "bg-accent text-white"
                      : isPast
                        ? "bg-accent-soft text-accent-strong"
                        : "bg-border text-text-muted"
                  }`}
                >
                  {l}
                </span>
              </div>
              {i < levels.length - 1 && (
                <span
                  className={`mx-1 h-px w-6 ${l < current ? "bg-accent/60" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
