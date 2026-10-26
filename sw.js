/* Service worker: l'app si apre anche senza rete. */
const V="officina-v4";
const SHELL=["./","index.html","manifest.webmanifest","config.js","vendor/lucide.min.js","vendor/three.min.js","vendor/cannon.min.js",
 "icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-icon.png","icons/favicon-64.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET")return;
  // Firestore e accesso parlano direttamente col server: niente cache qui (Firestore ha la sua)
  if(/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/(identity|v1)/.test(u.href))return;
  // pagina: prima la rete (per gli aggiornamenti), poi la copia salvata
  if(r.mode==="navigate"||u.pathname.endsWith("/index.html")){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put("index.html",c));return res}).catch(()=>caches.match("index.html")));return}
  // librerie Firebase e font: copia salvata subito, aggiornata in background
  if(/gstatic\.com|fonts\.googleapis\.com/.test(u.host)){
    e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}).catch(()=>hit);return hit||net}));return}
  // file dell'app: copia salvata, altrimenti rete
  if(u.origin===location.origin)e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res})));
});
