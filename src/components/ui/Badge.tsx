"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "blue" | "green" | "red" | "amber" | "gray";
  children: React.ReactNode;
  pulse?: boolean;
}

const variants = {
  blue: "bg-accent/15 text-blue-400 border-blue-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  gray: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function Badge({ variant, children, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              variant === "blue" && "bg-blue-400",
              variant === "green" && "bg-emerald-400",
              variant === "red" && "bg-red-400",
              variant === "amber" && "bg-amber-400",
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              variant === "blue" && "bg-blue-400",
              variant === "green" && "bg-emerald-400",
              variant === "red" && "bg-red-400",
              variant === "amber" && "bg-amber-400",
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
