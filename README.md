# OpenCode Go Usage Monitor

A browser extension that adds a **burn-rate aware usage dashboard** to [OpenCode.ai](https://opencode.ai) workspace pages. It scrapes your existing usage limits (hourly/rolling, weekly, monthly) and overlays daily pacing, projections, status badges, and a summary card so you never run out before reset.

![Version](https://img.shields.io/badge/version-3.9-brightgreen)

---

## Features

- **Daily Pace** — shows your current daily burn rate, safe max, and headroom
- **Monthly forecast** — projects end-of-cycle usage with a visual progress bar and warns if you'll run out early
- **Status badges** — color-coded Good / Slow down / Stop now on every limit, with **detailed tooltips** on hover
- **Summary card** — a compact card with all four limits (Daily, Monthly, Weekly, Hourly) at a glance, plus an overall verdict
- **Auto-refresh** — watches for DOM changes via `MutationObserver` so the UI stays in sync without reloading
- **Reorder** — sorts limits into a consistent order: Hourly → Daily → Weekly → Monthly
- **Hourly rename** — automatically relabels "Rolling Usage" as "Hourly Usage" for clarity
- **Overall status** — a top-level Good / Use carefully / Action needed badge computed from the worst limit status

---

## How it works

The extension injects four content scripts into `https://opencode.ai/workspace/*` (loaded in this exact order):

```
content_scripts/
├── calculation.js    # Burn-rate math, projections, status logic (loaded first)
├── analyzer.js       # Scrapes usage % and reset days from the page
├── ui.js             # DOM manipulation, tooltips, badges, summary card
└── main.js           # Orchestrator — runs everything on page load
```

### Data flow

1. **calculation.js** — defines all burn-rate math (`analyzeBurnRate`, `analyzeDailyPacing`, `analyzeWeeklyLimit`, `analyzeRollingLimit`) and status helpers (`getMonthlyStatus`, `getDailyStatus`, `getWeeklyStatus`, `getRollingStatus`, `getOverallStatus`)
2. **analyzer.js** — reads the page DOM to extract current usage percentages (`parseAllPercents`) and reset-day counts (`getMonthlyResetDays`, `getWeeklyResetDays`)
3. **ui.js** — injects the Daily Usage row, renames "Rolling" to "Hourly", reorders limit items, attaches status badges with hover tooltips (`buildTooltip`), and builds the summary card (`addSummaryCard`)
4. **main.js** — calls `computeAll()` (which invokes everything above) on page load and sets up a `MutationObserver` to re-run on DOM changes

### Summary card

The injected summary card appears below the native usage section and includes:

- **Verdict banner** — "Will run out Xd before reset" (red) or "Safe until reset" (green)
- **Monthly forecast panel** — current usage, remaining %, projected end-of-cycle %, daily burn/safe/headroom pills, and a dual-bar visual (current + projected marker)
- **Four-column metric grid** — Daily (burn vs safe max), Monthly (used vs left), Weekly (left vs max/day), Hourly/5h (left vs max/hr), each with color-coded status
- **Action footer** — overall status label with guidance for safe pacing limits

---

## Installation

### Brave / Chrome / Edge (Chromium)

#### Option 1 — From source (development)
1. Clone the repo or download the ZIP from GitHub:
   ```bash
   git clone https://github.com/simpaul13/OpenCode-Go-Usage-Monitor.git
   ```
2. Open `bra://extensions/` (or `chrome://extensions/` / `edge://extensions/`)
3. Toggle **Developer mode** on (top-right)
4. Click **Load unpacked**
5. Select the project folder
6. The extension activates automatically when you visit `https://opencode.ai/workspace/*`

#### Option 2 — From GitHub Releases (recommended for users)
1. Go to the **[Releases page](https://github.com/simpaul13/OpenCode-Go-Usage-Monitor/releases)**
2. Download the latest `opencode-go-usage-monitor-v*.zip`
3. Unzip it to a folder anywhere on your computer
4. Open `bra://extensions/` → toggle **Developer mode** → **Load unpacked** → select the unzipped folder
5. Done!

> 💡 You can also pin the extension to your toolbar in `bra://extensions/` → click **Details** → toggle **Pin to toolbar**.

### Firefox

Manifest V3 is not supported in Firefox yet — you would need to convert to Manifest V2.

---

## Using this on GitHub

This repo is set up with everything you need to distribute the extension entirely through GitHub.

### 1. Create a Release (automated)

The included GitHub Actions workflow (`.github/workflows/release.yml`) automatically builds a clean `.zip` and publishes a **GitHub Release** whenever you push a version tag:

```bash
# From your local repo:
git tag v3.9
git push origin v3.9
```

That's it — the Action will:
- Build `opencode-go-usage-monitor-v3.9.zip` (only the essential files)
- Create a Release on GitHub
- Upload the `.zip` as a downloadable asset

Users can then grab the `.zip` from the [Releases page](https://github.com/simpaul13/OpenCode-Go-Usage-Monitor/releases).

### 2. Package locally (optional)

Run one of these scripts to produce the same `.zip` on your machine:

| OS | Command |
|----|---------|
| Windows (PowerShell) | `.\scripts\package.ps1` |
| macOS / Linux | `./scripts/package.sh` |

Output: `releases/opencode-go-usage-monitor-v{version}.zip`

### 3. The RELEASES branch

There's a dedicated [`RELEASES`](https://github.com/simpaul13/OpenCode-Go-Usage-Monitor/tree/RELEASES) branch that contains **only** the files users need — no scripts, no CI configs, no git history. You can export or ZIP this branch at any time for a clean distribution.

```
https://github.com/simpaul13/OpenCode-Go-Usage-Monitor/archive/refs/heads/RELEASES.zip
```

---

## File structure

```
OpenCode Go Usage Monitor/
├── .github/workflows/
│   └── release.yml               # CI: auto-builds .zip on git tag push
├── .gitignore                     # Ignores releases/ and dist/
├── LICENSE                        # MIT license
├── manifest.json                  # Extension config (Manifest V3, version 3.9)
├── README.md                      # This file
├── icons/
│   ├── icon-48.png
│   └── icon-128.png
├── scripts/
│   ├── package.ps1               # Windows PowerShell packaging script
│   └── package.sh                # macOS/Linux bash packaging script
└── content_scripts/
    ├── calculation.js             # Burn-rate math, projections, status logic
    ├── analyzer.js                # DOM scraper → usage % + reset days
    ├── ui.js                      # Injects UI elements (badges, tooltips, summary card)
    └── main.js                    # Orchestrator entry point + MutationObserver
```

---

## Development

To modify or extend the extension:

1. Edit the files in `content_scripts/`
2. Go to `bra://extensions/` and click the **↻ Refresh** icon on the extension card
3. Reload your OpenCode workspace page

The scripts are loaded in this order: `calculation.js` → `analyzer.js` → `ui.js` → `main.js`. Keep that dependency chain in mind when adding new functions — `calculation.js` must be first since the other scripts depend on its math helpers.

---

## Compatibility

| Browser | Status |
|---------|--------|
| Brave   | ✅ Works |
| Chrome  | ✅ Works |
| Edge    | ✅ Works |
| Firefox | ❌ Not yet (MV3 unsupported) |

---

## License

MIT — do whatever you want with it.
