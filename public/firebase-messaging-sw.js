/* eslint-env serviceworker */
/* global firebase, importScripts */

// Firebase messaging service worker for background notifications
console.log('[firebase-messaging-sw.js] loading…');

// Load Firebase libraries (compat v9)
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');
console.log('[firebase-messaging-sw.js] Firebase libraries imported');

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyBmbqYQiEERc8xGn81TYcbHkErB468dDKE',
  authDomain: 'buzzy-d2b2a.firebaseapp.com',
  projectId: 'buzzy-d2b2a',
  storageBucket: 'buzzy-d2b2a.appspot.com',
  messagingSenderId: '512369963479',
  appId: '1:512369963479:web:babd61d660cbd32beadb92'
};

// Initialize Firebase app in the service worker
firebase.initializeApp(firebaseConfig);
console.log('[firebase-messaging-sw.js] Firebase initialized');

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // Extract notification data with proper fallbacks
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  // Use data fields as fallback for title and body if notification object is missing
  const title = notification.title || data.title || 'Buzzy Notification';
  const body = notification.body || data.body || '';
  const icon = notification.icon || data.icon || '/android/android-launchericon-192-192.png';
  const badge = notification.badge || data.badge || '/android/android-launchericon-48-48.png';

  console.log('[firebase-messaging-sw.js] Showing notification:', { title, body, icon, badge });

  const options = {
    body,
    icon,
    badge,
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    requireInteraction: true,
    tag: 'buzzy-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: badge
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: badge
      }
    ],
    timestamp: Date.now(),
    dir: 'auto',
    lang: 'en',
    silent: false
  };

  // Show the notification
  return self.registration.showNotification(title, options);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  event.notification.close();

  const openApp = () => {
    return clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(self.location.origin + '/');
      });
  };

  if (event.action === 'open' || !event.action) {
    event.waitUntil(openApp());
  }
});

// Force immediate activation on install
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Install event');
  self.skipWaiting();
});

// Claim clients immediately after activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Activate event');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== 'buzzy-cache-v1' && key !== 'buzzy-offline-v1')
            .map((key) => caches.delete(key))
        )
      )
    ])
  );
});

// Enhanced fetch handler for offline support
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase-specific requests (they have their own caching)
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }

  // Handle app shell and static assets
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.open('buzzy-offline-v1').then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Return cached version
            return response;
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Return offline fallback for HTML requests
            if (event.request.destination === 'document') {
              return cache.match('/index.html');
            }
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
    );
  }
});

// Handle raw push events (fallback for older browsers)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event', event);
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (err) {
      console.error('[firebase-messaging-sw.js] Push data JSON parse error', err);
      // Try to parse as text
      try {
        data = { body: event.data.text() };
      } catch (textErr) {
        console.error('[firebase-messaging-sw.js] Push data text parse error', textErr);
        data = { body: 'New notification' };
      }
    }

    const title = data.title || data.notification?.title || 'Buzzy Notification';
    const body = data.body || data.notification?.body || data.message || '';
    const icon = data.icon || data.notification?.icon || '/android/android-launchericon-192-192.png';
    const badge = data.badge || data.notification?.badge || '/android/android-launchericon-48-48.png';

    const options = {
      body,
      icon,
      badge,
      data: data.data || {},
      requireInteraction: true,
      tag: 'buzzy-push-notification',
      renotify: true,
      vibrate: [200, 100, 200],
      silent: false
    };

    console.log('[firebase-messaging-sw.js] Showing push notification:', { title, body });
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Support skip waiting from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[firebase-messaging-sw.js] SKIP_WAITING received');
    self.skipWaiting();
  }
});
