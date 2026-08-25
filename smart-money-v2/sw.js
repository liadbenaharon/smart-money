const CACHE='smart-money-v2-clean-3';
const SHELL=['./','./index.html','./manifest.json','./style.css','../app.js','../recurring-fix.js','../v030-features.js','../icon-192-v2.png','../icon-512-v2.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));});