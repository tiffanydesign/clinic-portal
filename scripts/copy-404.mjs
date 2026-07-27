// GitHub Pages serves 404.html for any path it doesn't recognize as a real
// file -- which is every client-side route (e.g. /clinic-portal/feedback/2).
// Copying the built index.html to 404.html lets that fallback boot the same
// SPA; react-router then reads the real window.location.pathname and routes
// normally. Asset paths in index.html are already absolute (base:
// '/clinic-portal/'), so this works regardless of the deep-link's depth.
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const src = resolve(dist, "index.html");
const dest = resolve(dist, "404.html");

if (!existsSync(src)) {
  console.error(`copy-404: ${src} not found -- run the build first.`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log("copy-404: dist/index.html -> dist/404.html (GitHub Pages SPA deep-link fallback)");
