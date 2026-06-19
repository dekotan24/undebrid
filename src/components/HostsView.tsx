"use client";

import { useState, useEffect, useMemo } from "react";
import { api, ADError } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Gauge,
  HardDrive,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ADHost } from "@/types/alldebrid";

function QuotaBar({ host }: { host: ADHost }) {
  if (host.quota == null || host.quotaMax == null || host.quotaMax === 0)
    return null;

  const used = host.quotaMax - host.quota;
  const pct = Math.min((used / host.quotaMax) * 100, 100);
  const isTraffic = host.quotaType === "traffic";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-text-muted mb-1">
        <span className="flex items-center gap-1">
          {isTraffic ? (
            <HardDrive className="h-3 w-3" />
          ) : (
            <Hash className="h-3 w-3" />
          )}
          {isTraffic
            ? `${formatBytes(used * 1024 * 1024)} / ${formatBytes(host.quotaMax * 1024 * 1024)}`
            : `${used} / ${host.quotaMax} links`}
        </span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-bg-input rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 90 ? "bg-error" : pct > 70 ? "bg-warning" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function HostsView() {
  const [hosts, setHosts] = useState<Record<string, ADHost>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "limited" | "offline">("all");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getHosts();
        setHosts(data);
      } catch (e) {
        if (e instanceof ADError) toast("error", e.message);
      }
      setLoading(false);
    })();
  }, [toast]);

  const hostList = useMemo(() => {
    return Object.values(hosts).sort((a, b) => {
      if (a.status !== b.status) return a.status ? -1 : 1;
      const aHasQuota = a.quota != null && a.quotaMax != null && a.quotaMax > 0;
      const bHasQuota = b.quota != null && b.quotaMax != null && b.quotaMax > 0;
      if (aHasQuota !== bHasQuota) return aHasQuota ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [hosts]);

  const filtered = useMemo(() => {
    return hostList.filter((h) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = h.name.toLowerCase().includes(q);
        const matchDomain = h.domains?.some((d) => d.toLowerCase().includes(q));
        if (!matchName && !matchDomain) return false;
      }
      if (filter === "online") return h.status;
      if (filter === "offline") return !h.status;
      if (filter === "limited")
        return h.quota != null && h.quotaMax != null && h.quotaMax > 0;
      return true;
    });
  }, [hostList, search, filter]);

  const counts = useMemo(
    () => ({
      all: hostList.length,
      online: hostList.filter((h) => h.status).length,
      limited: hostList.filter(
        (h) => h.quota != null && h.quotaMax != null && h.quotaMax > 0,
      ).length,
      offline: hostList.filter((h) => !h.status).length,
    }),
    [hostList],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Hosters</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Supported providers and usage quotas
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hosters..."
            className="w-full bg-bg-input border border-border-default rounded-lg pl-9 pr-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "online", "limited", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-text-muted hover:text-text-secondary border border-transparent"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "online"
                  ? "Online"
                  : f === "limited"
                    ? "Quota"
                    : "Offline"}
              <span className="ml-1.5 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Gauge className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">No hosters found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((host) => {
            const hasQuota =
              host.quota != null && host.quotaMax != null && host.quotaMax > 0;

            return (
              <div
                key={host.name}
                className={`bg-bg-card border rounded-xl p-4 transition-colors ${
                  host.status
                    ? "border-border-default hover:border-accent/20"
                    : "border-border-default/50 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium text-text-primary truncate"
                      title={host.name}
                    >
                      {host.name}
                    </p>
                    {host.domains && host.domains.length > 0 && (
                      <p
                        className="text-xs text-text-muted truncate mt-0.5"
                        title={host.domains.join(", ")}
                      >
                        {host.domains[0]}
                        {host.domains.length > 1 && ` +${host.domains.length - 1}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {host.status ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge variant={host.status ? "green" : "red"}>
                    {host.status ? "Online" : "Offline"}
                  </Badge>
                  {host.type === "free" && <Badge variant="gray">Free</Badge>}
                  {host.limitSimuDl != null && host.limitSimuDl > 0 && (
                    <Badge variant="gray">{host.limitSimuDl} simultaneous</Badge>
                  )}
                </div>

                {hasQuota && <QuotaBar host={host} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
