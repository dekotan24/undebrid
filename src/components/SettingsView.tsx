"use client";

import { useState, useEffect } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";
import { Key, Save, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";

interface SettingsViewProps {
  onSave: () => void;
}

export function SettingsView({ onSave }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [pollInterval, setPollInterval] = useState(3000);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const s = loadSettings();
    setApiKey(s.apiKey);
    setPollInterval(s.magnetPollInterval);
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast("error", "API key is required");
      return;
    }

    setSaving(true);
    try {
      await fetch("/api/ad/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      saveSettings({ apiKey: apiKey.trim(), magnetPollInterval: pollInterval });
      toast("success", "Settings saved");
      onSave();
    } catch {
      toast("error", "Failed to save settings");
    }
    setSaving(false);
  };

  const handleClear = async () => {
    await fetch("/api/ad/settings", { method: "DELETE" });
    saveSettings({ apiKey: "" });
    setApiKey("");
    toast("info", "API key cleared");
    onSave();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted mt-0.5">Configure your AllDebrid connection</p>
      </div>

      <div className="bg-bg-card border border-border-default rounded-xl divide-y divide-border-default">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">API Key</h3>
          </div>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AllDebrid API key"
              className="w-full bg-bg-input border border-border-default rounded-lg px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Get your API key from{" "}
            <a
              href="https://alldebrid.com/apikeys/"
              target="_blank"
              rel="noopener"
              className="text-accent hover:underline"
            >
              alldebrid.com/apikeys
            </a>
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Polling Interval</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-sm text-text-secondary tabular-nums w-16 text-right">
              {(pollInterval / 1000).toFixed(1)}s
            </span>
          </div>
          <p className="text-xs text-text-muted mt-2">
            How often to check magnet download progress
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-glow"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-error border border-border-default hover:border-red-500/30 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear Key
        </button>
      </div>
    </div>
  );
}
