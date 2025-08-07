// src/utils/pwaUtils.js

let deferredPrompt = null;
let installStatus = null;
let swRegistered = false;

/**
 * Initialize PWA features: service worker, install listeners, offline detection.
 */
export const initializePWA = async () => {
  try {
    await registerServiceWorkers();
    setupEventListeners();
    setupOfflineDetection();
    return { success: true, installStatus };
  } catch (error) {
    console.error('PWA initialization error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Register Firebase messaging service worker only once.
 * Always register in dev & prod so FCM can work on localhost installs too.
 */
const registerServiceWorkers = async () => {
  if (swRegistered) return;
  swRegistered = true;

  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service workers are not supported in this browser.');
    return;
  }

  try {
    // Register the messaging SW at the root
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );
    console.log('✅ Firebase messaging service worker registered:', registration);

    await navigator.serviceWorker.ready;
    console.log('✅ Firebase messaging service worker is ready');

    registration.addEventListener('updatefound', () => {
      console.log('🔄 Service worker update found');
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          console.log(
            '🔄 New service worker installed, ready for activation'
          );
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🎯 Service worker controller changed');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  } catch (error) {
    console.error('❌ Error registering service worker:', error);
  }
};

/**
 * Listen for PWA installation prompt and installed events.
 */
const setupEventListeners = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installStatus = { canInstall: true, prompt: e };
  });

  window.addEventListener('appinstalled', () => {
    console.log('🎯 === PWA INSTALLED ===');
    deferredPrompt = null;
    installStatus = { installed: true };
  });
};

/**
 * Log online/offline status.
 */
const setupOfflineDetection = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log('🌐 Online status:', isOnline);
    if (isOnline) {
      console.log('✅ App is online');
    } else {
      console.log('❌ App is offline');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
};

/**
 * Get current install status for PWA UI.
 */
export const getPWAInstallStatus = () => {
  return installStatus || { canInstall: false, installed: false };
};

/**
 * Trigger the PWA install prompt when available.
 */
export const handlePWAInstallation = async () => {
  if (!deferredPrompt) {
    return { success: false, message: 'Install prompt not available' };
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;

    if (outcome === 'accepted') {
      return { success: true, message: 'PWA installation accepted' };
    } else {
      return { success: false, message: 'PWA installation declined' };
    }
  } catch (error) {
    console.error('❌ handlePWAInstallation error:', error);
    return { success: false, message: error.message };
  }
};
