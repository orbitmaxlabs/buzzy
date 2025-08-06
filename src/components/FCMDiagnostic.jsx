import React, { useState, useEffect } from 'react';
import { getNotificationToken, saveNotificationToken } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const FCMDiagnostic = () => {
  const { currentUser } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (status, message, details = null) => {
    setDiagnosticResults(prev => [...prev, { status, message, details, timestamp: new Date() }]);
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnosticResults([]);

    try {
      // Step 1: Check browser support
      addResult('info', '🔍 Starting FCM diagnostic...');
      
      if (!('Notification' in window)) {
        addResult('error', '❌ Notifications not supported in this browser');
        return;
      }
      addResult('success', '✅ Notifications are supported');

      // Step 2: Check permission
      addResult('info', `📱 Current permission: ${Notification.permission}`);
      
      if (Notification.permission === 'denied') {
        addResult('error', '❌ Notification permission is denied. Please enable in browser settings.');
        return;
      }

      if (Notification.permission === 'default') {
        addResult('info', '🔔 Requesting permission...');
        const permission = await Notification.requestPermission();
        addResult('info', `📱 Permission result: ${permission}`);
        
        if (permission !== 'granted') {
          addResult('error', '❌ Permission denied by user');
          return;
        }
      }
      addResult('success', '✅ Notification permission granted');

      // Step 3: Check service workers
      if (!('serviceWorker' in navigator)) {
        addResult('error', '❌ Service workers not supported');
        return;
      }
      addResult('success', '✅ Service workers are supported');

      // Step 4: Check Firebase messaging
      try {
        const { messaging } = await import('../firebase');
        if (!messaging) {
          addResult('error', '❌ Firebase messaging not initialized');
          return;
        }
        addResult('success', '✅ Firebase messaging is available');
      } catch (error) {
        addResult('error', `❌ Firebase messaging error: ${error.message}`);
        return;
      }

      // Step 5: Check service worker registration
      try {
        let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!registration) {
          addResult('info', '🔧 Registering service worker...');
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          addResult('success', '✅ Service worker registered');
        } else {
          addResult('success', '✅ Service worker already registered');
        }

        await navigator.serviceWorker.ready;
        addResult('success', '✅ Service worker is ready');
      } catch (error) {
        addResult('error', `❌ Service worker error: ${error.message}`);
        return;
      }

      // Step 6: Try to get FCM token
      try {
        addResult('info', '🔑 Attempting to get FCM token...');
        const token = await getNotificationToken();
        addResult('success', `✅ FCM token generated: ${token.substring(0, 20)}...`);
        
        if (currentUser) {
          await saveNotificationToken(currentUser.uid, token);
          addResult('success', '✅ Token saved to Firestore');
        }
      } catch (error) {
        addResult('error', `❌ FCM token error: ${error.message}`);
        
        // Provide specific troubleshooting steps
        if (error.message.includes('push service error')) {
          addResult('info', '🔧 Troubleshooting steps:');
          addResult('info', '1. Check if VAPID key is correct in Firebase Console');
          addResult('info', '2. Verify domain is authorized in Firebase Console');
          addResult('info', '3. Ensure HTTPS is enabled (FCM requires HTTPS)');
          addResult('info', '4. Check if Firebase project has FCM enabled');
        }
      }

    } catch (error) {
      addResult('error', `❌ Diagnostic error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-semibold mb-2">🔧 FCM Diagnostic</h3>
      
      <button
        onClick={runDiagnostic}
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
      >
        {loading ? 'Running...' : 'Run Diagnostic'}
      </button>

      <div className="max-h-64 overflow-y-auto">
        {diagnosticResults.map((result, index) => (
          <div key={index} className={`text-sm mb-1 ${
            result.status === 'success' ? 'text-green-600' :
            result.status === 'error' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {result.message}
          </div>
        ))}
      </div>

      {diagnosticResults.length > 0 && (
        <button
          onClick={() => setDiagnosticResults([])}
          className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Clear Results
        </button>
      )}
    </div>
  );
};

export default FCMDiagnostic;
