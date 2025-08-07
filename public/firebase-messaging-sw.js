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
  const title = payload.notification?.title || 'Buzzy Notification';
  const body = payload.notification?.body || '';
  const icon = payload.notification?.icon || '/android/android-launchericon-192-192.png';
  const badge = payload.notification?.badge || '/android/android-launchericon-48-48.png';
  const data = payload.data || {};

  const options = {
    body,
    icon,
    badge,
    data,
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
    lang: 'en'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
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
      // (Optional) Clean up old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== 'buzzy-cache-v1')
            .map((key) => caches.delete(key))
        )
      )
    ])
  );
});

// Optional: handle raw push events
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event', event);
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (err) {
      console.error('[firebase-messaging-sw.js] Push data JSON parse error', err);
    }

    const title = data.title || 'Buzzy Notification';
    const options = {
      body: data.body || '',
      icon: data.icon || '/android/android-launchericon-192-192.png',
      badge: data.badge || '/android/android-launchericon-48-48.png',
      data: data.data || {},
      requireInteraction: true,
      tag: 'buzzy-push-notification',
      renotify: true,
      vibrate: [200, 100, 200]
    };

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
