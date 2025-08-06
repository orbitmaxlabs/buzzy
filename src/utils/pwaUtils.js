let deferredPrompt = null;
let installStatus = null;

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

const registerServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('✅ Firebase messaging service worker registered:', registration);
      
      await navigator.serviceWorker.ready;
      console.log('✅ Firebase messaging service worker is ready');
      
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New service worker installed, ready for activation');
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
      console.error('Error registering service worker:', error);
    }
  }
};

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

export const getPWAInstallStatus = () => {
  return installStatus || { canInstall: false, installed: false };
};

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
    return { success: false, message: error.message };
  }
}; 
