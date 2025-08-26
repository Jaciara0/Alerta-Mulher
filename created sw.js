// Service Worker for FoodExpress Emergency App
const CACHE_NAME = 'foodexpress-v1.0.0';
const STATIC_CACHE_NAME = 'foodexpress-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'foodexpress-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Serve from cache
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache if not successful
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Cache dynamic content
                        if (shouldCacheDynamically(request)) {
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('Network request failed:', error);
                        
                        // Return offline fallback for navigation requests
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return a custom offline response
                        return new Response(
                            JSON.stringify({ 
                                error: 'Offline', 
                                message: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.' 
                            }), {
                                headers: { 'Content-Type': 'application/json' },
                                status: 503
                            }
                        );
                    });
            })
    );
});

// Determine if a request should be cached dynamically
function shouldCacheDynamically(request) {
    const url = new URL(request.url);
    
    // Cache API responses for emergency data
    if (url.pathname.includes('/api/')) {
        return true;
    }
    
    // Cache external resources
    if (url.origin !== self.location.origin) {
        return true;
    }
    
    // Don't cache real-time data
    if (url.pathname.includes('/realtime/') || url.pathname.includes('/location/')) {
        return false;
    }
    
    return false;
}

// Background Sync for emergency alerts when back online
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'emergency-alert-sync') {
        event.waitUntil(syncEmergencyAlerts());
    }
});

// Function to sync emergency alerts when back online
async function syncEmergencyAlerts() {
    try {
        // Get pending emergency alerts from IndexedDB or localStorage
        const pendingAlerts = await getPendingEmergencyAlerts();
        
        for (const alert of pendingAlerts) {
            try {
                // Send alert to server
                const response = await fetch('/api/emergency-alert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(alert)
                });
                
                if (response.ok) {
                    // Remove from pending queue
                    await removePendingAlert(alert.id);
                    console.log('Emergency alert synced successfully:', alert.id);
                }
            } catch (error) {
                console.error('Failed to sync emergency alert:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Helper function to get pending emergency alerts
async function getPendingEmergencyAlerts() {
    // In a real implementation, this would read from IndexedDB
    // For now, return empty array
    return [];
}

// Helper function to remove pending alert
async function removePendingAlert(alertId) {
    // In a real implementation, this would remove from IndexedDB
    console.log('Removing pending alert:', alertId);
}

// Push notification handler for emergency responses
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    let notificationData = {
        title: 'FoodExpress',
        body: 'Nova notificação',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'default',
        requireInteraction: false,
        silent: false
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
            
            // Handle emergency notifications differently
            if (data.type === 'emergency-response') {
                notificationData.requireInteraction = true;
                notificationData.actions = [
                    {
                        action: 'view',
                        title: 'Ver Detalhes'
                    },
                    {
                        action: 'call',
                        title: 'Ligar Agora'
                    }
                ];
            }
        } catch (error) {
            console.error('Failed to parse push notification data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data || {};
    
    if (action === 'call' && notificationData.phoneNumber) {
        // Open dialer with emergency number
        event.waitUntil(
            clients.openWindow(`tel:${notificationData.phoneNumber}`)
        );
    } else if (action === 'view' || !action) {
        // Open the app
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // If app is already open, focus it
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin)) {
                            return client.focus();
                        }
                    }
                    
                    // If app is not open, open it
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
    
    // Track notification close for analytics
    if (event.notification.data && event.notification.data.trackClose) {
        // Send analytics event
        fetch('/api/analytics/notification-close', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notificationId: event.notification.data.id,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.error('Failed to track notification close:', error);
        });
    }
});

// Handle app shortcuts
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'EMERGENCY_ALERT') {
        // Handle emergency alert message
        const alertData = event.data.payload;
        
        // Store alert for background sync if offline
        if (!navigator.onLine) {
            storePendingAlert(alertData);
            
            // Register for background sync
            self.registration.sync.register('emergency-alert-sync')
                .catch(error => {
                    console.error('Failed to register background sync:', error);
                });
        }
    }
});

// Helper function to store pending alert
function storePendingAlert(alertData) {
    // In a real implementation, this would store in IndexedDB
    console.log('Storing pending alert for sync:', alertData);
}

// Error handler
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});
