/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState({
    enabled: false, permission: 'default', hasToken: false, lastUpdate: null
  });
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkNotificationStatus();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !loading) {
      autoSetupNotifications();
    }
  }, [currentUser, loading]);

  const checkNotificationStatus = async () => {
    try {
      console.log('🔍 === CHECKING NOTIFICATION STATUS ===');
      console.log('👤 Current user:', currentUser?.uid);
      
      const status = await checkUserNotificationStatus(currentUser.uid);
      console.log('📊 Status result:', status);
      setNotificationStatus(status);
      setPermission(status.permission);
      await loadNotifications();

      if (status.permission === 'default' && !status.enabled) {
        console.log('🔔 Showing permission prompt...');
        setShowPermissionPrompt(true);
      } else {
        console.log('✅ No permission prompt needed');
      }
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
    }
  };

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const list = await getUserNotifications(currentUser.uid);
      setNotifications(list);
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onForegroundMessage(payload => {
      const newNotification = {
        id: payload.messageId || Date.now().toString(),
        title: payload.notification?.title,
        body: payload.notification?.body,
        createdAt: new Date(),
        read: false,
        ...payload.data
      };
      setNotifications(prev => [newNotification, ...prev]);
    });
    return unsubscribe;
  }, [currentUser]);

  const autoSetupNotifications = async () => {
    if (!currentUser || loading) {
      console.log('⏸️ Auto-setup skipped:', { hasUser: !!currentUser, loading });
      return;
    }

    try {
      console.log('🔄 === AUTO-SETUP NOTIFICATIONS ===');
      setLoading(true);
      setError(null);

      const status = await checkUserNotificationStatus(currentUser.uid);
      console.log('📊 Current status:', status);
      
      if (!status.enabled && status.permission !== 'denied') {
        console.log('🔄 Auto-setting up notifications...');
        await setupUserNotifications(currentUser.uid);
        await checkNotificationStatus();
      } else {
        console.log('✅ Notifications already set up or denied');
      }
    } catch (error) {
      console.error('❌ Auto-setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('🔔 === MANUAL PERMISSION REQUEST ===');
      setLoading(true);
      setError(null);
      setShowPermissionPrompt(false);

      const result = await setupUserNotifications(currentUser.uid);
      console.log('📊 Setup result:', result);
      
      if (result.success) {
        await checkNotificationStatus();
        return true;
      } else {
        setError('Failed to setup notifications');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissPermissionPrompt = () => setShowPermissionPrompt(false);

  return (
    <NotificationContext.Provider value={{
      notificationStatus,
      permission,
      notifications,
      loading,
      error,
      showPermissionPrompt,
      requestNotificationPermission,
      dismissPermissionPrompt,
      checkNotificationStatus,
      markAsRead
    }}>
      {children}
      
      {showPermissionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enable Notifications</h3>
                <p className="text-sm text-gray-600">Stay connected with your friends!</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Get notified when friends send you messages, friend requests, and other important updates.
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