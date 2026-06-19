const API_BASE = "/api/ad";

async function request<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (Array.isArray(val)) {
        val.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, val);
      }
    }
  }
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status === "error") {
    throw new ADError(json.error?.code ?? "UNKNOWN", json.error?.message ?? "Unknown error");
  }
  return json.data as T;
}

async function postForm<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(API_BASE + path, { method: "POST", body });
  const json = await res.json();
  if (json.status === "error") {
    throw new ADError(json.error?.code ?? "UNKNOWN", json.error?.message ?? "Unknown error");
  }
  return json.data as T;
}

export class ADError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const api = {
  getUser: () =>
    request<{ user: import("@/types/alldebrid").ADUser }>("/user").then((d) => d.user),

  getLinkInfo: (links: string[]) =>
    request<{ infos: import("@/types/alldebrid").ADLinkInfo[] }>("/link/infos", {
      "link[]": links,
    }),

  unlockLink: (link: string, password?: string) => {
    const params: Record<string, string> = { link };
    if (password) params.password = password;
    return request<import("@/types/alldebrid").ADUnlockedLink>("/link/unlock", params);
  },

  getDelayedLink: (id: string) =>
    request<import("@/types/alldebrid").ADDelayedLink>("/link/delayed", { id }),

  uploadMagnet: (magnets: string[]) =>
    request<{ magnets: import("@/types/alldebrid").ADMagnetUploadResult[] }>("/magnet/upload", {
      "magnets[]": magnets,
    }),

  uploadTorrent: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files[]", f));
    return postForm<{ files: import("@/types/alldebrid").ADMagnetUploadResult[] }>(
      "/magnet/upload/file",
      form,
    );
  },

  getMagnetStatus: (id?: number) => {
    const params: Record<string, string> = {};
    if (id !== undefined) params.id = String(id);
    return request<{ magnets: import("@/types/alldebrid").ADMagnet[] }>("/magnet/status", params);
  },

  getMagnetFiles: (ids: number[]) =>
    request<{ magnets: Array<{ id: string; files: import("@/types/alldebrid").ADMagnetFile[] }> }>(
      "/magnet/files",
      { "id[]": ids.map(String) },
    ).then((d) => d.magnets),

  deleteMagnet: (id: number) => request<{ message: string }>("/magnet/delete", { id: String(id) }),

  restartMagnet: (id: number) =>
    request<{ message: string }>("/magnet/restart", { id: String(id) }),

  getHosts: () =>
    request<{ hosts: Record<string, import("@/types/alldebrid").ADHost> }>("/user/hosts").then(
      (d) => d.hosts,
    ),

  getPublicHosts: () =>
    request<{
      hosts: Record<string, import("@/types/alldebrid").ADHost>;
      streams: Record<string, import("@/types/alldebrid").ADHost>;
    }>("/hosts"),

  getHistory: () => request<{ links: import("@/types/alldebrid").ADHistoryLink[] }>("/user/history"),

  getSavedLinks: () =>
    request<{ links: import("@/types/alldebrid").ADHistoryLink[] }>("/user/links"),
};
