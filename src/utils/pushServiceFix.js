// Push Service Error Recovery Utility
// This handles the "Registration failed - push service error" issue

import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { getApp } from 'firebase/app';

// Debug logging helper
const log = (message, data = null) => {
  console.log(`🔧 [PushServiceFix] ${message}`, data || '');
};

// Clear all service worker registrations and caches
export const clearAllServiceWorkers = async () => {
  try {
    log('Clearing all service workers and caches...');
    
    // Get all service worker registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    log(`Found ${registrations.length} service worker registrations`);
    
    // Unregister all service workers
    for (const registration of registrations) {
      try {
        const success = await registration.unregister();
        log(`Unregistered service worker: ${registration.scope}`, success);
      } catch (error) {
        log(`Failed to unregister: ${registration.scope}`, error.message);
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      log(`Found ${cacheNames.length} caches to clear`);
      
      for (const cacheName of cacheNames) {
        try {
          await caches.delete(cacheName);
          log(`Deleted cache: ${cacheName}`);
        } catch (error) {
          log(`Failed to delete cache: ${cacheName}`, error.message);
        }
      }
    }
    
    log('✅ All service workers and caches cleared');
    return true;
  } catch (error) {
    log('❌ Error clearing service workers:', error);
    return false;
  }
};

// Re-register Firebase messaging service worker with retry logic
export const reregisterFirebaseServiceWorker = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(`Attempt ${attempt}/${retries}: Registering Firebase service worker...`);
      
      // Wait a bit before registration
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      log('Service worker registered, waiting for activation...');
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Force update if needed
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      log('✅ Firebase service worker registered and ready');
      return registration;
    } catch (error) {
      log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        throw error;
      }
    }
  }
};

// Attempt to get FCM token with multiple strategies
export const getTokenWithRecovery = async () => {
  try {
    log('Starting token generation with recovery strategies...');
    
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Strategy 1: Try with the current service worker
    try {
      log('Strategy 1: Using current service worker...');
      const registration = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM',
        serviceWorkerRegistration: registration
      });
      
      if (token && token.length > 100) {
        log('✅ Strategy 1 successful: Token generated');
        return { success: true, token, strategy: 1 };
      }
    } catch (error) {
      log('Strategy 1 failed:', error.message);
    }
    
    // Strategy 2: Delete existing token and try again
    try {
      log('Strategy 2: Deleting existing token and retrying...');
      await deleteToken(messaging);
      log('Existing token deleted');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM',
        serviceWorkerRegistration: registration
      });
      
      if (token && token.length > 100) {
        log('✅ Strategy 2 successful: Token generated after deletion');
        return { success: true, token, strategy: 2 };
      }
    } catch (error) {
      log('Strategy 2 failed:', error.message);
    }
    
    // Strategy 3: Re-register service worker and try
    try {
      log('Strategy 3: Re-registering service worker...');
      
      // Clear and re-register
      await clearAllServiceWorkers();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const registration = await reregisterFirebaseServiceWorker();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = await getToken(messaging, {
        vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM',
        serviceWorkerRegistration: registration
      });
      
      if (token && token.length > 100) {
        log('✅ Strategy 3 successful: Token generated after re-registration');
        return { success: true, token, strategy: 3 };
      }
    } catch (error) {
      log('Strategy 3 failed:', error.message);
    }
    
    // Strategy 4: Try without service worker registration parameter
    try {
      log('Strategy 4: Trying without explicit service worker...');
      
      const token = await getToken(messaging, {
        vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM'
      });
      
      if (token && token.length > 100) {
        log('✅ Strategy 4 successful: Token generated without explicit SW');
        return { success: true, token, strategy: 4 };
      }
    } catch (error) {
      log('Strategy 4 failed:', error.message);
    }
    
    // All strategies failed
    log('❌ All token generation strategies failed');
    return { 
      success: false, 
      error: 'All token generation strategies failed. Push service may be blocked.',
      strategies: 4 
    };
    
  } catch (error) {
    log('❌ Fatal error in token recovery:', error);
    return { 
      success: false, 
      error: error.message,
      fatal: true 
    };
  }
};

// Check browser and environment compatibility
export const checkPushServiceCompatibility = () => {
  const checks = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    https: window.location.protocol === 'https:',
    permission: Notification.permission,
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
  
  log('Push Service Compatibility:', checks);
  
  // Check for known issues
  const issues = [];
  
  if (!checks.https) {
    issues.push('Site must be served over HTTPS for push notifications');
  }
  
  if (!checks.notifications) {
    issues.push('Browser does not support notifications');
  }
  
  if (!checks.serviceWorker) {
    issues.push('Browser does not support service workers');
  }
  
  if (!checks.pushManager) {
    issues.push('Browser does not support Push API');
  }
  
  if (checks.permission === 'denied') {
    issues.push('Notification permission is denied');
  }
  
  // Check for privacy/security settings that might block push
  if (navigator.doNotTrack === '1') {
    issues.push('Do Not Track is enabled - may affect push notifications');
  }
  
  return {
    compatible: issues.length === 0,
    checks,
    issues
  };
};

// Main recovery function
export const recoverPushService = async () => {
  try {
    log('=== STARTING PUSH SERVICE RECOVERY ===');
    
    // Step 1: Check compatibility
    const compatibility = checkPushServiceCompatibility();
    if (!compatibility.compatible) {
      log('⚠️ Compatibility issues found:', compatibility.issues);
      return {
        success: false,
        error: 'Compatibility issues',
        issues: compatibility.issues
      };
    }
    
    // Step 2: Request permission if needed
    if (Notification.permission === 'default') {
      log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error: 'Notification permission denied'
        };
      }
    }
    
    // Step 3: Try to generate token with recovery
    const tokenResult = await getTokenWithRecovery();
    
    if (tokenResult.success) {
      log('✅ PUSH SERVICE RECOVERY SUCCESSFUL');
      return {
        success: true,
        token: tokenResult.token,
        strategy: tokenResult.strategy
      };
    } else {
      log('❌ PUSH SERVICE RECOVERY FAILED');
      return tokenResult;
    }
    
  } catch (error) {
    log('❌ Fatal error during recovery:', error);
    return {
      success: false,
      error: error.message,
      fatal: true
    };
  }
};

// Fallback token generation for testing
export const generateFallbackToken = () => {
  // Generate a unique fallback token for testing
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const fallbackToken = `FALLBACK_${timestamp}_${random}`;
  
  log('⚠️ Generated fallback token for testing:', fallbackToken);
  return fallbackToken;
};
