import React, { useState } from 'react';
import { setupUserNotifications, sendNotificationToUser } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const { currentUser } = useAuth();
  const { notificationStatus, requestNotificationPermission } = useNotifications();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testNotifications = async () => {
    if (!currentUser) {
      console.log('❌ No current user for testing');
      setStatus('Please log in first');
      return;
    }

    console.log('🧪 === TESTING NOTIFICATIONS ===');
    console.log('👤 Testing for user:', currentUser.uid);
    console.log('📊 Current notification status:', notificationStatus);
    
    setLoading(true);
    setStatus('Testing notifications...');

    try {
      if (!notificationStatus.enabled) {
        console.log('🔔 Setting up notifications first...');
        setStatus('Setting up notifications...');
        const result = await requestNotificationPermission();
        console.log('📊 Setup result:', result);
        if (!result) {
          console.log('❌ Failed to setup notifications');
          setStatus('❌ Failed to setup notifications');
          return;
        }
      }

      console.log('📤 Sending test notification...');
      setStatus('Sending test notification...');
      const result = await sendNotificationToUser(currentUser.uid, {
        title: 'Test Notification',
        body: 'Notifications are working! 🎉',
        data: { type: 'test' }
      });

      console.log('📊 Test result:', result);
      if (result.success) {
        console.log('✅ Test notification sent successfully');
        setStatus('✅ Notifications working! Check your device.');
      } else {
        console.log('❌ Test notification failed:', result.message);
        setStatus(`❌ Notification failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-lg font-semibold mb-2">🔔 Notification Status</h3>
      
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

      <button
        onClick={testNotifications}
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
      >
        {loading ? 'Testing...' : 'Test Notifications'}
      </button>

      {status && (
        <div className="mt-3 text-sm text-gray-600">
          {status}
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
