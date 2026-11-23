/* Fit Coach — service worker. Aumenta VERSION a ogni aggiornamento dell'app. */
const VERSION = "fitcoach-v2";
const CORE = ["./", "index.html", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
  "img/avatar-160.png", "img/avatar.png", "piani/losavio-7giorni.json", "ex/index.json",
  "vendor/jspdf.umd.min.js", "vendor/zxing.min.js", "vendor/pdf.min.js", "vendor/pdf.worker.min.js",
  "vendor/xlsx.full.min.js", "vendor/mammoth.browser.min.js"];
const RUNTIME = VERSION + "-dati";
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
  // scarica in sottofondo tutta la libreria esercizi, così funziona anche offline
  e.waitUntil(caches.open(RUNTIME).then(async c => { for (let i = 0; i < 32; i++) { const u = "ex/s" + i + ".json"; try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } catch(err) {} } }));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === "navigate") { e.respondWith(caches.match("index.html").then(r => r || fetch(req))); return; }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    if (res.ok && /\/ex\/s\d+\.json$/.test(url.pathname)) { const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
    return res;
  })));
});
