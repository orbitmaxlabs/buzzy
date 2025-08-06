/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  requestNotificationPermission, 
  getNotificationToken, 
  saveNotificationToken, 
  removeNotificationToken,
  getUserNotifications,
  markNotificationAsRead,
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
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check initial permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted && currentUser) {
        await setupNotifications();
      }
      
      return granted;
    } catch (error) {
      setError(error.message);
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Setup notifications for the current user
  const setupNotifications = async () => {
    try {
      if (!currentUser) {
        return;
      }

      // Get notification token
      const notificationToken = await getNotificationToken();
      setToken(notificationToken);
      
      // Save token to Firestore
      await saveNotificationToken(currentUser.uid, notificationToken);
      
      // Load existing notifications
      await loadNotifications();
      
      // Setup foreground message listener
      const unsubscribe = onForegroundMessage((payload) => {
        const newNotification = {
          id: Date.now().toString(),
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          data: payload.data || {},
          read: false,
          createdAt: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setError(error.message);
    }
  };

  // Load user notifications
  const loadNotifications = async () => {
    try {
      if (!currentUser) return;
      
      const userNotifications = await getUserNotifications(currentUser.uid);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Setup notifications when user logs in
  useEffect(() => {
    if (currentUser && permission === 'granted') {
      setupNotifications();
    }
  }, [currentUser, permission]);

  // Cleanup when user logs out
  useEffect(() => {
    if (!currentUser && token) {
      removeNotificationToken(currentUser?.uid);
      setToken(null);
      setNotifications([]);
    }
  }, [currentUser, token]);

  const value = {
    permission,
    token,
    notifications,
    loading,
    error,
    requestPermission,
    markAsRead,
    clearNotifications,
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 