import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
};

const defaultIcon = (
  <svg
    className="h-10 w-10 text-muted-foreground"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = "neutral",
  className,
}: EmptyStateProps) {
  const toneClasses =
    tone === "danger"
      ? "bg-red-50 border-red-300/60"
      : "bg-card border-border";

  return (
    <div
      className={cn(
        "rounded-2xl border p-8 text-center shadow-sm",
        toneClasses,
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted/70">
        {icon ?? defaultIcon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
