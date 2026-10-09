// Rebaja.uy: permite instalarla como app y abrirla rápido, incluso sin señal.
// Siempre intenta traer lo más nuevo de internet; si no hay conexión, usa la última copia guardada.
const CACHE = "rebaja-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                      // los contadores (POST) van directo
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const descuentos = url.hostname.endsWith(".supabase.co") && url.pathname.includes("/rest/v1/descuentos");
  const fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !descuentos && !fuentes) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copia = res.clone();
          const clave = req.mode === "navigate" ? "./" : req;
          caches.open(CACHE).then(c => c.put(clave, copia));
        }
        return res;
      })
      .catch(() =>
        caches.match(req.mode === "navigate" ? "./" : req, { ignoreSearch: req.mode === "navigate" })
          .then(r => r || (req.mode === "navigate" ? caches.match("./") : Response.error()))
      )
  );
});
