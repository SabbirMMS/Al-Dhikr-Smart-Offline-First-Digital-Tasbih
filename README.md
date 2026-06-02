# Al-Dhikr - Smart Digital Tasbih & Dhikr Counter

An offline-first, production-ready, mobile-friendly **Progressive Web App (PWA)** and **Chrome Extension** designed to facilitate Islamic daily remembrance (Dhikr & Salawat). Built using **React (Vite)**, **Tailwind CSS v4**, **Redux Toolkit**, and **IndexedDB (via Dexie.js)**, it boasts a premium visual aesthetic combining traditional Islamic geometry and patterns with sleek, modern glassmorphism.

---

## 🌟 Core Feature Summary

1. **Local Multi-Profile System:** PIN-secured profiles stored in IndexedDB.
2. **Catalog Library (CRUD):** Custom categories, preloaded templates (SubhanAllah, Alhamdulillah, etc.), and traditional Arabic script support (`Noto Naskh Arabic`).
3. **Advanced Tapping UI:** Large glowing central progress ring with micro-animations and confetti celebratory bursts on milestone targets.
4. **Multi-Counter Grid (3x3):** Custom hotkey mappings (`q`-`c`), independent counters, and decrement options.
5. **Streaks & Daily Reset:** Automatic archival of active counts to history at local midnight, log calculations, and gold fire-icon daily streak increments.
6. **Custom SVG Dashboard Charts:** Dynamic 7-day bar chart and donut progress breakdowns without bloated, unstable external packages.
7. **Smart Suggestions:** Dynamic dhikr suggestions based on the time of day (Morning/Evening Adhkar) or usage frequency.
8. **Storage Backups:** Seamless JSON backup files export/import capabilities for data restoration.
9. **Full PWA Offline Support:** Installable stand-alone icon on mobile homescreens with service-worker Cache-First request routing.
10. **Chrome Extension (Toolbar Popup):** Packaged unpacked extension that lets you click, open a sleek mobile-sized popup, and start counting instantly without browsing the web version.

---

## 🏗️ Folder & File Layout

```text
├── extension/              # Pre-compiled, ready-to-deploy Chrome Extension (Manifest V3)
│   ├── assets/             # Compiled production bundles (JS/CSS)
│   ├── favicon.png         # Extension icon
│   ├── index.html          # Popup entry HTML
│   └── manifest.json       # Chrome Extension Manifest V3 configuration
├── public/                 # Static web PWA assets
│   ├── favicon.png
│   ├── manifest.json       # Web PWA manifest schema
│   └── sw.js               # Service Worker script
├── src/                    # React Source Code
│   ├── assets/             # Branding and icons
│   ├── components/         # Presentation elements
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── IslamicPattern.tsx  # Dynamic SVG Islamic geometric background star pattern
│   │   ├── TargetProgress.tsx  # Circular SVG progress circle with glowing overlays
│   │   └── Confetti.tsx        # CSS requestAnimationFrame physics particle explosion
│   ├── db/                 # Dexie.js IndexedDB schema and operations
│   │   ├── db.ts               # Core DB instance, tables configuration, and templates
│   │   └── queries.ts          # CRUD helper functions for profiles, tasbihs, and reset
│   ├── hooks/              # Custom React hooks
│   │   └── useKeyboard.ts      # Hotkey listener abstraction
│   ├── screens/            # Application routed interfaces
│   │   ├── ProfileScreen.tsx   # PIN locked screen and user switching
│   │   ├── DashboardScreen.tsx # Single Mode counting and Smart Suggestions
│   │   ├── MultiModeScreen.tsx # 3x3 Grid counters with interactive remapping triggers
│   │   ├── TasbihListScreen.tsx# Catalog CRUD, Arabic inputs, and category filters
│   │   ├── AnalyticsScreen.tsx # Weekly SVG trend graph and streak metrics
│   │   └── SettingsScreen.tsx  # Themes, haptics, and JSON export/import actions
│   ├── store/              # Redux Slices
│   │   ├── index.ts            # Combines all store reducers
│   │   ├── profileSlice.ts     # Profile switching, authentication, and actions
│   │   ├── tasbihSlice.ts      # Catalog sync
│   │   ├── counterSlice.ts     # Active counting registers & keyboard map registries
│   │   ├── analyticsSlice.ts   # History list and daily summaries calculations
│   │   └── settingsSlice.ts    # Themes, haptic registers, and mode toggles
│   ├── utils/              # Helper functions
│   │   ├── date.ts             # Local timezone date conversions
│   │   └── backup.ts           # JSON serialization and database imports
│   ├── App.tsx             # Main shell, date checker, and floating navigation bar
│   ├── index.css           # Tailwind base styles and @theme keyframe register
│   ├── main.tsx            # App mounting & PWA registration
│   └── registerSW.ts       # SW registration trigger
├── package.json            # Scripts & project dependencies
├── vite.config.ts          # Vite build config
├── build-extension.js      # Custom Chrome Extension packaging compiler script
└── README.md
```

---

## 🧩 Chrome Extension Setup & Installation

The Al-Dhikr project is pre-packaged with a pre-compiled, ready-to-use Chrome Extension. You can install it directly in Google Chrome without running any compile scripts!

### 📥 1. Installing the Pre-built Extension
To load the extension in Google Chrome in developer mode:
1. Open Google Chrome.
2. In the URL address bar, enter `chrome://extensions/` and press **Enter**.
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file explorer, navigate to this project folder, select the `extension` directory, and click **Open/Select**.
   *(Path: `/home/sabbir/projects/react/tasbih/extension`)*
6. Click the Extensions (puzzle piece) icon in your Chrome toolbar, find **Al-Dhikr - Smart Digital Tasbih**, and click the **Pin** icon next to it.
7. Click the icon in your toolbar and start counting! 🎉

---

## 🛠️ Developer Guide: Rebuilding & Updating

If you edit any components, state, or designs inside the main React project and want to update your Chrome Extension, we have built a custom Node compiler pipeline to package and reload it automatically.

### Rebuild Script
Run the dedicated extension bundler in the root folder:
```bash
npm run build:extension
```
This runs the React + Tailwind production build, wipes the `extension` folder clean, transfers the compiled assets, and automatically generates the updated Manifest V3 schema and icons.

### Updating Chrome
After running the script, go to `chrome://extensions/` and click the **Reload** (circular arrow) icon on the **Al-Dhikr** card. Your extension will instantly be refreshed with the new features!

### ⚙️ How it Works under the Hood
* **Locked Dimensions:** To match the exact pixel layout of a premium mobile experience, `App.tsx` checks for the extension environment (`chrome.runtime.id`) on mount and injects an `is-extension` class. This locks the dimensions to **420px width** and **600px height** with custom scroll bounds.
* **Service Worker Bypass:** Standard Progressive Web App service workers are incompatible with extension popups. The system automatically detects the extension runtime and cleanly skips registrations.
* **Isolated IndexedDB Sandbox:** The Chrome Extension runs in a sandboxed extension context. This means your extension's counts, user profiles, and histories are saved in Chrome's dedicated sandbox storage, keeping your extension data safe, fast, and completely offline.

---

## 🗄️ IndexedDB Storage Schema (Dexie.js)

The application utilizes **Dexie.js** for high-performance database queries. Below are the registered schemas (`src/db/db.ts`):

* **`profiles`:** `++id, name, createdAt`
  * Represents separate local user accounts.
  * `pinLock` is stored securely as a 4-digit code (null if unsecured).
* **`tasbihs`:** `++id, profileId, name, category, isPreloaded`
  * Dhikr catalog. Includes transliterated `name`, `arabicText` (styled in Noto Naskh), `translation`, and standard target count.
* **`counterStates`:** `++id, profileId, tasbihId, lastUpdated`
  * Active counters tracking current counts, sessions, and adjusted targets.
* **`historyRecords`:** `++id, profileId, tasbihId, dateStr, timestamp`
  * Completed records archived on date change (`YYYY-MM-DD`).
* **`dailySummaries`:** `++id, profileId, dateStr`
  * Aggregate daily details logging `totalCount`, `completedGoalsCount`, and active consecutive `streak`.

---

## 🧠 Redux State Architecture

Global state is normalized into separated slices and synced with IndexedDB asynchronously (`src/store/`):

1. **`profiles`:** Manages the active profile, auth PIN padlock keypresses, and profile additions.
2. **`tasbihs`:** Memory cache of the active user's catalog to avoid repetitive db lookups.
3. **`counters`:** Coordinates single and multi-mode counters and contains keybinding customizers.
4. **`analytics`:** Distills history lists and summaries for rendering custom charts.
5. **`settings`:** Watches local settings: theme (`light` | `dark` | `system`), haptic vibrate, and active mode.

---

## ⚙️ How Daily Resets & Streaks Work

1. **Local Midnight Polling:** A background interval in `App.tsx` polls the local clock every 30 seconds.
2. **Archival:** If the date changes, a transactional query resets all active `counterStates.currentCount` to `0`, archives their previous values to `historyRecords`, checks if goals were met, and recalculates the user's active streak.
3. **Streak Criteria:** A daily streak is incremented if the user met at least 1 active dhikr target during the day. If a day is missed, the streak resets to `0`.

---

## ⌨️ Keyboard Shortcuts

* **Single Mode:**
  * `Space` / `Enter` / `ArrowUp` ➡️ Increment active count by `1`.
  * `Ctrl + ArrowDown` ➡️ Decrement count by `1`.
* **Multi Mode (3x3 Grid):**
  * Default Hotkeys: `q`, `w`, `e` (Row 1), `a`, `s`, `d` (Row 2), `z`, `x`, `c` (Row 3) ➡️ Increments corresponding counters.
  * Remapping: Click the keybinding button inside any grid card, press any key, and it updates instantly.
  * Toggle **Decrement Mode** inside toolbar to count backwards.

---

## 🚀 How to Run & Build

### Development Server:
```bash
npm run dev
```

### Production Web Build (Compiles TS and outputs optimized stand-alone files):
```bash
npm run build
```

---

## 📝 Guide for Future Agent Extensions (Sync / API Integrations)

If you are a future AI developer or agent looking to add remote synchronization, follow these steps:
1. **API Integration Hook:** In `src/db/queries.ts`, look for database transactions. You can add a `syncStatus` flag to tables.
2. **Redux Synchronization Slices:** Write a new thunk inside `src/store/` that reads un-synced entries and POSTs them to your backend, then updates local Dexie flags.
3. **Haptic Customization:** To expand tactile patterns, adjust the values passed to `navigator.vibrate([pattern])` inside `src/screens/DashboardScreen.tsx` and `src/screens/MultiModeScreen.tsx`.
