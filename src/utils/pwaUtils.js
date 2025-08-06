// PWA Utilities for better service worker management and PWA features

// Register service workers with proper error handling
export const registerServiceWorkers = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    // Register PWA service worker (handled by Vite PWA plugin)
    
    // Register Firebase messaging service worker (ensure correct worker is used)
    const registrations = await navigator.serviceWorker.getRegistrations();
    let registration = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
    }

    // Wait for the service worker system to be ready
    await navigator.serviceWorker.ready;

    // Set up update handling for the Firebase messaging service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // You can show a notification to the user here
          showUpdateNotification();
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Error registering service workers:', error);
    return false;
  }
};

// Show update notification
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Buzzy Update Available', {
      body: 'A new version is available. Please refresh the page.',
      icon: '/android/android-launchericon-192-192.png',
      badge: '/android/android-launchericon-48-48.png',
      tag: 'update-notification',
      requireInteraction: true
    });
  }
};

// Check PWA install status
export const getPWAInstallStatus = () => {
  return new Promise((resolve) => {
    if (!('BeforeInstallPromptEvent' in window)) {
      resolve({ canInstall: false, isInstalled: false });
      return;
    }

    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

    // Check if install prompt is available
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    resolve({
      canInstall: !!deferredPrompt,
      isInstalled: isInstalled,
      deferredPrompt: deferredPrompt
    });
  });
};

// Handle PWA installation
export const handlePWAInstallation = async () => {
  return new Promise((resolve) => {
    if (!('BeforeInstallPromptEvent' in window)) {
      resolve({ success: false, reason: 'not_supported' });
      return;
    }

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

    if (isInstalled) {
      resolve({ success: false, reason: 'already_installed' });
      return;
    }

    // Wait for install prompt
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Check if prompt is available
    if (deferredPrompt) {
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          resolve({ success: true, reason: 'user_accepted' });
        } else {
          resolve({ success: false, reason: 'user_declined' });
        }
        deferredPrompt = null;
      });
    } else {
      resolve({ success: false, reason: 'prompt_not_available' });
    }
  });
};

// Set up PWA event listeners
export const setupPWAEventListeners = () => {
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Store the event for later use
    window.deferredPrompt = e;
  });

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {
    // Hide the install button
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    // Show success message
    const successMessage = document.getElementById('pwa-success-message');
    if (successMessage) {
      successMessage.style.display = 'block';
    }
  });

  // Listen for service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Show update notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Buzzy Updated', {
        body: 'A new version of the app is available. Please refresh the page when convenient.',
        icon: '/android/android-launchericon-192-192.png',
        badge: '/android/android-launchericon-48-48.png',
        tag: 'update-notification',
        requireInteraction: true
      });
    }
  });
};

// Show/hide custom install button
export const showCustomInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
};

export const hideCustomInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
};

export const showInstallSuccessMessage = () => {
  const successMessage = document.getElementById('pwa-success-message');
  if (successMessage) {
    successMessage.style.display = 'block';
  }
};

// Set up offline detection
export const setupOfflineDetection = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      // App is online
    } else {
      // App is offline
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
};

// Main PWA initialization function
export const initializePWA = async () => {
  try {
    // Register service workers
    await registerServiceWorkers();
    
    // Set up event listeners
    setupPWAEventListeners();
    
    // Set up offline detection
    setupOfflineDetection();
    
    // Get install status
    const installStatus = await getPWAInstallStatus();
    
    return {
      success: true,
      installStatus: installStatus
    };
  } catch (error) {
    console.error('Error initializing PWA:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 
