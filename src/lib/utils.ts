export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 1 ? 2 : 0)} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return `${(bytesPerSec / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatETA(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function magnetStatusLabel(code: number): string {
  const labels: Record<number, string> = {
    0: "In Queue",
    1: "Downloading",
    2: "Compressing",
    3: "Uploading",
    4: "Ready",
    5: "Upload Failed",
    6: "Error",
    7: "Virus Detected",
    8: "Dead",
    9: "Fetching Metadata",
    10: "Stalled",
    11: "Stalled",
    12: "No Space",
  };
  return labels[code] ?? `Unknown (${code})`;
}

export function magnetStatusColor(code: number): string {
  if (code === 4) return "text-success";
  if (code >= 5) return "text-error";
  if (code === 1 || code === 3) return "text-accent";
  if (code === 0 || code === 2 || code === 9) return "text-warning";
  return "text-text-muted";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
