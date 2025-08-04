import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationToken, saveNotificationToken, removeNotificationToken } from '../firebase';

const RefreshTokenButton = () => {
  const { currentUser: user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRefreshToken = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 === REFRESH TOKEN DEBUG START ===');
      console.log('User:', user.uid);
      
      // Step 1: Remove old token first
      console.log('Step 1: Removing old token...');
      await removeNotificationToken(user.uid);
      console.log('✅ Old token removed');
      
      // Step 2: Check and request notification permission
      console.log('Step 2: Checking notification permission...');
      if ('Notification' in window) {
        console.log('Current permission:', Notification.permission);
        
        if (Notification.permission === 'default') {
          console.log('Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('Permission result:', permission);
          
          if (permission !== 'granted') {
            throw new Error('Notification permission denied by user');
          }
        } else if (Notification.permission === 'denied') {
          throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
        }
      } else {
        throw new Error('Notifications are not supported in this browser');
      }
      
      // Step 3: Ensure service worker is registered
      console.log('Step 3: Ensuring service worker is registered...');
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          throw new Error('Service worker not found');
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker is ready');

        // Wait a bit for everything to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw new Error('Service workers are not supported in this browser');
      }
      
      // Step 4: Get new token
      console.log('Step 4: Getting new notification token...');
      const newToken = await getNotificationToken();
      console.log('✅ New token generated:', newToken.substring(0, 20) + '...');
      
      // Step 5: Save token to Firestore
      console.log('Step 5: Saving token to Firestore...');
      await saveNotificationToken(user.uid, newToken);
      console.log('✅ Token saved successfully');
      
      // Step 6: Show success feedback
      console.log('Step 6: Showing success feedback...');
      const button = document.querySelector('.refresh-token-btn');
      if (button) {
        button.style.backgroundColor = '#10b981'; // Green
        button.style.color = 'white';
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.style.color = '';
          button.style.transform = '';
        }, 3000);
      }
      
      // Step 7: Show success message
      alert('✅ Notification token refreshed successfully! You will now receive notifications on all your devices.');
      
      console.log('🔄 === REFRESH TOKEN DEBUG END: SUCCESS ===');
      
    } catch (error) {
      console.error('🔄 === REFRESH TOKEN DEBUG ERROR ===', error);
      
      // Show error feedback
      const button = document.querySelector('.refresh-token-btn');
      if (button) {
        button.style.backgroundColor = '#ef4444'; // Red
        button.style.color = 'white';
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.style.color = '';
          button.style.transform = '';
        }, 3000);
      }
      
      // Show error message
      alert(`❌ Failed to refresh notification token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      className="refresh-token-btn icon-btn"
      onClick={handleRefreshToken}
      disabled={loading}
      title="Refresh notification token and enable notifications"
      style={{
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      <svg 
        className={`icon ${loading ? 'animate-spin' : ''}`} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M1 4v6h6" />
        <path d="M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
};

export default RefreshTokenButton; 