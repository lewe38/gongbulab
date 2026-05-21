import Link from "next/link";

import { ChevronRight } from "@/components/ui/icons";

export type ChapterCardProps = {
  href: string;
  number: number;
  title_ko: string;
  intent: string | null;
  sections_count: number;
  grammar_count: number;
  status: "todo" | "in_progress" | "done";
  progress_pct?: number; // 0..100
};

const STATUS_LABELS: Record<ChapterCardProps["status"], string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export function ChapterCard({
  href,
  number,
  title_ko,
  intent,
  sections_count,
  grammar_count,
  status,
  progress_pct = 0,
}: ChapterCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 md:p-5 hover:border-accent/40 hover:bg-accent-soft/30 transition-colors"
    >
      <ChapterBadge number={number} status={status} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-lg md:text-xl font-bold tracking-tight truncate">{title_ko}</h3>
          <StatusPill status={status} />
        </div>
        {intent && (
          <p className="text-text-muted text-sm line-clamp-2">{intent}</p>
        )}
        <p className="text-text-muted text-xs tabular-nums">
          {sections_count} section{sections_count > 1 ? "s" : ""} · {grammar_count} point
          {grammar_count > 1 ? "s" : ""} de grammaire
        </p>
        {status === "in_progress" && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress_pct}%` }}
            />
          </div>
        )}
      </div>

      <ChevronRight
        size={20}
        className="text-text-muted group-hover:text-accent-strong dark:group-hover:text-accent shrink-0"
      />
    </Link>
  );
}

function ChapterBadge({
  number,
  status,
}: {
  number: number;
  status: ChapterCardProps["status"];
}) {
  // Discriminant visuel par état : turquoise plein (in-progress), graphite plein (done), outline (todo)
  const className =
    status === "in_progress"
      ? "bg-accent text-white"
      : status === "done"
        ? "bg-primary text-primary-fg"
        : "bg-bg text-text-muted border border-border";
  return (
    <div
      className={`flex h-12 w-12 md:h-14 md:w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-bold text-sm md:text-base ${className}`}
    >
      <span className="leading-none">{number}</span>
      <span className="text-[10px] font-medium opacity-75 leading-none mt-0.5">과</span>
    </div>
  );
}

function StatusPill({ status }: { status: ChapterCardProps["status"] }) {
  if (status === "todo") return null;
  const className =
    status === "in_progress"
      ? "bg-accent-soft text-accent-strong dark:text-accent"
      : "bg-border text-text-muted";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
