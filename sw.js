// Nombre del caché para la aplicación Puro Dulce (incrementar versión si se actualizan recursos)
const CACHE_NAME = 'puro-dulce-cache-v1';

// Archivos locales que se guardarán en caché para el acceso sin conexión (Offline)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './image_15328d.png',
  './image_151f68.jpg',
  './image_152365.png'
];

// Evento de instalación: Almacena en caché la interfaz de usuario (App Shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Almacenando recursos estáticos en caché');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento de activación: Limpia cachés antiguos de versiones previas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché obsoleto:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento de recuperación (Fetch): Estrategia "Cache First" con caída a Red
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes que no sean de tipo GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si el recurso está en el caché, lo devuelve inmediatamente
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no está, lo solicita a la red
        return fetch(event.request).then((networkResponse) => {
          // Validar que la respuesta sea correcta antes de guardarla en el caché
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clonar la respuesta para guardarla en el caché dinámicamente
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      }).catch(() => {
        // Retorno de contingencia offline si el usuario busca el HTML principal sin red
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      })
  );
});