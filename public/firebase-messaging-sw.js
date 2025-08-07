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
if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}
console.log('[firebase-messaging-sw.js] Firebase initialized');

const messaging = firebase.messaging();

// Handle background messages (data-only payloads supported)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  const title = payload.data?.title || payload.notification?.title || 'Buzzy Notification';
  const body = payload.data?.body || payload.notification?.body || '';
  const icon = '/android/android-launchericon-192-192.png';
  const badge = '/android/android-launchericon-48-48.png';
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
      { action: 'open', title: 'Open App', icon: badge },
      { action: 'close', title: 'Dismiss', icon: badge }
    ],
    timestamp: Date.now(),
    dir: 'auto',
    lang: 'en'
  };

  self.registration.showNotification(title, options);
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

// Note: PWA caching is handled by the main VitePWA service worker. This messaging SW
// focuses solely on Firebase Messaging events to avoid conflicts with the app SW.

// Remove raw push handler to avoid duplication; onBackgroundMessage is sufficient

// Support skip waiting from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[firebase-messaging-sw.js] SKIP_WAITING received');
    self.skipWaiting();
  }
});
