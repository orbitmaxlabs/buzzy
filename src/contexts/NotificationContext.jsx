/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  setupUserNotifications,
  checkUserNotificationStatus,
  refreshNotificationToken,
  onForegroundMessage
} from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Check notification status when user changes
  useEffect(() => {
    if (currentUser) {
      checkNotificationStatus();
    }
  }, [currentUser]);

  // Auto-setup notifications on app launch
  useEffect(() => {
    if (currentUser && !loading) {
      autoSetupNotifications();
    }
  }, [currentUser, loading]);

  const checkNotificationStatus = async () => {
    try {
      const status = await checkUserNotificationStatus(currentUser.uid);
      setNotificationStatus(status);
      
      // Show permission prompt if needed
      if (status.permission === 'default' && !status.enabled) {
        setShowPermissionPrompt(true);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const autoSetupNotifications = async () => {
    if (!currentUser || loading) return;

    try {
      setLoading(true);
      setError(null);

      // Check if we need to setup notifications
      const status = await checkUserNotificationStatus(currentUser.uid);
      
      if (!status.enabled && status.permission !== 'denied') {
        console.log('🔄 Auto-setting up notifications...');
        await setupUserNotifications(currentUser.uid);
        await checkNotificationStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Auto-setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowPermissionPrompt(false);

      console.log('🔔 User requested notification permission');
      const result = await setupUserNotifications(currentUser.uid);
      
      if (result.success) {
        await checkNotificationStatus();
        return true;
      } else {
        setError('Failed to setup notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await refreshNotificationToken(currentUser.uid);
      
      if (result.success) {
        await checkNotificationStatus();
        return true;
      } else {
        setError('Failed to refresh token');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissPermissionPrompt = () => {
    setShowPermissionPrompt(false);
  };

  return (
    <NotificationContext.Provider value={{
      notificationStatus,
      loading,
      error,
      showPermissionPrompt,
      requestNotificationPermission,
      refreshToken,
      dismissPermissionPrompt,
      checkNotificationStatus
    }}>
      {children}
      
      {/* Modern Permission Prompt */}
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