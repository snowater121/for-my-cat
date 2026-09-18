/* GEO ARCADE 서비스워커 — build_all.py가 __BUILD__를 채워 ../sw.js로 쓴다.
   HTML은 '네트워크 먼저'(새 버전이 바로 보이게), 폰트·이미지는 '캐시 먼저'(오프라인에서도 동작). */
const CACHE = "geo-arcade-__BUILD__";
const CORE = ["./", "index.html", "arcade.html", "specialty.html", "manifest.webmanifest",
              "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("geo-arcade-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (url.origin === location.origin && isPage) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  const cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
