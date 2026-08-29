const CACHE='little-moments-v36';
const ASSETS=['./','./index.html','./styles.css','./home-fit.css','./moments-controls.css','./app.js','./version-badge.js','./moments-controls.js','./db.js','./manifest.webmanifest','./lm%20background.png','./lm%20camera.png','./lm%20moments.png','./lm%20scrapbook.png','./assets/home-moments.svg','./assets/home-portfolio.svg','./assets/home-botanical.svg','./assets/home-empty-moments.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});
