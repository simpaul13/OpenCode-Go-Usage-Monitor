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

1. Open `bra://extensions/` (or `chrome://extensions/` / `edge://extensions/`)
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked**
4. Select the project folder: `OpenCode Go Usage Monitor`
5. The extension activates automatically when you visit `https://opencode.ai/workspace/*`

### Firefox

Manifest V3 is not supported in Firefox yet — you would need to convert to Manifest V2.

---

## File structure

```
OpenCode Go Usage Monitor/
├── LICENSE                       # MIT license
├── manifest.json                 # Extension config (Manifest V3, version 3.9)
├── README.md                     # This file
├── icons/
│   ├── icon-48.png
│   └── icon-128.png
└── content_scripts/
    ├── calculation.js            # Burn-rate math, projections, status logic
    ├── analyzer.js               # DOM scraper → usage % + reset days
    ├── ui.js                     # Injects UI elements (badges, tooltips, summary card)
    └── main.js                   # Orchestrator entry point + MutationObserver
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
