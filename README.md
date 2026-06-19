# Undebrid

> A modern download manager for [AllDebrid](https://alldebrid.com) — manage links, magnets, and hosters from a sleek dark UI.

[日本語](README_JA.md)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Dashboard** — Account overview with premium status, fidelity points, active magnets, and recent downloads
- **Link Unlocking** — Paste URLs from supported hosters to generate premium direct download links
- **Magnet Management** — Add magnet URIs or upload `.torrent` files with real-time progress, speed, ETA, and seeder count
- **File Browser** — Browse magnet file trees with per-file download, copy link, batch download (ZIP with folder hierarchy), and save-to-folder (Chrome)
- **Hoster Status** — View all 50+ supported providers with online/offline status, usage quotas, and daily limits
- **Delete Confirmation** — Safety dialogs before deleting magnets or removing links
- **Dark Mode UI** — Navy + blue accent theme with smooth animations

## Screenshot

![Undebrid Dashboard](docs/undebrid.png)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### Setup

```bash
git clone https://github.com/dekotan24/undebrid.git
cd undebrid
npm install
npm run dev
```

Or use the startup script:

```bash
# Windows
start.bat

# Linux / macOS
./start.sh
```

Open [http://localhost:3000](http://localhost:3000) and enter your [AllDebrid API key](https://alldebrid.com/apikeys/) in Settings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| API | AllDebrid API v4.1 (proxied via API routes) |
| ZIP | JSZip |

## Architecture

```
src/
├── app/
│   ├── api/ad/          # API proxy routes (cookie-based auth)
│   ├── globals.css      # Tailwind theme & custom styles
│   ├── layout.tsx
│   └── page.tsx         # Main SPA entry
├── components/
│   ├── DashboardView    # Account overview
│   ├── LinksView        # URL unlock interface
│   ├── MagnetsView      # Magnet management + file browser
│   ├── HostsView        # Provider status & quotas
│   ├── SettingsView     # API key & polling config
│   ├── Sidebar          # Navigation
│   └── ui/              # Reusable components (Modal, Toast, etc.)
├── lib/
│   ├── api.ts           # AllDebrid API client
│   ├── folder-download  # ZIP & File System Access download
│   ├── settings.ts      # localStorage settings
│   └── utils.ts         # Formatters & helpers
└── types/
    └── alldebrid.ts     # API type definitions
```

### Security

- API key is stored as an **httpOnly cookie** — never exposed to client-side JavaScript
- All AllDebrid API calls are proxied through Next.js API routes to avoid CORS and key exposure
- No data is sent to any third party

## License

MIT
