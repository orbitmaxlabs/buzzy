import React, { useState } from 'react';
import { setupUserNotifications, sendNotificationToUser } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const { currentUser } = useAuth();
  const { notificationStatus, requestNotificationPermission, refreshToken } = useNotifications();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testNotifications = async () => {
    if (!currentUser) {
      setStatus('Please log in first');
      return;
    }

    setLoading(true);
    setStatus('Testing notifications...');

    try {
      // Step 1: Check if notifications are enabled
      if (!notificationStatus.enabled) {
        setStatus('Setting up notifications...');
        const result = await requestNotificationPermission();
        if (!result) {
          setStatus('❌ Failed to setup notifications');
          return;
        }
      }

      // Step 2: Send test notification
      setStatus('Sending test notification...');
      const result = await sendNotificationToUser(currentUser.uid, {
        title: 'Test Notification',
        body: 'Notifications are working! 🎉',
        data: { type: 'test' }
      });

      if (result.success) {
        setStatus('✅ Notifications working! Check your device.');
      } else {
        setStatus(`❌ Notification failed: ${result.message}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotificationToken = async () => {
    if (!currentUser) {
      setStatus('Please log in first');
      return;
    }

    setLoading(true);
    setStatus('Refreshing token...');

    try {
      const result = await refreshToken();
      if (result) {
        setStatus('✅ Token refreshed successfully!');
      } else {
        setStatus('❌ Failed to refresh token');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-lg font-semibold mb-2">🔔 Notification Status</h3>
      
      {/* Status Display */}
      <div className="mb-3 text-sm">
        <div className="flex items-center mb-1">
          <span className={`w-2 h-2 rounded-full mr-2 ${
            notificationStatus.enabled ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span>Enabled: {notificationStatus.enabled ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
          <span>Permission: {notificationStatus.permission}</span>
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${
            notificationStatus.hasToken ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span>Token: {notificationStatus.hasToken ? 'Valid' : 'Missing'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={testNotifications}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {loading ? 'Testing...' : 'Test Notifications'}
        </button>

        <button
          onClick={refreshNotificationToken}
          disabled={loading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh Token'}
        </button>
      </div>

      {status && (
        <div className="mt-3 text-sm text-gray-600">
          {status}
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
