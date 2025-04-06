/**
 * Service Worker for Plate Order System
 * Enables offline functionality and improves performance
 */

// Cache name with version
const CACHE_NAME = 'plate-order-system-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/static/css/design-system.css',
  '/static/js/main.js',
  '/static/js/components/voice/VoiceRecorder.js',
  '/static/js/components/voice/AudioVisualizer.js',
  '/static/img/favicon.png',
  '/static/img/favicon.ico',
  '/static/img/apple-touch-icon.png',
  '/static/manifest.json',
  '/static/fonts/inter-var.woff2',
  '/offline'
];

// Install event - precache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Precache assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser-sync and socket.io requests
  if (event.request.url.includes('browser-sync') || 
      event.request.url.includes('socket.io')) return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    // For API requests, use network first, then offline fallback
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline');
        })
    );
    return;
  }
  
  // For HTML requests, use network first, then cache
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, serve from cache or offline page
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/offline');
            });
        })
    );
    return;
  }
  
  // For other requests, use cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the response
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // For image requests, return a placeholder
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/static/img/placeholder.png');
            }
            
            // For other requests, just propagate the error
            throw error;
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  }
  
  const title = notificationData.title || 'Plate Order System';
  const options = {
    body: notificationData.body || 'New update available',
    icon: '/static/img/notification-icon.png',
    badge: '/static/img/notification-badge.png',
    data: notificationData.data || {},
    actions: notificationData.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  // Handle notification click
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Sync event - handle background sync
self.addEventListener('sync', event => {
  console.log('[Service Worker] Sync event:', event);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Function to sync pending orders
async function syncOrders() {
  try {
    // Open IndexedDB
    const db = await openOrdersDB();
    
    // Get pending orders
    const pendingOrders = await getPendingOrders(db);
    
    // Process each pending order
    for (const order of pendingOrders) {
      try {
        // Send order to server
        const response = await fetch('/api/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          // Order synced successfully, remove from pending
          await removePendingOrder(db, order.id);
          
          // Show notification
          self.registration.showNotification('Order Synced', {
            body: 'Your order has been successfully synced with the server.',
            icon: '/static/img/notification-icon.png'
          });
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync order:', error);
        
        // Increment retry count
        await updatePendingOrder(db, order.id, {
          retryCount: (order.retryCount || 0) + 1,
          lastRetry: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing orders:', error);
  }
}

// IndexedDB functions
function openOrdersDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PlateOrderSystemDB', 1);
    
    request.onerror = event => {
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create pending orders store
      if (!db.objectStoreNames.contains('pendingOrders')) {
        const store = db.createObjectStore('pendingOrders', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function getPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingOrders'], 'readonly');
    const store = transaction.objectStore('pendingOrders');
    const request = store.getAll();
    
    request.onerror = event => {
      reject('Error getting pending orders');
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
  });
}

function removePendingOrder(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingOrders'], 'readwrite');
    const store = transaction.objectStore('pendingOrders');
    const request = store.delete(id);
    
    request.onerror = event => {
      reject('Error removing pending order');
    };
    
    request.onsuccess = event => {
      resolve();
    };
  });
}

function updatePendingOrder(db, id, updates) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingOrders'], 'readwrite');
    const store = transaction.objectStore('pendingOrders');
    const request = store.get(id);
    
    request.onerror = event => {
      reject('Error getting pending order for update');
    };
    
    request.onsuccess = event => {
      const order = event.target.result;
      
      // Apply updates
      Object.assign(order, updates);
      
      // Save updated order
      const updateRequest = store.put(order);
      
      updateRequest.onerror = event => {
        reject('Error updating pending order');
      };
      
      updateRequest.onsuccess = event => {
        resolve();
      };
    };
  });
}
