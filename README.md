# Folder Dashboard

A macOS desktop app for navigating folders — multiple side-by-side panels, icon grid view, pinned favorites, and drag-and-drop file operations.

Built with **Electron + React + TypeScript + Vite**.

## Quick start

### Prerequisites

- **Node.js 18+** (`brew install node` or [nodejs.org](https://nodejs.org))
- macOS 12 Monterey or later recommended

### Run in dev mode

```bash
git clone https://github.com/YOUR_USERNAME/folder-dashboard.git
cd folder-dashboard
npm install
npm run dev
```

The app window opens automatically once Vite's dev server is ready.

### Build a distributable `.app`

```bash
npm run dist
# Output: release/Folder Dashboard-1.0.0.dmg
```

## Features

| Feature | Details |
|---|---|
| **Multiple panels** | 2–4 side-by-side folder views; add / close panels freely |
| **Icon grid view** | Color-coded SVG icons for each file type |
| **Favorites sidebar** | Pin folders with one click; drag to reorder; persists across sessions |
| **Navigation** | Back / Forward / Up buttons, breadcrumb trail, click-to-navigate |
| **Copy / Paste** | Right-click context menu or ⌘C / ⌘V; clipboard bar shows status |
| **Cut & Move** | ⌘X + ⌘V moves files; cross-device moves handled automatically |
| **Drag & Drop** | Drag from one panel and drop on another to move; hold ⌥ to copy |
| **Open files** | Double-click opens with macOS default app |
| **Delete** | Moves to Trash (⌘⌫) |
| **Resizable panels** | Drag the divider between panels |
| **Dark theme** | Deep navy/purple palette with color-coded file types |

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `⌘C` | Copy selected |
| `⌘X` | Cut selected |
| `⌘V` | Paste into current panel |
| `⌘↑` | Go up one directory |
| `Backspace` | Go back |
| `⌘R` / `F5` | Refresh panel |
| `⌘⌫` | Move to Trash |

## Tech stack

- [Electron](https://www.electronjs.org/) v33
- [React](https://react.dev/) 18 + TypeScript
- [Vite](https://vitejs.dev/) 6
- [electron-builder](https://www.electron.build/) for packaging
- Node.js `fs` module via IPC for all file operations
