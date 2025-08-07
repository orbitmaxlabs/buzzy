// src/contexts/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import {
  setupUserNotifications,
  checkUserNotificationStatus,
  onForegroundMessage,
  getUserNotifications,
  markNotificationAsRead
} from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [notificationStatus, setNotificationStatus] = useState({
    enabled: false,
    permission: 'default',
    hasToken: false,
    lastUpdate: null
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // refs to prevent duplicate runs
  const statusCheckedRef = useRef(false);
  const autoSetupRef = useRef(false);

  /** Load existing notifications, but handle missing-index errors gracefully */
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await getUserNotifications(currentUser.uid);
      setNotifications(list);
    } catch (err) {
      if (
        err.code === 'failed-precondition' ||
        /requires an index/.test(err.message)
      ) {
        console.warn(
          '⚠️ Notifications query needs a Firestore index. Please create it once: https://console.firebase.google.com/...'
        );
      } else {
        console.error('❌ Error loading notifications:', err);
      }
    }
  }, [currentUser]);

  /** Check permission/token status once */
  const checkNotificationStatus = useCallback(async () => {
    if (!currentUser || statusCheckedRef.current) return;
    statusCheckedRef.current = true;

    try {
      console.log('🔍 Checking notification status for', currentUser.uid);
      const status = await checkUserNotificationStatus(currentUser.uid);
      setNotificationStatus(status);
      await loadNotifications();

      if (status.permission === 'default' && !status.enabled) {
        setShowPermissionPrompt(true);
      }
    } catch (err) {
      console.error('❌ Error checking notification status:', err);
    }
  }, [currentUser, loadNotifications]);

  /** Auto-setup notifications once if needed */
  const autoSetupNotifications = useCallback(async () => {
    if (!currentUser || autoSetupRef.current) return;
    autoSetupRef.current = true;

    try {
      const status = await checkUserNotificationStatus(currentUser.uid);
      if (!status.enabled && status.permission !== 'denied') {
        setLoading(true);
        await setupUserNotifications(currentUser.uid);
        await checkNotificationStatus();
      }
    } catch (err) {
      console.error('❌ Auto-setup failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, checkNotificationStatus]);

  // INITIALIZE: status check → auto-setup
  useEffect(() => {
    if (currentUser) {
      checkNotificationStatus();
      autoSetupNotifications();
    }
  }, [currentUser, checkNotificationStatus, autoSetupNotifications]);

  // Listen for foreground FCM messages
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onForegroundMessage(payload => {
      setNotifications(prev => [
        {
          id: payload.messageId || Date.now().toString(),
          title: payload.notification?.title,
          body: payload.notification?.body,
          createdAt: new Date(),
          read: false,
          ...payload.data
        },
        ...prev
      ]);
    });
    return unsubscribe;
  }, [currentUser]);

  const markAsRead = async notificationId => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowPermissionPrompt(false);

      const result = await setupUserNotifications(currentUser.uid);
      if (result.success) {
        // re-check status & reload
        statusCheckedRef.current = false;
        await checkNotificationStatus();
        return true;
      } else {
        setError('Failed to setup notifications');
        return false;
      }
    } catch (err) {
      console.error('❌ Error requesting permission:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissPermissionPrompt = () => setShowPermissionPrompt(false);

  return (
    <NotificationContext.Provider
      value={{
        notificationStatus,
        notifications,
        loading,
        error,
        showPermissionPrompt,
        requestNotificationPermission,
        dismissPermissionPrompt,
        markAsRead
      }}
    >
      {children}

      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-5 5v-5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Enable Notifications
                </h3>
                <p className="text-sm text-gray-600">
                  Stay connected with your friends!
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Get notified when friends send you messages, friend requests,
              and other updates.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={requestNotificationPermission}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Setting up...' : 'Enable Notifications'}
              </button>
              <button
                onClick={dismissPermissionPrompt}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
