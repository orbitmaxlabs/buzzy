import React, { useState } from 'react';
import { getNotificationToken, saveNotificationToken, sendNotificationToUser } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const NotificationTest = () => {
  const { currentUser } = useAuth();
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
      // Step 1: Get notification token
      setStatus('Getting notification token...');
      const token = await getNotificationToken();
      
      // Step 2: Save token
      setStatus('Saving token...');
      await saveNotificationToken(currentUser.uid, token);
      
      // Step 3: Send test notification
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

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-lg font-semibold mb-2">🔔 Test Notifications</h3>
      
      <button
        onClick={testNotifications}
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
      >
        {loading ? 'Testing...' : 'Test Notifications'}
      </button>

      {status && (
        <div className="text-sm text-gray-600">
          {status}
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
