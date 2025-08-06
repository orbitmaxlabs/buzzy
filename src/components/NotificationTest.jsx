import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  requestNotificationPermission, 
  getNotificationToken, 
  saveNotificationToken,
  setupUserNotifications,
  checkUserNotificationStatus
} from '../firebase';

const NotificationTest = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const testNotificationSetup = async () => {
    if (!currentUser) {
      setStatus('Please log in first');
      return;
    }

    setLoading(true);
    setStatus('Testing notification setup...');

    try {
      // Step 1: Check current status
      setStatus('Checking current notification status...');
      const currentStatus = await checkUserNotificationStatus(currentUser.uid);
      console.log('Current notification status:', currentStatus);

      // Step 2: Request permission
      setStatus('Requesting notification permission...');
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        setStatus('❌ Notification permission denied');
        return;
      }

      // Step 3: Generate token
      setStatus('Generating FCM token...');
      const token = await getNotificationToken();
      console.log('Generated token:', token.substring(0, 50) + '...');

      // Step 4: Save token
      setStatus('Saving notification token...');
      await saveNotificationToken(currentUser.uid, token);

      // Step 5: Complete setup
      setStatus('Completing notification setup...');
      const result = await setupUserNotifications(currentUser.uid);
      
      if (result.success) {
        setStatus('✅ Notification setup completed successfully!');
        console.log('Setup result:', result);
      } else {
        setStatus('❌ Notification setup failed');
      }

    } catch (error) {
      console.error('Notification test error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleToken = async () => {
    if (!currentUser) {
      setStatus('Please log in first');
      return;
    }

    setLoading(true);
    setStatus('Testing simple token generation...');

    try {
      const token = await getNotificationToken();
      setStatus(`✅ Token generated: ${token.substring(0, 30)}...`);
      console.log('Full token:', token);
    } catch (error) {
      console.error('Token generation error:', error);
      setStatus(`❌ Token generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '80px', 
      right: '20px', 
      zIndex: 1000,
      background: '#fff',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #ddd',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔔 Notification Test</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testSimpleToken}
          disabled={loading}
          style={{ 
            marginRight: '5px',
            padding: '5px 10px',
            fontSize: '12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Token
        </button>
        
        <button 
          onClick={testNotificationSetup}
          disabled={loading}
          style={{ 
            padding: '5px 10px',
            fontSize: '12px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Full Setup
        </button>
      </div>
      
      {status && (
        <div style={{ 
          fontSize: '12px', 
          color: status.includes('❌') ? '#dc3545' : status.includes('✅') ? '#28a745' : '#6c757d',
          wordBreak: 'break-word'
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
