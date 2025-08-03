import React, { useState } from 'react';
import { sendNotificationToUser } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const NotificationTest = () => {
  const { userProfile } = useAuth();
  const [testMessage, setTestMessage] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [sending, setSending] = useState(false);

  const handleTestNotification = async (e) => {
    e.preventDefault();
    if (!testMessage.trim() || !targetUid.trim()) {
      alert('Please enter both message and target user ID');
      return;
    }

    try {
      setSending(true);
      console.log('Testing notification to:', targetUid);
      
      await sendNotificationToUser(targetUid, {
        title: 'Test Message',
        body: testMessage,
        data: {
          type: 'test',
          fromUser: userProfile?.username || 'Unknown'
        }
      });
      
      alert('Test notification sent! Check the target user\'s device.');
      setTestMessage('');
      
    } catch (error) {
      console.error('Test notification failed:', error);
      alert(`Test failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Notification Test</h4>
      <form onSubmit={handleTestNotification}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Target User ID:
          </label>
          <input
            type="text"
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Enter user UID"
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Test Message:
          </label>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message"
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <button
          type="submit"
          disabled={sending || !testMessage.trim() || !targetUid.trim()}
          style={{
            width: '100%',
            padding: '8px',
            background: sending ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sending ? 'not-allowed' : 'pointer'
          }}
        >
          {sending ? 'Sending...' : 'Send Test Notification'}
        </button>
      </form>
    </div>
  );
};

export default NotificationTest; 