const CACHE_NAME="ai-office-v1";
const ASSETS=["/","/static/index.html","/static/style.css","/static/app.js","/static/scene.js","/static/office.js","/static/worker.js","/static/manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS).catch(()=>{})));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(n=>Promise.all(n.filter(x=>x!==CACHE_NAME).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.url.includes("/ws")||e.request.url.includes("/api/"))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
