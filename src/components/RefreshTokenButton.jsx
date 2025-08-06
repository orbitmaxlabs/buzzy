import React, { useState } from 'react';
import { getNotificationToken, saveNotificationToken } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const RefreshTokenButton = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefreshToken = async () => {
    if (!currentUser) {
      setMessage('Please log in first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Request notification permission if needed
      if (!('Notification' in window)) {
        throw new Error('Notifications are not supported in this browser');
      }
      
      if (Notification.permission === 'denied') {
        throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
      }
      
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied by user');
        }
      }

      // Get new token
      const token = await getNotificationToken();
      
      // Save token to Firestore
      await saveNotificationToken(currentUser.uid, token);
      
      setMessage('✅ Token refreshed successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error refreshing token:', error);
      setMessage(`❌ Error: ${error.message}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="refresh-token-container">
      <button
        onClick={handleRefreshToken}
        disabled={loading}
        className="refresh-token-btn"
        title="Refresh notification token"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? 'Refreshing...' : 'Refresh Token'}
      </button>
      
      {message && (
        <div className={`refresh-token-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <style jsx>{`
        .refresh-token-container {
          position: relative;
        }
        
        .refresh-token-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .refresh-token-btn:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
        
        .refresh-token-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .refresh-token-message {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 0.25rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          z-index: 50;
        }
        
        .refresh-token-message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        
        .refresh-token-message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
};

export default RefreshTokenButton; 