"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { LinksView } from "@/components/LinksView";
import { MagnetsView } from "@/components/MagnetsView";
import { HostsView } from "@/components/HostsView";
import { SettingsView } from "@/components/SettingsView";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { loadSettings } from "@/lib/settings";
import { api, ADError } from "@/lib/api";
import type { ADUser, ADMagnet, ADHistoryLink } from "@/types/alldebrid";

function AppContent() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [user, setUser] = useState<ADUser | null>(null);
  const [magnets, setMagnets] = useState<ADMagnet[]>([]);
  const [history, setHistory] = useState<ADHistoryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    const settings = loadSettings();
    if (!settings.apiKey) {
      setHasKey(false);
      setLoading(false);
      return;
    }
    setHasKey(true);
    try {
      const [userData, magnetData] = await Promise.all([
        api.getUser(),
        api.getMagnetStatus(),
      ]);
      setUser(userData);
      setMagnets(magnetData.magnets || []);

      try {
        const historyData = await api.getHistory();
        setHistory(historyData.links || []);
      } catch {
        // History might not be enabled
      }
    } catch (e) {
      if (e instanceof ADError && e.code !== "NO_API_KEY") {
        toast("error", `API Error: ${e.message}`);
      }
    }
    setLoading(false);
  }, [toast]);

  const fetchMagnets = useCallback(async () => {
    if (!hasKey) return;
    try {
      const data = await api.getMagnetStatus();
      setMagnets(data.magnets || []);
    } catch {
      // silent fail for polling
    }
  }, [hasKey]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const settings = loadSettings();
    const interval = settings.magnetPollInterval || 3000;

    if (hasKey) {
      pollRef.current = setInterval(fetchMagnets, interval);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasKey, fetchMagnets]);

  useEffect(() => {
    const handler = () => fetchUserData();
    window.addEventListener("settings-changed", handler);
    return () => window.removeEventListener("settings-changed", handler);
  }, [fetchUserData]);

  const handleSettingsSave = () => {
    fetchUserData();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={tab} onChange={setTab} premium={user?.isPremium} />
      <main className="flex-1 overflow-y-auto p-8">
        {!hasKey && tab !== "settings" ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-bg-card border border-border-default rounded-2xl p-10 text-center max-w-md">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-8 w-8 text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Welcome to Undebrid</h2>
              <p className="text-sm text-text-muted mb-6">
                Enter your AllDebrid API key to get started
              </p>
              <button
                onClick={() => setTab("settings")}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-glow"
              >
                Go to Settings
              </button>
            </div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <DashboardView
                user={user}
                magnets={magnets}
                history={history}
                loading={loading}
              />
            )}
            {tab === "links" && <LinksView />}
            {tab === "magnets" && (
              <MagnetsView
                magnets={magnets}
                loading={loading}
                onRefresh={fetchMagnets}
              />
            )}
            {tab === "hosters" && <HostsView />}
            {tab === "settings" && <SettingsView onSave={handleSettingsSave} />}
          </>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
