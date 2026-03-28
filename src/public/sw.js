// StudyGuard Service Worker - Cache tĩnh cho trải nghiệm mượt
const CACHE_NAME = 'studyguard-v2';
const STATIC_ASSETS = [
    '/',
    '/css/common.css',
    '/css/landing.css',
    '/css/auth.css',
    '/css/dashboard.css',
    '/css/student.css',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/student.js',
    '/js/admin.js',
    '/login',
    '/register',
    '/student',
    '/dashboard',
    '/admin'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: Network first, fallback to cache (API calls always go to network)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bỏ qua socket.io và API calls
    if (url.pathname.startsWith('/socket.io') || url.pathname.startsWith('/api/')) {
        return;
    }
    
    // CSS/JS static files: cache first
    if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                }))
        );
        return;
    }
    
    // HTML pages: network first, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
