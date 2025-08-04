import React, { useState } from 'react';
import { getNotificationToken, saveNotificationToken, sendNotificationToUser } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const NotificationTest = () => {
  const { user } = useAuth();
  const [testStatus, setTestStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testTokenGeneration = async () => {
    setIsLoading(true);
    setTestStatus('Testing token generation...');
    
    try {
      console.log('🧪 === NOTIFICATION TEST START ===');
      
      // Test 1: Get notification token
      setTestStatus('Step 1: Getting notification token...');
      const token = await getNotificationToken();
      console.log('Token result:', token);
      
      if (token.startsWith('mock-dev-token-')) {
        setTestStatus('✅ Development mode: Mock token generated');
      } else if (token.startsWith('prod-fallback-token-')) {
        setTestStatus('⚠️ Production mode: Fallback token generated (FCM not configured)');
      } else {
        setTestStatus('✅ Real FCM token generated!');
      }
      
      // Test 2: Save token
      setTestStatus('Step 2: Saving token to Firestore...');
      await saveNotificationToken(user.uid, token);
      setTestStatus('✅ Token saved to Firestore');
      
      // Test 3: Send test notification
      setTestStatus('Step 3: Sending test notification...');
      const result = await sendNotificationToUser(user.uid, {
        title: 'Test Notification',
        body: 'This is a test notification to verify FCM is working!',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      });
      
      if (result.success) {
        setTestStatus('✅ Test notification sent successfully!');
      } else {
        setTestStatus(`⚠️ Test notification failed: ${result.message}`);
      }
      
      console.log('🧪 === NOTIFICATION TEST END ===');
      
    } catch (error) {
      console.error('❌ Notification test failed:', error);
      setTestStatus(`❌ Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFriendNotification = async () => {
    setIsLoading(true);
    setTestStatus('Testing friend notification...');
    
    try {
      const result = await sendNotificationToUser(user.uid, {
        title: 'Friend Activity',
        body: 'Test user clicked on your profile!',
        data: {
          type: 'friend_activity',
          action: 'view_profile'
        }
      });
      
      if (result.success) {
        setTestStatus('✅ Friend notification test successful!');
      } else {
        setTestStatus(`⚠️ Friend notification test failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error('❌ Friend notification test failed:', error);
      setTestStatus(`❌ Friend test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="notification-test" style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔔 Notification Test Panel</h3>
      <p>Use this to test if notifications are working properly.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testTokenGeneration}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Testing...' : 'Test Token Generation'}
        </button>
        
        <button 
          onClick={testFriendNotification}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Testing...' : 'Test Friend Notification'}
        </button>
      </div>
      
      {testStatus && (
        <div style={{
          padding: '10px',
          backgroundColor: testStatus.includes('✅') ? '#d4edda' : 
                         testStatus.includes('⚠️') ? '#fff3cd' : 
                         testStatus.includes('❌') ? '#f8d7da' : '#e2e3e5',
          border: `1px solid ${
            testStatus.includes('✅') ? '#c3e6cb' : 
            testStatus.includes('⚠️') ? '#ffeaa7' : 
            testStatus.includes('❌') ? '#f5c6cb' : '#d6d8db'
          }`,
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>Status:</strong> {testStatus}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>What to check:</h4>
        <ul>
          <li>✅ Real FCM token = Notifications should work</li>
          <li>⚠️ Fallback token = FCM not configured (check Firebase Console)</li>
          <li>✅ Test notification sent = Firebase Functions working</li>
          <li>⚠️ Test failed = Check browser console for errors</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTest; 