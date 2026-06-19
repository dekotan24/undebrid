"use client";

import { useState, useCallback } from "react";
import { api, ADError } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Link2,
  ArrowDownToLine,
  Copy,
  Loader2,
  ExternalLink,
  Trash2,
  CheckCircle,
} from "lucide-react";
import type { ADUnlockedLink } from "@/types/alldebrid";

export function LinksView() {
  const [showAdd, setShowAdd] = useState(false);
  const [urls, setUrls] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState<ADUnlockedLink[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const handleUnlock = useCallback(async () => {
    const links = urls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (links.length === 0) return;

    setLoading(true);
    const results: ADUnlockedLink[] = [];
    let errors = 0;

    for (const link of links) {
      try {
        const result = await api.unlockLink(link, password || undefined);
        results.push(result);
      } catch (e) {
        errors++;
        if (e instanceof ADError) {
          toast("error", `${e.code}: ${e.message}`);
        }
      }
    }

    setUnlocked((prev) => [...results, ...prev]);
    if (results.length > 0) {
      toast("success", `${results.length} link(s) unlocked`);
    }
    if (errors > 0) {
      toast("error", `${errors} link(s) failed`);
    }

    setShowAdd(false);
    setUrls("");
    setPassword("");
    setLoading(false);
  }, [urls, password, toast]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast("info", "Link copied");
  };

  const requestRemove = (id: string) => {
    const link = unlocked.find((l) => l.id === id);
    setDeleteTarget({ id, name: link?.filename ?? "this link" });
  };

  const confirmRemove = () => {
    if (!deleteTarget) return;
    setUnlocked((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast("info", "Link removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Links</h2>
          <p className="text-sm text-text-muted mt-0.5">Unlock and download premium links</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-glow"
        >
          <Plus className="h-4 w-4" />
          Add Links
        </button>
      </div>

      {unlocked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Link2 className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">No unlocked links</p>
          <p className="text-sm">Add URLs to unlock premium download links</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unlocked.map((link) => (
            <div
              key={link.id}
              className="bg-bg-card border border-border-default rounded-xl p-4 hover:border-accent/20 transition-colors animate-slide-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate" title={link.filename}>{link.filename}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-muted">{formatBytes(link.filesize)}</span>
                    <Badge variant="gray">{link.host}</Badge>
                    {link.delayed ? (
                      <Badge variant="amber">Delayed</Badge>
                    ) : (
                      <Badge variant="green">
                        <CheckCircle className="h-3 w-3" /> Ready
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyLink(link.link)}
                    className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-colors"
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener"
                    className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Open in browser"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={link.link}
                    download
                    className="p-2 text-accent hover:text-accent-hover hover:bg-accent/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => requestRemove(link.id)}
                    className="p-2 text-text-muted hover:text-error hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Links">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">
              URLs (one per line)
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={"https://example.com/file.zip\nhttps://mega.nz/..."}
              rows={5}
              className="w-full bg-bg-input border border-border-default rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none resize-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">
              Password (optional)
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Link password"
              className="w-full bg-bg-input border border-border-default rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              disabled={loading || !urls.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              Unlock
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmRemove}
        title="Remove Link"
        message={`"${deleteTarget?.name}" をリストから削除しますか？`}
        confirmLabel="Remove"
      />
    </div>
  );
}
