"use client";

import { formatBytes, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Crown,
  Clock,
  Star,
  Magnet,
  Link2,
  ArrowDownToLine,
  Settings,
} from "lucide-react";
import type { ADUser, ADMagnet, ADHistoryLink } from "@/types/alldebrid";

interface DashboardViewProps {
  user: ADUser | null;
  magnets: ADMagnet[];
  history: ADHistoryLink[];
  loading: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof User;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-accent" />
        </div>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function DashboardView({ user, magnets, history, loading }: DashboardViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted">
        <Settings className="h-12 w-12 mb-4 opacity-30" />
        <p>API keyを設定してください</p>
      </div>
    );
  }

  const activeMagnets = magnets.filter((m) => m.statusCode < 4).length;
  const readyMagnets = magnets.filter((m) => m.statusCode === 4).length;
  const premiumUntil = user.premiumUntil
    ? new Date(user.premiumUntil * 1000).toLocaleDateString("ja-JP")
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
          <p className="text-sm text-text-muted mt-0.5">Overview of your AllDebrid account</p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">{user.username}</span>
          {user.isPremium && (
            <Badge variant="blue">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Crown}
          label="Premium Until"
          value={premiumUntil}
          sub={user.isPremium ? "Active" : "Expired"}
        />
        <StatCard
          icon={Star}
          label="Fidelity Points"
          value={user.fidelityPoints}
        />
        <StatCard
          icon={Magnet}
          label="Active Magnets"
          value={activeMagnets}
          sub={`${readyMagnets} ready`}
        />
        <StatCard
          icon={Link2}
          label="Recent Links"
          value={history.length}
          sub="Last 3 days"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-default rounded-xl">
          <div className="px-5 py-4 border-b border-border-default flex items-center gap-2">
            <Magnet className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Active Magnets</h3>
          </div>
          <div className="divide-y divide-border-default max-h-80 overflow-y-auto">
            {magnets.filter((m) => m.statusCode < 4).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-muted">No active magnets</p>
            ) : (
              magnets
                .filter((m) => m.statusCode < 4)
                .slice(0, 5)
                .map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate" title={m.filename}>{m.filename}</p>
                      <p className="text-xs text-text-muted">
                        {formatBytes(m.downloaded)} / {formatBytes(m.size)}
                      </p>
                    </div>
                    <Badge
                      variant={m.statusCode === 1 ? "blue" : "amber"}
                      pulse={m.statusCode === 1}
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-bg-card border border-border-default rounded-xl">
          <div className="px-5 py-4 border-b border-border-default flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Recent Downloads</h3>
          </div>
          <div className="divide-y divide-border-default max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-muted">No recent downloads</p>
            ) : (
              history.slice(0, 8).map((link, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate" title={link.filename}>{link.filename}</p>
                    <p className="text-xs text-text-muted">
                      {link.host} · {formatBytes(link.size)}
                    </p>
                  </div>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener"
                    className="text-accent hover:text-accent-hover"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

