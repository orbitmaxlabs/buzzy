/* eslint-env serviceworker */
/* global firebase importScripts */

// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

(async () => {
  const firebaseConfig = await fetch('/firebase-config.json').then(res => res.json());
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  console.log('🎯 === FIREBASE MESSAGING SERVICE WORKER INITIALIZED ===');
  console.log('Firebase config:', firebaseConfig);
  console.log('Messaging initialized:', !!messaging);

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('🎯 === BACKGROUND MESSAGE RECEIVED ===');
    console.log('Payload:', payload);
    console.log('User agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Service Worker state:', self.registration ? 'Active' : 'Inactive');

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
      // Add more notification options for better PWA experience
      dir: 'auto',
      lang: 'en',
      timestamp: Date.now()
    };

    console.log('Showing notification with options:', notificationOptions);

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Notification shown successfully');
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error);
      });
  });
})();

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🎯 === NOTIFICATION CLICKED ===');
  console.log('Event:', event);
  console.log('Action:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      self.clients.matchAll({
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        console.log('Found clients:', clientList.length);
        
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('Focusing existing client');
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (self.clients.openWindow) {
          console.log('Opening new window');
          return self.clients.openWindow('/');
        }
      }).catch((error) => {
        console.error('Error handling notification click:', error);
      })
    );
  } else if (event.action === 'close') {
    console.log('Notification closed by user');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🎯 === NOTIFICATION CLOSED ===');
  console.log('Event:', event);
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('🎯 === SERVICE WORKER INSTALLING ===');
  console.log('Event:', event);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('🎯 === SERVICE WORKER ACTIVATING ===');
  console.log('Event:', event);
  
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if needed
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== 'buzzy-cache-v1') {
              console.log('Deleting old cache:', cacheName);
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
  console.log('🎯 === PUSH EVENT RECEIVED ===');
  console.log('Event:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
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

// Handle sync events for background sync
self.addEventListener('sync', (event) => {
  console.log('🎯 === BACKGROUND SYNC EVENT ===');
  console.log('Event:', event);
  console.log('Tag:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations here
      console.log('Performing background sync...')
    );
  }
});

// Handle message events from main thread
self.addEventListener('message', (event) => {
  console.log('🎯 === MESSAGE FROM MAIN THREAD ===');
  console.log('Event:', event);
  console.log('Data:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
