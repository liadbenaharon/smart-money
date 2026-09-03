const CACHE='smart-money-v0465-pwa-diagnostics';
const APP_SHELL=['/smart-money/','/smart-money/index.html','/smart-money/style.css','/smart-money/v040.css','/smart-money/app.js?v=046','/smart-money/undo-timeout.js?v=0461','/smart-money/recurring-fix.js?v=046','/smart-money/v040-features.js?v=046','/smart-money/salary-sync.js?v=046','/smart-money/pwa-install-debug.js?v=1','/smart-money/manifest.json?v=icon5','/smart-money/version.json','/smart-money/smart-money-icon-192-samsung.png?v=5','/smart-money/smart-money-icon-512-samsung.png?v=5'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async url=>{try{await cache.add(url)}catch(e){console.warn('Cache skip',url,e)}}));
  })());
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return (await caches.match('/smart-money/index.html'))||Response.error();
    return Response.error();
  }));
});