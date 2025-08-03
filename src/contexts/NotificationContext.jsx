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
  const { user } = useAuth();
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
      
      if (granted && user) {
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
      console.log('🎯 === NOTIFICATION SETUP DEBUG START ===');
      console.log('Current user:', user?.uid, user?.email);
      
      if (!user) {
        console.log('❌ No user found, skipping setup');
        return;
      }

      console.log('Step 1: Checking notification permission...');
      if (!('Notification' in window)) {
        throw new Error('Notifications are not supported in this browser');
      }
      
      if (Notification.permission === 'denied') {
        throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
      }
      
      if (Notification.permission === 'default') {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied by user');
        }
      }
      
      console.log('✅ Notification permission granted');

      console.log('Step 2: Getting notification token...');
      const notificationToken = await getNotificationToken();
      console.log('✅ Token received:', notificationToken.substring(0, 20) + '...');
      setToken(notificationToken);
      
      console.log('Step 3: Saving token to Firestore...');
      // Save token to Firestore
      await saveNotificationToken(user.uid, notificationToken);
      console.log('✅ Token saved to Firestore');
      
      console.log('Step 4: Loading existing notifications...');
      // Load existing notifications
      await loadNotifications();
      console.log('✅ Existing notifications loaded');
      
      console.log('Step 5: Setting up foreground message listener...');
      // Setup foreground message listener
      const unsubscribe = onForegroundMessage((payload) => {
        console.log('📨 === FOREGROUND MESSAGE RECEIVED ===');
        console.log('Message payload:', payload);
        console.log('Notification title:', payload.notification?.title);
        console.log('Notification body:', payload.notification?.body);
        console.log('Message data:', payload.data);
        
        // Add the new notification to the list
        const newNotification = {
          id: Date.now().toString(),
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          data: payload.data || {},
          read: false,
          createdAt: new Date()
        };
        console.log('Adding notification to state:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
      });

      console.log('✅ Foreground message listener set up');
      console.log('🎯 === NOTIFICATION SETUP DEBUG END: SUCCESS ===');

      return unsubscribe;
    } catch (error) {
      console.error('🎯 === NOTIFICATION SETUP DEBUG ERROR ===', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setError(error.message);
    }
  };

  // Load user notifications
  const loadNotifications = async () => {
    try {
      if (!user) return;
      
      const userNotifications = await getUserNotifications(user.uid);
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
    if (user && permission === 'granted') {
      setupNotifications();
    }
  }, [user, permission]);

  // Cleanup when user logs out
  useEffect(() => {
    if (!user && token) {
      removeNotificationToken(user?.uid);
      setToken(null);
      setNotifications([]);
    }
  }, [user, token]);

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