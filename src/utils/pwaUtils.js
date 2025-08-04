// PWA Utilities for better service worker management and PWA features

// Register service workers with proper error handling
export const registerServiceWorkers = async () => {
  try {
    console.log('🔧 === REGISTERING SERVICE WORKERS ===');
    
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service workers not supported');
      return false;
    }
    
    // Register PWA service worker (handled by Vite PWA plugin)
    console.log('Step 1: PWA service worker registration handled by Vite PWA plugin');
    
    // Register Firebase messaging service worker
    console.log('Step 2: Registering Firebase messaging service worker...');
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'module'
      });
      console.log('✅ Firebase messaging service worker registered:', registration);
    } else {
      console.log('✅ Existing service worker found:', registration);
    }
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service worker is ready');
    
    // Set up update handling
    registration.addEventListener('updatefound', () => {
      console.log('🔄 Service worker update found');
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 New service worker installed, ready for activation');
          // You can show a notification to the user here
          showUpdateNotification();
        }
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error registering service workers:', error);
    return false;
  }
};

// Show update notification to user
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Buzzy Update Available', {
      body: 'A new version of Buzzy is available. Refresh the page to update.',
      icon: '/android/android-launchericon-192-192.png',
      badge: '/android/android-launchericon-48-48.png',
      tag: 'buzzy-update',
      requireInteraction: true,
      actions: [
        {
          action: 'refresh',
          title: 'Refresh Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    });
  }
};

// Check if app is installed as PWA
export const isPWAInstalled = () => {
  // Check for standalone mode (iOS)
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Check for standalone mode (Android/Chrome)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for fullscreen mode
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  // Check for minimal-ui mode
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true;
  }
  
  return false;
};

// Get PWA installation status
export const getPWAInstallStatus = () => {
  const status = {
    isInstalled: isPWAInstalled(),
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    canInstall: false,
    deferredPrompt: null
  };
  
  console.log('🔧 === PWA INSTALL STATUS ===');
  console.log('Status:', status);
  
  return status;
};

// Handle PWA installation prompt
export const handlePWAInstallation = async () => {
  try {
    console.log('🔧 === HANDLING PWA INSTALLATION ===');
    
    // Check if already installed
    if (isPWAInstalled()) {
      console.log('✅ PWA already installed');
      return { success: true, alreadyInstalled: true };
    }
    
    // Check if installation is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }
    
    // Check if we have a deferred prompt
    if (!window.deferredPrompt) {
      throw new Error('No installation prompt available');
    }
    
    console.log('Showing installation prompt...');
    window.deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await window.deferredPrompt.userChoice;
    console.log('User choice:', outcome);
    
    // Clear the deferred prompt
    window.deferredPrompt = null;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA installation');
      return { success: true, installed: true };
    } else {
      console.log('❌ User declined PWA installation');
      return { success: false, declined: true };
    }
  } catch (error) {
    console.error('❌ Error handling PWA installation:', error);
    return { success: false, error: error.message };
  }
};

// Set up PWA event listeners
export const setupPWAEventListeners = () => {
  console.log('🔧 === SETTING UP PWA EVENT LISTENERS ===');
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 PWA install prompt available');
    e.preventDefault();
    window.deferredPrompt = e;
    
    // You can trigger your custom install UI here
    // For example, show a custom install button
    showCustomInstallButton();
  });
  
  // Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('🎯 PWA installed successfully');
    window.deferredPrompt = null;
    
    // Hide any custom install UI
    hideCustomInstallButton();
    
    // Show success message
    showInstallSuccessMessage();
  });
  
  // Listen for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🎯 Service worker controller changed');
      // Reload the page to use the new service worker
      window.location.reload();
    });
  }
};

// Show custom install button (you can customize this)
const showCustomInstallButton = () => {
  console.log('🔧 Showing custom install button');
  // This would typically update your UI to show an install button
  // For now, we'll just log it
};

// Hide custom install button
const hideCustomInstallButton = () => {
  console.log('🔧 Hiding custom install button');
  // This would typically update your UI to hide the install button
};

// Show install success message
const showInstallSuccessMessage = () => {
  console.log('🔧 Showing install success message');
  // You can show a toast notification or other success message
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Buzzy Installed! 🎉', {
      body: 'Buzzy has been successfully installed on your device.',
      icon: '/android/android-launchericon-192-192.png',
      badge: '/android/android-launchericon-48-48.png',
      tag: 'buzzy-installed'
    });
  }
};

// Check for offline/online status
export const setupOfflineDetection = () => {
  console.log('🔧 === SETTING UP OFFLINE DETECTION ===');
  
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log('🌐 Online status:', isOnline);
    
    // You can update your UI based on online status
    if (isOnline) {
      // App is online
      console.log('✅ App is online');
    } else {
      // App is offline
      console.log('❌ App is offline');
    }
  };
  
  // Listen for online/offline events
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
};

// Initialize all PWA features
export const initializePWA = async () => {
  try {
    console.log('🔧 === INITIALIZING PWA ===');
    
    // Register service workers
    const swRegistered = await registerServiceWorkers();
    
    // Set up event listeners
    setupPWAEventListeners();
    
    // Set up offline detection
    setupOfflineDetection();
    
    // Get installation status
    const installStatus = getPWAInstallStatus();
    
    console.log('✅ PWA initialization complete');
    console.log('Installation status:', installStatus);
    
    return {
      success: true,
      serviceWorkerRegistered: swRegistered,
      installStatus
    };
  } catch (error) {
    console.error('❌ Error initializing PWA:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 