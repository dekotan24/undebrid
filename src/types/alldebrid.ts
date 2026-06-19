export interface ADResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  error?: { code: string; message: string };
}

export interface ADUser {
  username: string;
  email: string;
  isPremium: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  premiumUntil: number;
  lang: string;
  preferedDomain: string;
  fidelityPoints: number;
  limitedHostersQuotas: Record<string, { used: number; remaining: number }>;
  remainingTrialQuota: number;
  notifications: Array<{ code: string; message: string }>;
}

export interface ADLinkInfo {
  link: string;
  filename: string;
  size: number;
  host: string;
  hostDomain: string;
  error?: { code: string; message: string };
}

export interface ADUnlockedLink {
  link: string;
  filename: string;
  host: string;
  filesize: number;
  id: string;
  hostDomain: string;
  streams?: Record<string, { name: string; ext: string; quality: string; filesize: number }>;
  delayed?: number;
  paws?: boolean;
}

export interface ADMagnet {
  id: number;
  filename: string;
  size: number;
  status: string;
  statusCode: number;
  downloaded: number;
  uploaded: number;
  seeders: number;
  downloadSpeed: number;
  uploadSpeed: number;
  uploadDate: number;
  completionDate: number;
  links: ADMagnetLink[];
  hash: string;
  ready?: boolean;
  name?: string;
  notified?: boolean;
  version?: number;
  nbLinks?: number;
  type?: string;
}

export interface ADMagnetLink {
  link: string;
  filename: string;
  size: number;
  files?: ADMagnetFile[];
}

export interface ADMagnetFile {
  n: string;
  s?: number;
  l?: string;
  e?: ADMagnetFile[];
}

export interface ADMagnetUploadResult {
  magnet: string;
  hash: string;
  name: string;
  size: number;
  ready: boolean;
  id: number;
  error?: { code: string; message: string };
}

export interface ADMagnetStatus {
  magnets: ADMagnet[];
  counter?: number;
  fullsync?: boolean;
}

export interface ADDelayedLink {
  status: number;
  time_left: number;
  link?: string;
}

export interface ADHistoryLink {
  link: string;
  link_dl?: string;
  filename: string;
  size: number;
  date: number;
  host: string;
}

export interface ADHost {
  name: string;
  type: "premium" | "free";
  domains: string[];
  regexp?: string;
  status: boolean;
  quota?: number;
  quotaMax?: number;
  quotaType?: "traffic" | "nb_download";
  limitSimuDl?: number;
}

export type MagnetStatusCode =
  | 0  // In Queue
  | 1  // Downloading
  | 2  // Compressing / Moving
  | 3  // Uploading
  | 4  // Ready
  | 5  // Upload fail
  | 6  // Error
  | 7  // Virus
  | 8  // Dead
  | 9  // Metadl
  | 10 // Stalled (no seeds)
  | 11 // Stalled (waiting)
  | 12; // Insufficient space
