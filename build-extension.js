import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const extensionDir = path.join(__dirname, 'extension');

console.log('🚀 Starting Al-Dhikr Chrome Extension build process...');

// 1. Run standard Vite build
try {
  console.log('📦 Compiling React and Tailwind assets via Vite...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Vite build completed successfully.');
} catch (error) {
  console.error('❌ Vite build failed:', error.message);
  process.exit(1);
}

// 2. Clean/Create extension directory
if (fs.existsSync(extensionDir)) {
  console.log('🧹 Cleaning existing extension directory...');
  fs.rmSync(extensionDir, { recursive: true, force: true });
}
fs.mkdirSync(extensionDir, { recursive: true });

// 3. Copy files recursively from dist to extension
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('🗂️ Copying built files to extension directory...');
copyFolderSync(distDir, extensionDir);
console.log('✅ Copied all build files.');

// 4. Overwrite manifest.json with Chrome Extension Manifest V3 configuration
const manifestV3 = {
  "manifest_version": 3,
  "name": "Al-Dhikr - Smart Digital Tasbih",
  "short_name": "Al-Dhikr",
  "version": "1.0.0",
  "description": "Offline-first smart digital Tasbih counter with multi-profile locking, automated streaks, and local backups.",
  "action": {
    "default_popup": "index.html",
    "default_icon": "favicon.png"
  },
  "icons": {
    "16": "favicon.png",
    "48": "favicon.png",
    "128": "favicon.png"
  },
  "permissions": [
    "storage"
  ]
};

const manifestPath = path.join(extensionDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestV3, null, 2), 'utf-8');
console.log('📝 Created Manifest V3 (manifest.json) for Chrome Extension.');

console.log('🎉 Chrome Extension is fully built and ready!');
console.log('👉 To load in Chrome: Go to chrome://extensions/, enable Developer Mode, click "Load unpacked", and select:', extensionDir);
