// Keeps the app working at the gym without signal: network first, cached copy as fallback
const CACHE="workout-v19";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./apple-touch-icon.png","./css/app.css","./js/data.js","./js/photos.js","./js/google.js","./js/health.js","./js/app.js","./js/gym.js"])));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET"||new URL(req.url).origin!==location.origin||/\.mp4$/.test(new URL(req.url).pathname))return; // video uses range requests: always from the network
  e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r;})
    .catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));
});
