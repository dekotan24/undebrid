"use client";

import { useState, useCallback, useRef } from "react";
import { api, ADError } from "@/lib/api";
import { formatBytes, formatSpeed, formatETA, formatDate, magnetStatusLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Plus,
  Magnet,
  Upload,
  Loader2,
  Trash2,
  RotateCcw,
  FolderOpen,
  ArrowDownToLine,
  Copy,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  Download,
  ArrowUpDown,
  Users,
  ClipboardCopy,
  HardDriveDownload,
  X,
} from "lucide-react";
import type { ADMagnet, ADMagnetFile } from "@/types/alldebrid";
import {
  downloadAsZip,
  downloadToFolder,
  isFileSystemAccessSupported,
  type FolderDownloadProgress,
} from "@/lib/folder-download";

function collectLinks(files: ADMagnetFile[]): { name: string; link: string; size: number }[] {
  const result: { name: string; link: string; size: number }[] = [];
  for (const f of files) {
    if (f.l) result.push({ name: f.n, link: f.l, size: f.s ?? 0 });
    if (f.e) result.push(...collectLinks(f.e));
  }
  return result;
}

interface MagnetsViewProps {
  magnets: ADMagnet[];
  loading: boolean;
  onRefresh: () => void;
}

function statusBadge(code: number) {
  const label = magnetStatusLabel(code);
  if (code === 4) return <Badge variant="green">{label}</Badge>;
  if (code >= 5) return <Badge variant="red">{label}</Badge>;
  if (code === 1 || code === 3) return <Badge variant="blue" pulse>{label}</Badge>;
  return <Badge variant="amber">{label}</Badge>;
}

function FileTree({ files, depth = 0 }: { files: ADMagnetFile[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {files.map((f, i) => {
        const isDir = f.e && f.e.length > 0;
        const isOpen = expanded.has(f.n);
        const key = `${depth}-${i}-${f.n}`;

        return (
          <div key={key}>
            <div
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-bg-input/50 group"
              style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
              {isDir ? (
                <button onClick={() => toggle(f.n)} className="text-text-muted">
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-3.5" />
              )}
              {isDir ? (
                <Folder className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <File className="h-4 w-4 text-text-muted shrink-0" />
              )}
              <span className="text-sm text-text-primary truncate flex-1" title={f.n}>{f.n}</span>
              {f.s != null && f.s > 0 && (
                <span className="text-xs text-text-muted shrink-0">{formatBytes(f.s)}</span>
              )}
              {f.l && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(f.l!);
                      toast("info", "Link copied");
                    }}
                    className="p-1 text-text-muted hover:text-text-primary rounded"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={f.l}
                    target="_blank"
                    rel="noopener"
                    className="p-1 text-accent hover:text-accent-hover rounded"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
            {isDir && isOpen && f.e && <FileTree files={f.e} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

function MagnetCard({
  magnet,
  onDelete,
  onRestart,
  onFiles,
}: {
  magnet: ADMagnet;
  onDelete: (id: number) => void;
  onRestart: (id: number) => void;
  onFiles: (id: number) => void;
}) {
  const isActive = magnet.statusCode >= 0 && magnet.statusCode < 4;
  const isReady = magnet.statusCode === 4;
  const isError = magnet.statusCode >= 5;
  const progress = magnet.size > 0 ? (magnet.downloaded / magnet.size) * 100 : 0;
  const eta =
    magnet.downloadSpeed > 0
      ? (magnet.size - magnet.downloaded) / magnet.downloadSpeed
      : 0;

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5 hover:border-accent/20 transition-colors animate-slide-in">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate" title={magnet.filename}>{magnet.filename}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-text-muted">{formatBytes(magnet.size)}</span>
            {statusBadge(magnet.statusCode)}
            {magnet.uploadDate > 0 && (
              <span className="text-xs text-text-muted">Added {formatDate(magnet.uploadDate)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isReady && (
            <button
              onClick={() => onFiles(magnet.id)}
              className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
              title="View files"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
          )}
          {isError && (
            <button
              onClick={() => onRestart(magnet.id)}
              className="p-2 text-warning hover:bg-amber-500/10 rounded-lg transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(magnet.id)}
            className="p-2 text-text-muted hover:text-error hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isActive && (
        <div className="space-y-2">
          <ProgressBar
            value={progress}
            active={magnet.statusCode === 1}
            color={magnet.statusCode === 1 ? "blue" : "amber"}
          />
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-4">
              <span>{progress.toFixed(1)}%</span>
              <span>{formatBytes(magnet.downloaded)} / {formatBytes(magnet.size)}</span>
            </div>
            <div className="flex items-center gap-4">
              {magnet.downloadSpeed > 0 && (
                <span className="flex items-center gap-1">
                  <ArrowDownToLine className="h-3 w-3 text-accent" />
                  {formatSpeed(magnet.downloadSpeed)}
                </span>
              )}
              {magnet.uploadSpeed > 0 && (
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-success" />
                  {formatSpeed(magnet.uploadSpeed)}
                </span>
              )}
              {magnet.seeders > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {magnet.seeders}
                </span>
              )}
              {eta > 0 && <span>ETA {formatETA(eta)}</span>}
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <div className="mt-1">
          <ProgressBar value={100} color="green" />
        </div>
      )}

      {isError && (
        <div className="mt-2">
          <ProgressBar value={progress} color="red" />
          <p className="text-xs text-error mt-1.5">{magnet.status}</p>
        </div>
      )}
    </div>
  );
}

export function MagnetsView({ magnets, loading, onRefresh }: MagnetsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [magnetInput, setMagnetInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filesModal, setFilesModal] = useState<{ id: number; files: ADMagnetFile[] } | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "ready" | "error">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [folderDlProgress, setFolderDlProgress] = useState<FolderDownloadProgress | null>(null);
  const folderDlAbort = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadMagnet = useCallback(async () => {
    const uris = magnetInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (uris.length === 0) return;

    setUploading(true);
    try {
      const result = await api.uploadMagnet(uris);
      const success = result.magnets.filter((m) => !m.error);
      const errors = result.magnets.filter((m) => m.error);
      if (success.length > 0) toast("success", `${success.length} magnet(s) added`);
      if (errors.length > 0) toast("error", `${errors.length} magnet(s) failed`);
      setShowAdd(false);
      setMagnetInput("");
      onRefresh();
    } catch (e) {
      if (e instanceof ADError) toast("error", `${e.code}: ${e.message}`);
    }
    setUploading(false);
  }, [magnetInput, toast, onRefresh]);

  const handleUploadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setUploading(true);
      try {
        const result = await api.uploadTorrent(files);
        const success = result.files.filter((f) => !f.error);
        if (success.length > 0) toast("success", `${success.length} torrent(s) added`);
        setShowAdd(false);
        onRefresh();
      } catch (e) {
        if (e instanceof ADError) toast("error", `${e.code}: ${e.message}`);
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [toast, onRefresh],
  );

  const requestDelete = useCallback(
    (id: number) => {
      const m = magnets.find((m) => m.id === id);
      setDeleteTarget({ id, name: m?.filename ?? `Magnet #${id}` });
    },
    [magnets],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMagnet(deleteTarget.id);
      toast("success", "Magnet deleted");
      onRefresh();
    } catch (e) {
      if (e instanceof ADError) toast("error", e.message);
    }
    setDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, toast, onRefresh]);

  const handleRestart = useCallback(
    async (id: number) => {
      try {
        await api.restartMagnet(id);
        toast("success", "Magnet restarted");
        onRefresh();
      } catch (e) {
        if (e instanceof ADError) toast("error", e.message);
      }
    },
    [toast, onRefresh],
  );

  const handleFiles = useCallback(
    async (id: number) => {
      setLoadingFiles(true);
      try {
        const result = await api.getMagnetFiles([id]);
        if (Array.isArray(result) && result.length > 0) {
          setFilesModal({ id, files: result[0].files });
        }
      } catch (e) {
        if (e instanceof ADError) toast("error", e.message);
      }
      setLoadingFiles(false);
    },
    [toast],
  );

  const getMagnetSafeName = useCallback(() => {
    if (!filesModal) return "";
    const magnetName =
      magnets.find((m) => m.id === filesModal.id)?.filename ?? `magnet-${filesModal.id}`;
    return magnetName.replace(/[<>:"/\\|?*]/g, "_");
  }, [filesModal, magnets]);

  const handleZipDownload = useCallback(async () => {
    if (!filesModal) return;
    const safeName = getMagnetSafeName();
    const abort = new AbortController();
    folderDlAbort.current = abort;

    try {
      const result = await downloadAsZip(
        filesModal.files,
        safeName,
        (p) => setFolderDlProgress(p),
        abort.signal,
      );
      if (result.failed.length > 0) {
        toast("error", `${result.failed.length} file(s) failed`);
      } else {
        toast("success", `ZIP download complete`);
      }
    } catch {
      // user cancelled or error
    }
    setFolderDlProgress(null);
    folderDlAbort.current = null;
  }, [filesModal, getMagnetSafeName, toast]);

  const handleFolderDownload = useCallback(async () => {
    if (!filesModal) return;
    const safeName = getMagnetSafeName();
    const abort = new AbortController();
    folderDlAbort.current = abort;

    try {
      const result = await downloadToFolder(
        filesModal.files,
        safeName,
        (p) => setFolderDlProgress(p),
        abort.signal,
      );
      if (result.failed.length > 0) {
        toast("error", `${result.failed.length} file(s) failed`);
      } else {
        toast("success", `${result.completed} file(s) saved`);
      }
    } catch {
      // user cancelled folder picker
    }
    setFolderDlProgress(null);
    folderDlAbort.current = null;
  }, [filesModal, getMagnetSafeName, toast]);

  const filtered = magnets.filter((m) => {
    if (filter === "active") return m.statusCode >= 0 && m.statusCode < 4;
    if (filter === "ready") return m.statusCode === 4;
    if (filter === "error") return m.statusCode >= 5;
    return true;
  });

  const counts = {
    all: magnets.length,
    active: magnets.filter((m) => m.statusCode >= 0 && m.statusCode < 4).length,
    ready: magnets.filter((m) => m.statusCode === 4).length,
    error: magnets.filter((m) => m.statusCode >= 5).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Magnets</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Manage torrent downloads via AllDebrid
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-glow"
        >
          <Plus className="h-4 w-4" />
          Add Magnet
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "active", "ready", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-text-muted hover:text-text-secondary border border-transparent"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading && magnets.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Magnet className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">No magnets</p>
          <p className="text-sm">Add magnet URIs or upload .torrent files</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered
            .sort((a, b) => {
              if (a.statusCode < 4 && b.statusCode >= 4) return -1;
              if (a.statusCode >= 4 && b.statusCode < 4) return 1;
              return b.uploadDate - a.uploadDate;
            })
            .map((m) => (
              <MagnetCard
                key={m.id}
                magnet={m}
                onDelete={requestDelete}
                onRestart={handleRestart}
                onFiles={handleFiles}
              />
            ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Magnet">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">
              Magnet URIs / Hashes (one per line)
            </label>
            <textarea
              value={magnetInput}
              onChange={(e) => setMagnetInput(e.target.value)}
              placeholder={"magnet:?xt=urn:btih:...\nor paste info hash"}
              rows={4}
              className="w-full bg-bg-input border border-border-default rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none resize-none font-mono"
              autoFocus
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-card px-3 text-xs text-text-muted">or</span>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".torrent"
              multiple
              onChange={handleUploadFile}
              className="hidden"
              id="torrent-upload"
            />
            <label
              htmlFor="torrent-upload"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-border-default rounded-lg text-sm text-text-muted hover:border-accent/40 hover:text-accent cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload .torrent file(s)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadMagnet}
              disabled={uploading || !magnetInput.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Magnet className="h-4 w-4" />
              )}
              Add
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!filesModal}
        onClose={() => setFilesModal(null)}
        title="Magnet Files"
      >
        {loadingFiles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : filesModal?.files ? (
          <>
            {(() => {
              const allLinks = collectLinks(filesModal.files);
              if (allLinks.length <= 1) return null;
              return (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-default">
                  <button
                    onClick={() => {
                      const text = allLinks.map((l) => l.link).join("\n");
                      navigator.clipboard.writeText(text);
                      toast("success", `${allLinks.length} links copied`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-input hover:bg-bg-input/80 border border-border-default rounded-lg transition-colors"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy All Links ({allLinks.length})
                  </button>
                  <button
                    onClick={() => {
                      for (const l of allLinks) {
                        const a = document.createElement("a");
                        a.href = l.link;
                        a.target = "_blank";
                        a.rel = "noopener";
                        a.click();
                      }
                      toast("info", `Opening ${allLinks.length} downloads...`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download All
                  </button>
                  <button
                    onClick={handleZipDownload}
                    disabled={!!folderDlProgress}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-primary bg-success/15 hover:bg-success/25 border border-success/30 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <HardDriveDownload className="h-3.5 w-3.5 text-success" />
                    Download ZIP
                  </button>
                  {isFileSystemAccessSupported() && (
                    <button
                      onClick={handleFolderDownload}
                      disabled={!!folderDlProgress}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-input hover:bg-bg-input/80 border border-border-default rounded-lg transition-colors disabled:opacity-40"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Save to Folder
                    </button>
                  )}
                </div>
              );
            })()}
            {folderDlProgress && (
              <div className="mb-3 p-3 bg-bg-input rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {folderDlProgress.phase === "zipping"
                      ? "Creating ZIP..."
                      : `Downloading ${folderDlProgress.completed}/${folderDlProgress.total}`}
                  </span>
                  <button
                    onClick={() => folderDlAbort.current?.abort()}
                    className="p-1 text-text-muted hover:text-error rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ProgressBar
                  value={
                    folderDlProgress.total > 0
                      ? (folderDlProgress.completed / folderDlProgress.total) * 100
                      : 0
                  }
                  color="green"
                />
                <p className="text-xs text-text-muted truncate" title={folderDlProgress.current}>
                  {folderDlProgress.current}
                </p>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto -mx-2">
              <FileTree files={filesModal.files} />
            </div>
          </>
        ) : null}
      </Modal>

      <Confirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Magnet"
        message={`"${deleteTarget?.name}" を削除しますか？この操作は取り消せません。`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
