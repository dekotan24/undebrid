import JSZip from "jszip";
import type { ADMagnetFile } from "@/types/alldebrid";

interface DownloadItem {
  path: string[];
  name: string;
  link: string;
  size: number;
}

function collectAll(
  files: ADMagnetFile[],
  parentPath: string[] = [],
): DownloadItem[] {
  const items: DownloadItem[] = [];
  for (const f of files) {
    if (f.e && f.e.length > 0) {
      items.push(...collectAll(f.e, [...parentPath, f.n]));
    } else if (f.l) {
      items.push({ path: parentPath, name: f.n, link: f.l, size: f.s ?? 0 });
    }
  }
  return items;
}

export interface FolderDownloadProgress {
  total: number;
  completed: number;
  current: string;
  failed: string[];
  phase: "fetching" | "zipping" | "done";
}

export type ProgressCallback = (progress: FolderDownloadProgress) => void;

export async function downloadAsZip(
  files: ADMagnetFile[],
  rootName: string,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal,
): Promise<FolderDownloadProgress> {
  const items = collectAll(files);
  const zip = new JSZip();
  const rootFolder = zip.folder(rootName)!;

  const progress: FolderDownloadProgress = {
    total: items.length,
    completed: 0,
    current: "",
    failed: [],
    phase: "fetching",
  };

  for (const item of items) {
    if (abortSignal?.aborted) break;

    progress.current = item.name;
    onProgress({ ...progress });

    try {
      const res = await fetch(item.link, { signal: abortSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      let folder = rootFolder;
      for (const seg of item.path) {
        folder = folder.folder(seg)!;
      }
      folder.file(item.name, blob);

      progress.completed++;
    } catch (e) {
      if (abortSignal?.aborted) break;
      progress.failed.push(item.name);
      progress.completed++;
    }

    onProgress({ ...progress });
  }

  if (abortSignal?.aborted) return progress;

  progress.phase = "zipping";
  progress.current = "Creating ZIP...";
  onProgress({ ...progress });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${rootName}.zip`;
  a.click();
  URL.revokeObjectURL(url);

  progress.phase = "done";
  onProgress({ ...progress });

  return progress;
}

export async function downloadToFolder(
  files: ADMagnetFile[],
  rootName: string,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal,
): Promise<FolderDownloadProgress> {
  const dirHandle = await (
    window as unknown as {
      showDirectoryPicker: (opts?: object) => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker({ mode: "readwrite" });

  const rootDir = await dirHandle.getDirectoryHandle(rootName, { create: true });
  const items = collectAll(files);
  const progress: FolderDownloadProgress = {
    total: items.length,
    completed: 0,
    current: "",
    failed: [],
    phase: "fetching",
  };

  for (const item of items) {
    if (abortSignal?.aborted) break;

    progress.current = item.name;
    onProgress({ ...progress });

    try {
      let dir = rootDir;
      for (const seg of item.path) {
        dir = await dir.getDirectoryHandle(seg, { create: true });
      }

      const res = await fetch(item.link, { signal: abortSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const fileHandle = await dir.getFileHandle(item.name, { create: true });
      const writable = await fileHandle.createWritable();

      if (res.body) {
        const reader = res.body.getReader();
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            await writable.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        const blob = await res.blob();
        await writable.write(blob);
      }
      await writable.close();
      progress.completed++;
    } catch (e) {
      if (abortSignal?.aborted) break;
      progress.failed.push(item.name);
      progress.completed++;
    }

    onProgress({ ...progress });
  }

  progress.phase = "done";
  return progress;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
