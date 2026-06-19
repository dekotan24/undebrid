const STORAGE_KEY = "ad-manager-settings";

export interface Settings {
  apiKey: string;
  agent: string;
  magnetPollInterval: number;
  downloadPath: string;
}

const defaults: Settings = {
  apiKey: "",
  agent: "undebrid/1.0",
  magnetPollInterval: 3000,
  downloadPath: "",
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("settings-changed"));
  return merged;
}
