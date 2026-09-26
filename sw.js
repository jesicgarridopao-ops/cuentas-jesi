// Service worker de Cuentas de Jesi: guarda la app en el celu para que abra sin conexión.
// Si cambiás index.html, subí el número de versión para que el celu tome la nueva.
const VERSION = "cuentas-v3";
const LOCALES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
const CHART = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(LOCALES).then(() => c.add(CHART).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.includes("script.google") || url.hostname.includes("googleusercontent")) return;
  if (url.origin === location.origin) {
    // primero la red (para tomar cambios), si no hay conexión, lo guardado
    e.respondWith(fetch(req).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else {
    // librerías y tipografías: primero lo guardado
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === "opaque") { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return res; })));
  }
});
