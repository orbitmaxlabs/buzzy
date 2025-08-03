import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationToken, saveNotificationToken, removeNotificationToken } from '../firebase';

const RefreshTokenButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRefreshToken = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Refreshing notification token...');
      
      // Remove old token first
      await removeNotificationToken(user.uid);
      console.log('✅ Old token removed');
      
      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
      
      // Get new token
      const newToken = await getNotificationToken();
      await saveNotificationToken(user.uid, newToken);
      console.log('✅ New token saved successfully');
      
      // Show success feedback
      const button = document.querySelector('.refresh-token-btn');
      if (button) {
        button.style.backgroundColor = '#10b981'; // Green
        button.style.color = 'white';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.style.color = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      
      // Show error feedback
      const button = document.querySelector('.refresh-token-btn');
      if (button) {
        button.style.backgroundColor = '#ef4444'; // Red
        button.style.color = 'white';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.style.color = '';
        }, 2000);
      }
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
      title="Refresh notification token"
      style={{
        transition: 'all 0.3s ease'
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
    </button>
  );
};

export default RefreshTokenButton; 