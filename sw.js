/**
 * Pesewa.com - Service Worker
 * Provides offline capabilities and caching for PWA
 */

'use strict';

const CACHE_NAME = 'pesewa-v1.0.0';
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/pages/dashboard.html',
    '/pages/groups.html',
    '/pages/lending.html',
    '/pages/borrowing.html',
    '/pages/ledger.html',
    '/pages/blacklist.html',
    '/pages/debt-collectors.html',
    // Icons
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    // External dependencies
    'https://cdnjs.cloudflare.com/ajax/libs/flag-icons/6.11.0/css/flag-icons.min.css',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-realtime-database.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app assets');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Install completed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation completed');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip Chrome extensions
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    // Skip Firebase and external analytics
    if (event.request.url.includes('firebase') || 
        event.request.url.includes('google-analytics') ||
        event.request.url.includes('gtag')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = networkResponse.clone();
                        
                        // Add to cache for future visits
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                console.log('[Service Worker] Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            })
                            .catch((error) => {
                                console.error('[Service Worker] Cache put error:', error);
                            });
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Network fetch failed:', error);
                        
                        // For HTML pages, return offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return generic offline response
                        return new Response(
                            JSON.stringify({
                                error: 'NetworkError',
                                message: 'You are offline. Please check your internet connection.',
                                offline: true
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'application/json'
                                })
                            }
                        );
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-registration') {
        event.waitUntil(syncPendingRegistrations());
    } else if (event.tag === 'sync-loan') {
        event.waitUntil(syncPendingLoans());
    }
});

// Sync pending registrations
async function syncPendingRegistrations() {
    try {
        const registrations = await getPendingRegistrations();
        
        for (const registration of registrations) {
            try {
                // Attempt to sync with server
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registration.data)
                });
                
                if (response.ok) {
                    // Remove from pending
                    await removePendingRegistration(registration.id);
                    console.log('[Service Worker] Synced registration:', registration.id);
                }
            } catch (error) {
                console.error('[Service Worker] Sync failed for registration:', registration.id, error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Background sync error:', error);
    }
}

// Sync pending loans
async function syncPendingLoans() {
    try {
        const loans = await getPendingLoans();
        
        for (const loan of loans) {
            try {
                // Attempt to sync with server
                const response = await fetch('/api/loans', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loan.data)
                });
                
                if (response.ok) {
                    // Remove from pending
                    await removePendingLoan(loan.id);
                    console.log('[Service Worker] Synced loan:', loan.id);
                }
            } catch (error) {
                console.error('[Service Worker] Sync failed for loan:', loan.id, error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Background sync error:', error);
    }
}

// Get pending registrations from IndexedDB
async function getPendingRegistrations() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pesewa-offline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('pendingRegistrations', 'readonly');
            const store = transaction.objectStore('pendingRegistrations');
            const getAllRequest = store.getAll();
            
            getAllRequest.onerror = () => reject(getAllRequest.error);
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingRegistrations')) {
                db.createObjectStore('pendingRegistrations', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('pendingLoans')) {
                db.createObjectStore('pendingLoans', { keyPath: 'id' });
            }
        };
    });
}

// Get pending loans from IndexedDB
async function getPendingLoans() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pesewa-offline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('pendingLoans', 'readonly');
            const store = transaction.objectStore('pendingLoans');
            const getAllRequest = store.getAll();
            
            getAllRequest.onerror = () => reject(getAllRequest.error);
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        };
    });
}

// Remove pending registration
async function removePendingRegistration(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pesewa-offline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('pendingRegistrations', 'readwrite');
            const store = transaction.objectStore('pendingRegistrations');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
        };
    });
}

// Remove pending loan
async function removePendingLoan(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pesewa-offline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('pendingLoans', 'readwrite');
            const store = transaction.objectStore('pendingLoans');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
        };
    });
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('[Service Worker] Failed to parse push data:', error);
        data = {
            title: 'Pesewa.com',
            body: 'You have a new notification',
            icon: '/icons/icon-192x192.png'
        };
    }
    
    const options = {
        body: data.body || 'New notification from Pesewa.com',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Pesewa.com', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window/tab open
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url || '/');
                }
            })
    );
});

// Periodic sync for background updates (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'update-cache') {
            console.log('[Service Worker] Periodic sync triggered');
            event.waitUntil(updateCache());
        }
    });
}

// Update cache with fresh content
async function updateCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        
        // Update static assets
        for (const asset of CACHE_ASSETS) {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                    console.log('[Service Worker] Updated cache for:', asset);
                }
            } catch (error) {
                console.error('[Service Worker] Failed to update cache for:', asset, error);
            }
        }
        
        console.log('[Service Worker] Cache update completed');
    } catch (error) {
        console.error('[Service Worker] Cache update failed:', error);
    }
}

// Handle message events from main thread
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_ASSETS') {
        cacheAdditionalAssets(event.data.assets);
    }
});

// Cache additional assets on demand
async function cacheAdditionalAssets(assets) {
    try {
        const cache = await caches.open(CACHE_NAME);
        
        for (const asset of assets) {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                    console.log('[Service Worker] Cached additional asset:', asset);
                }
            } catch (error) {
                console.error('[Service Worker] Failed to cache additional asset:', asset, error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Failed to cache additional assets:', error);
    }
}

// Health check endpoint for service worker
self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('/sw-health')) {
        event.respondWith(
            new Response(JSON.stringify({
                status: 'ok',
                version: '1.0.0',
                cacheName: CACHE_NAME,
                timestamp: new Date().toISOString()
            }), {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        );
    }
});

console.log('[Service Worker] Loaded successfully');