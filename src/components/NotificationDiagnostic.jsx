import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const NotificationDiagnostic = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const runFullDiagnostic = async () => {
    if (!user) {
      addLog('No user logged in', 'error');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    addLog('🔍 Starting comprehensive notification diagnostic...', 'info');

    const results = {
      browserSupport: {},
      permissions: {},
      serviceWorker: {},
      fcmToken: {},
      firebaseFunction: {},
      firestoreAccess: {}
    };

    try {
      // 1. Browser Support Check
      addLog('1️⃣ Checking browser support...', 'info');
      results.browserSupport = {
        notifications: 'Notification' in window,
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        fetch: 'fetch' in window
      };
      addLog(`Browser support: ${JSON.stringify(results.browserSupport)}`, 'info');

      // 2. Permission Check
      addLog('2️⃣ Checking notification permissions...', 'info');
      results.permissions = {
        current: Notification.permission,
        supported: 'Notification' in window
      };
      addLog(`Permission status: ${results.permissions.current}`, 'info');

      // 3. Service Worker Check
      addLog('3️⃣ Checking service worker...', 'info');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const swRegistration = registrations.find(r => 
          r.active?.scriptURL.includes('firebase-messaging-sw.js')
        );
        
        results.serviceWorker = {
          registered: !!swRegistration,
          active: swRegistration?.active?.state || 'none',
          scope: swRegistration?.scope || 'none',
          scriptURL: swRegistration?.active?.scriptURL || 'none'
        };
        addLog(`Service worker: ${JSON.stringify(results.serviceWorker)}`, 'info');
      } else {
        results.serviceWorker = { supported: false };
        addLog('Service workers not supported', 'error');
      }

      // 4. FCM Token Test
      addLog('4️⃣ Testing FCM token generation...', 'info');
      try {
        const { getNotificationToken } = await import('../firebase.js');
        const token = await getNotificationToken();
        results.fcmToken = {
          generated: true,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...'
        };
        addLog(`FCM token generated successfully (${token.length} chars)`, 'success');
      } catch (error) {
        results.fcmToken = {
          generated: false,
          error: error.message
        };
        addLog(`FCM token generation failed: ${error.message}`, 'error');
      }

      // 5. Firebase Function Test
      addLog('5️⃣ Testing Firebase Function connectivity...', 'info');
      try {
        const response = await fetch('https://us-central1-buzzy-d2b2a.cloudfunctions.net/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          results.firebaseFunction = {
            accessible: true,
            status: data.status,
            timestamp: data.timestamp
          };
          addLog('Firebase Functions are accessible', 'success');
        } else {
          results.firebaseFunction = {
            accessible: false,
            status: response.status,
            statusText: response.statusText
          };
          addLog(`Firebase Functions error: ${response.status}`, 'error');
        }
      } catch (error) {
        results.firebaseFunction = {
          accessible: false,
          error: error.message
        };
        addLog(`Firebase Functions connection failed: ${error.message}`, 'error');
      }

      // 6. Firestore Access Test
      addLog('6️⃣ Testing Firestore access...', 'info');
      try {
        const { db } = await import('../firebase.js');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const tokenRef = doc(db, 'notificationTokens', user.uid);
        const tokenSnap = await getDoc(tokenRef);
        
        results.firestoreAccess = {
          accessible: true,
          tokenExists: tokenSnap.exists(),
          tokenData: tokenSnap.exists() ? {
            hasToken: !!tokenSnap.data()?.token,
            createdAt: tokenSnap.data()?.createdAt?.toDate?.()?.toISOString?.() || 'N/A'
          } : null
        };
        addLog(`Firestore accessible, token exists: ${tokenSnap.exists()}`, 'success');
      } catch (error) {
        results.firestoreAccess = {
          accessible: false,
          error: error.message
        };
        addLog(`Firestore access failed: ${error.message}`, 'error');
      }

      // 7. End-to-End Test
      addLog('7️⃣ Running end-to-end notification test...', 'info');
      try {
        const { sendNotificationToUser } = await import('../firebase.js');
        const testResult = await sendNotificationToUser(user.uid, {
          title: 'Diagnostic Test',
          body: 'This is a test notification from the diagnostic tool',
          data: {
            type: 'diagnostic',
            timestamp: Date.now()
          }
        });

        if (testResult.success) {
          addLog('✅ End-to-end test successful!', 'success');
          results.endToEnd = { success: true, messageId: testResult.messageId };
        } else {
          addLog(`❌ End-to-end test failed: ${testResult.message}`, 'error');
          results.endToEnd = { success: false, error: testResult.message };
        }
      } catch (error) {
        addLog(`❌ End-to-end test error: ${error.message}`, 'error');
        results.endToEnd = { success: false, error: error.message };
      }

      setDiagnostics(results);
      addLog('🎉 Diagnostic complete!', 'success');
    } catch (error) {
      addLog(`Diagnostic failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const fixPermissions = async () => {
    addLog('🔧 Requesting notification permissions...', 'info');
    try {
      const permission = await Notification.requestPermission();
      addLog(`Permission result: ${permission}`, permission === 'granted' ? 'success' : 'error');
      
      if (permission === 'granted') {
        // Re-run diagnostic
        setTimeout(() => runFullDiagnostic(), 1000);
      }
    } catch (error) {
      addLog(`Permission request failed: ${error.message}`, 'error');
    }
  };

  const registerServiceWorker = async () => {
    addLog('🔧 Registering service worker...', 'info');
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      addLog('Service worker registered successfully', 'success');
      
      // Re-run diagnostic
      setTimeout(() => runFullDiagnostic(), 1000);
    } catch (error) {
      addLog(`Service worker registration failed: ${error.message}`, 'error');
    }
  };

  const testNotificationNow = async () => {
    addLog('🧪 Sending immediate test notification...', 'info');
    try {
      const { sendNotificationToUser } = await import('../firebase.js');
      const result = await sendNotificationToUser(user.uid, {
        title: '🚨 Immediate Test',
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
        data: {
          type: 'immediate_test',
          timestamp: Date.now()
        }
      });

      if (result.success) {
        addLog('✅ Test notification sent successfully!', 'success');
        addLog(`Message ID: ${result.messageId}`, 'info');
      } else {
        addLog(`❌ Test notification failed: ${result.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Test notification error: ${error.message}`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="notification-diagnostic">
        <p>Please log in to run notification diagnostics.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid #007bff',
      borderRadius: '10px',
      backgroundColor: '#f8f9fa',
      fontFamily: 'monospace'
    }}>
      <h2>🔧 Notification System Diagnostics</h2>
      <p>This tool will help diagnose and fix notification delivery issues.</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runFullDiagnostic}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isRunning ? '🔄 Running...' : '🔍 Run Full Diagnostic'}
        </button>

        <button
          onClick={testNotificationNow}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          🧪 Test Now
        </button>

        <button
          onClick={fixPermissions}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔧 Fix Permissions
        </button>

        <button
          onClick={registerServiceWorker}
          style={{
            padding: '12px 24px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔧 Register Service Worker
        </button>
      </div>

      {/* Live Log Display */}
      <div style={{
        backgroundColor: '#000',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '5px',
        height: '300px',
        overflowY: 'auto',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '10px' }}>
          📊 Live Diagnostic Log:
        </div>
        {logs.map((log, index) => (
          <div key={index} style={{
            color: log.type === 'error' ? '#ff4444' : 
                   log.type === 'success' ? '#44ff44' : 
                   log.type === 'warning' ? '#ffff44' : '#00ff00'
          }}>
            [{log.timestamp}] {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ color: '#888' }}>Click "Run Full Diagnostic" to start...</div>
        )}
      </div>

      {/* Diagnostic Results */}
      {diagnostics && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '5px',
          padding: '15px'
        }}>
          <h3>📋 Diagnostic Results</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '11px'
          }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>🩺 Common Issues & Fixes:</h4>
        <ul>
          <li><strong>Permission denied:</strong> Click "Fix Permissions" button</li>
          <li><strong>Service worker not registered:</strong> Click "Register Service Worker"</li>
          <li><strong>FCM token fails:</strong> Check browser console for detailed errors</li>
          <li><strong>Function not accessible:</strong> Verify Firebase deployment</li>
          <li><strong>Notifications not showing:</strong> Check browser notification settings</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationDiagnostic;
