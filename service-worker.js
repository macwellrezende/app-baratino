// Service Worker do Baratino FC
// Só cuida do "esqueleto" do app (o HTML/JS/CSS em si), pra permitir
// a instalação como PWA e abrir mais rápido / funcionar offline.
// Dados vindos do Supabase (jogadores, presença, votação) NUNCA
// passam pelo cache — sempre vão direto pra rede, senão a tela
// mostraria informação desatualizada sem avisar ninguém.

const CACHE_NAME = 'baratino-fc-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add('./'))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cacheia chamadas pro Supabase (dados sempre atualizados).
  if (event.request.url.includes('supabase.co')) return;
  // Só intercepta requisições GET (POST/PUT etc. não são cacheáveis).
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const clone = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});
