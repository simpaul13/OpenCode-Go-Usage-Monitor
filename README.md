# OpenCode Go Usage Monitor

A browser extension that adds a **burn-rate aware usage dashboard** to [OpenCode.ai](https://opencode.ai) workspace pages. It scrapes your existing usage limits (monthly, weekly, rolling/hourly) and overlays daily pacing, projections, and status badges so you never run out before reset.

![Version](https://img.shields.io/badge/version-3.9-brightgreen)

---

## Features

- **Daily Pace** — shows your current daily burn rate, safe max, and headroom
- **Monthly forecast** — projects end-of-cycle usage and warns if you'll run out early
- **Status badges** — color-coded Good / Slow down / Stop now on every limit
- **Summary card** — a compact card with all four limits at a glance
- **Auto-refresh** — watches for DOM changes so the UI stays in sync
- **Reorder** — sorts limits into a consistent order (Hourly → Daily → Weekly → Monthly)

---

## How it works

The extension injects four content scripts into `https://opencode.ai/workspace/*`:

```
content_scripts/
├── analyzer.js       # Scrapes usage % and reset days from the page
├── calculation.js    # Burn-rate math, projections, status logic
├── ui.js             # DOM manipulation, tooltips, badges, summary card
└── main.js           # Orchestrator — runs everything on page load
```

### Data flow

1. **analyzer.js** — reads the page DOM to get current usage percentages and reset counts
2. **calculation.js** — computes burn rate, safe budgets, days until empty, and status colors
3. **ui.js** — injects the Daily Pace row, status badges, and the summary card into the page
4. **main.js** — calls everything in order and sets up a `MutationObserver` for live updates

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
├── manifest.json                # Extension config (Manifest V3)
├── README.md                    # This file
├── icons/
│   ├── icon-48.png
│   └── icon-128.png
└── content_scripts/
    ├── analyzer.js              # DOM scraper → usage % + reset days
    ├── calculation.js           # Burn rate math & status helpers
    ├── ui.js                    # Injects UI elements into the page
    └── main.js                  # Orchestrator entry point
```

---

## Development

To modify or extend the extension:

1. Edit the files in `content_scripts/`
2. Go to `bra://extensions/` and click the **↻ Refresh** icon on the extension card
3. Reload your OpenCode workspace page

The scripts are loaded in this order: `calculation.js` → `analyzer.js` → `ui.js` → `main.js`. Keep that dependency chain in mind when adding new functions.

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
