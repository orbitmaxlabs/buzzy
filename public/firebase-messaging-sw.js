/* eslint-env serviceworker */
/* global firebase importScripts */

// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBmbqYQiEERc8xGn81TYcbHkErB468dDKE',
  authDomain: 'buzzy-d2b2a.firebaseapp.com',
  projectId: 'buzzy-d2b2a',
  storageBucket: 'buzzy-d2b2a.firebasestorage.app',
  messagingSenderId: '512369963479',
  appId: '1:512369963479:web:babd61d660cbd32beadb92'
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/android/android-launchericon-192-192.png',
      badge: '/android/android-launchericon-48-48.png',
      data: payload.data || {},
      requireInteraction: true,
      tag: 'buzzy-notification',
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/android/android-launchericon-48-48.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/android/android-launchericon-48-48.png'
        }
      ],
      dir: 'auto',
      lang: 'en',
      timestamp: Date.now()
    };

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Handle service worker installation
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if needed
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== 'buzzy-cache-v1') {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Handle push events (for manual push notifications)
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const notificationTitle = data.title || 'New Notification';
      const notificationOptions = {
        body: data.body || '',
        icon: '/android/android-launchericon-192-192.png',
        badge: '/android/android-launchericon-48-48.png',
        data: data.data || {},
        requireInteraction: true,
        tag: 'buzzy-push-notification',
        renotify: true,
        silent: false,
        vibrate: [200, 100, 200]
      };
      
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (error) {
      console.error('Error handling push event:', error);
    }
  }
});

// Handle message events from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
