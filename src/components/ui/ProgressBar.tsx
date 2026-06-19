"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  active?: boolean;
  size?: "sm" | "md";
  color?: "blue" | "green" | "red" | "amber";
}

const colorMap = {
  blue: "bg-accent",
  green: "bg-success",
  red: "bg-error",
  amber: "bg-warning",
};

export function ProgressBar({
  value,
  max = 100,
  active,
  size = "md",
  color = "blue",
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      className={cn(
        "w-full rounded-full bg-bg-input overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5",
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          colorMap[color],
          active && "progress-active",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
