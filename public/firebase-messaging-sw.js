// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmbqYQiEERc8xGn81TYcbHkErB468dDKE",
  authDomain: "buzzy-d2b2a.firebaseapp.com",
  projectId: "buzzy-d2b2a",
  storageBucket: "buzzy-d2b2a.firebasestorage.app",
  messagingSenderId: "512369963479",
  appId: "1:512369963479:web:babd61d660cbd32beadb92"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  console.log('User agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/android/android-launchericon-192-192.png',
    badge: '/android/android-launchericon-48-48.png',
    data: payload.data || {},
    requireInteraction: true,
    tag: 'buzzy-notification', // Prevent duplicate notifications
    renotify: false, // Changed to false to prevent multiple notifications
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/android/android-launchericon-48-48.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/android/android-launchericon-48-48.png'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
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
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
}); 