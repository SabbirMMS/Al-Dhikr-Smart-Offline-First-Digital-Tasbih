# Al-Dhikr – Smart Digital Tasbih & Dhikr Counter

An **offline‑first**, mobile‑friendly **Progressive Web App (PWA)** that also ships as a **Chrome Extension**. The app lets you keep multiple profiles, count dhikr with beautiful glass‑morphism UI, see streaks and analytics, and works 100 % offline using **IndexedDB (Dexie.js)**.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| **Multi‑Profile System** | PIN‑protected local profiles stored in IndexedDB |
| **Pre‑loaded & Custom Tasbih Library** | Arabic text, transliteration (pronunciation), translation and target count |
| **Single‑Mode Counter** | Large glowing progress ring, micro‑animations and confetti bursts |
| **Multi‑Mode Grid** | 3×3 configurable hot‑keys (`q‑c`), independent counters, decrement mode |
| **Streak & Daily Reset** | Automatic midnight reset, history archiving and gold‑fire streak icon |
| **Analytics Dashboard** | 7‑day SVG bar‑chart & donut breakdowns (no heavy chart libraries) |
| **Smart Dhikr Suggestions** | Contextual suggestions based on time‑of‑day and usage frequency |
| **Backup / Restore** | Export / import JSON snapshots of the whole database |
| **Full PWA Offline Support** | Installable on mobile, service‑worker cache‑first strategy |
| **Chrome Extension Popup** | Same UI, fixed‑size 420 × 600 px, works without service workers |

---

## 📁 Project Layout

```
├── extension/                # Pre‑built Chrome Extension (Manifest V3)
│   ├── assets/               # Compiled JS / CSS bundles
│   ├── favicon.png            # Extension icon
│   ├── index.html             # Popup page entry point
│   └── manifest.json          # Chrome Extension manifest
├── public/                   # PWA static assets
│   ├── favicon.png
│   ├── manifest.json
│   └── sw.js
├── src/                      # React source code
│   ├── assets/               # Branding & icons
│   ├── components/           # UI components (Button, Card, Modal, …)
│   ├── db/                   # Dexie schema & helper queries
│   ├── hooks/                # Custom React hooks
│   ├── screens/              # App pages (Profile, Dashboard, Multi‑Mode, …)
│   ├── store/                # Redux Toolkit slices
│   ├── utils/                # Helper functions (date, backup)
│   ├── App.tsx               # Root component + navigation + extension detection
│   ├── index.css             # Tailwind + custom CSS (glass‑panel, scrollbars)
│   ├── main.tsx              # ReactDOM mount & PWA registration
│   └── registerSW.ts         # Service‑worker registration (skipped in extension)
├── build-extension.js        # Node script that builds the Chrome Extension bundle
├── package.json              # NPM scripts & dependencies
├── vite.config.ts            # Vite configuration
└── README.md                 # **You are reading it!**
```

---

## 🔧 Development & Build

### 1. Run the web app locally (development server)
```bash
npm install          # Install dependencies (run once after cloning)
npm run dev          # Starts Vite dev server at http://localhost:5173
```

### 2. Create a production web build (PWA ready)
```bash
npm run build        # Produces `dist/` with minified assets and service‑worker
```
The `dist/` folder can be served by any static web server or uploaded to a hosting provider.

---

## 🧩 Chrome Extension

The repository already contains a **pre‑compiled, ready‑to‑load** unpacked Chrome Extension in the `extension/` folder. You can load it directly **without building** (perfect for quick testing).

### 2‑Step Installation (pre‑built)
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top‑right toggle).
3. Click **Load unpacked** → select the `extension` directory:
   ```text
   /home/sabbir/projects/react/tasbih/extension
   ```
4. Pin the extension from the puzzle‑piece menu and click the toolbar icon to start counting.

### Building the extension yourself (optional)
If you modify UI, add new fields (e.g., the `pronunciation` column added to the Tasbih schema) or change any assets, rebuild the extension with the custom script:
```bash
npm run build:extension   # runs Vite, copies `dist/` into `extension/` and rewrites manifest
```
The script performs the following steps:
1. **Runs `npm run build`** – creates an optimized PWA bundle in `dist/`.
2. **Cleans the existing `extension/` folder** and copies the freshly compiled assets.
3. **Generates `manifest.json`** (Manifest V3) that points to `index.html` and includes the icon.
4. **Adds the `is-extension` CSS class** (via `App.tsx`) so the popup is locked to **420 × 600 px** and disables the PWA service‑worker.
5. Prints a friendly console message with the absolute path of the ready‑to‑load folder.

After rebuilding, repeat the **Load unpacked** step (or click the **Reload** button on the extension card) to see your changes.

---\n
## 📚 Database Schema (Dexie.js)

The `src/db/db.ts` file defines the IndexedDB tables. The new field **`pronunciation`** (Latin transliteration) was added to the `Tasbih` interface and is now present in all pre‑loaded templates.

```ts
export interface Tasbih {
  id?: number;
  profileId: number;
  name: string;
  arabicText?: string;
  /** Latin transliteration – helps users read the Arabic phrase */
  pronunciation?: string;
  translation?: string;
  category?: string;
  defaultTarget: number;
  isPreloaded: boolean;
  createdAt: Date;
}
```
All CRUD helpers (`src/db/queries.ts`) automatically copy this property when creating or updating a tasbih, so the UI and the extension display the transliteration across **Home**, **Multi‑Mode**, and **Library** screens.

---

## 📖 Updating UI to Show `pronunciation`
The React components that render a tasbih item now include a small line showing the pronunciation underneath the Arabic text. The same component is used by both the web app and the extension, ensuring a **pixel‑perfect** experience.

---

## 🏁 Quick Recap
* **Web PWA** – `npm run dev` / `npm run build`
* **Pre‑built Chrome Extension** – load `extension/` in Chrome Dev‑mode.
* **Re‑build Extension after changes** – `npm run build:extension`.
* **New `pronunciation` field** – stored in IndexedDB, displayed everywhere, and included in the pre‑loaded templates.

Enjoy your offline‑first Tasbih experience on the web **or** directly from the Chrome toolbar! 🎉
