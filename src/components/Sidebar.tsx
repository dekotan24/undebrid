"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Link2,
  Magnet,
  Globe,
  Settings,
  Zap,
} from "lucide-react";

export type Tab = "dashboard" | "links" | "magnets" | "hosters" | "settings";

interface SidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  premium?: boolean;
}

const items: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "links", label: "Links", icon: Link2 },
  { id: "magnets", label: "Magnets", icon: Magnet },
  { id: "hosters", label: "Hosters", icon: Globe },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onChange, premium }: SidebarProps) {
  return (
    <aside className="w-60 h-screen bg-bg-secondary border-r border-border-default flex flex-col shrink-0">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary tracking-tight">Undebrid</h1>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">AllDebrid</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", isActive ? "text-accent" : "text-text-muted")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border-default">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              premium ? "bg-success" : "bg-text-muted",
            )}
          />
          <span className="text-xs text-text-muted">
            {premium ? "Premium Active" : "Free Account"}
          </span>
        </div>
      </div>
    </aside>
  );
}
