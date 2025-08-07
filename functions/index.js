/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// CORS middleware
const cors = require('cors')({ origin: true });

// Helper function to get user's notification token
const getUserNotificationToken = async (targetUid) => {
  const db = admin.firestore();
  
  // First try to get token from user document
  const userDoc = await db.collection('users').doc(targetUid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData.notificationToken && userData.notificationEnabled) {
      return userData.notificationToken;
    }
  }
  
  // Fallback to notificationTokens collection
  const tokenDoc = await db.collection('notificationTokens').doc(targetUid).get();
  if (tokenDoc.exists) {
    const tokenData = tokenDoc.data();
    return tokenData.token;
  }
  
  return null;
};

// Send notification to a single user
exports.sendNotification = onRequest({ maxInstances: 10 }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { targetUid, title, body, data = {} } = req.body;

      logger.info('Received notification request', { targetUid, title, body });

      if (!targetUid || !title || !body) {
        logger.error('Missing required fields', { targetUid, title, body });
        return res.status(400).json({ 
          error: 'Missing required fields',
          success: false 
        });
      }

      // Get the user's notification token
      const token = await getUserNotificationToken(targetUid);

      if (!token) {
        logger.warn('User has no notification token', { targetUid });
        return res.status(404).json({ 
          error: 'User has no notification token or notifications disabled',
          success: false,
          reason: 'no_token'
        });
      }

      logger.info('Found valid token for user', { targetUid, tokenLength: token.length });

      // Send the notification with proper structure
      const message = {
        notification: {
          title: title,
          body: body,
          icon: '/android/android-launchericon-192-192.png',
          badge: '/android/android-launchericon-48-48.png',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          title: title,
          body: body
        },
        token: token,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'buzzy-notifications',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      logger.info('Sending FCM message', { targetUid, messageId: 'pending' });
      const response = await admin.messaging().send(message);
      
      // Store notification in Firestore for history
      const db = admin.firestore();
      await db.collection('notifications').add({
        targetUid,
        title,
        body,
        data,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId: response
      });

      logger.info('Notification sent successfully', { 
        targetUid, 
        messageId: response,
        title,
        body 
      });
      
      res.json({ 
        success: true, 
        messageId: response,
        title,
        body
      });
    } catch (error) {
      logger.error('Error sending notification:', error);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        logger.warn('Invalid token detected, cleaning up', { targetUid });
        // Token is invalid, remove it from database
        try {
          const db = admin.firestore();
          await db.collection('users').doc(targetUid).update({
            notificationToken: null,
            notificationEnabled: false,
            lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp()
          });
          await db.collection('notificationTokens').doc(targetUid).delete();
          logger.info('Cleaned up invalid token', { targetUid });
        } catch (cleanupError) {
          logger.error('Error cleaning up invalid token:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to send notification',
        success: false,
        reason: error.code || 'unknown_error',
        details: error.message
      });
    }
  });
});

// Send notification to multiple users
exports.sendNotificationToMultiple = onRequest({ maxInstances: 10 }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { targetUids, title, body, data = {} } = req.body;

      if (!targetUids || !Array.isArray(targetUids) || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const db = admin.firestore();
      const results = [];

      for (const targetUid of targetUids) {
        try {
          // Get the user's notification token
          const token = await getUserNotificationToken(targetUid);

          if (!token) {
            results.push({ targetUid, success: false, error: 'No token found' });
            continue;
          }

          // Send the notification
          const message = {
            notification: {
              title: title,
              body: body,
              icon: '/android/android-launchericon-192-192.png',
              badge: '/android/android-launchericon-48-48.png'
            },
            data: {
              ...data,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              title: title,
              body: body
            },
            token: token,
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channel_id: 'buzzy-notifications',
                priority: 'high'
              }
            }
          };

          const response = await admin.messaging().send(message);
          
          // Store notification in Firestore
          await db.collection('notifications').add({
            targetUid,
            title,
            body,
            data,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            messageId: response
          });

          results.push({ targetUid, success: true, messageId: response });
        } catch (error) {
          logger.error(`Error sending notification to ${targetUid}:`, error);
          results.push({ targetUid, success: false, error: error.message });
        }
      }

      logger.info('Batch notification completed', { results });
      res.json({ results });
    } catch (error) {
      logger.error('Error sending notifications:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  });
});

// Health check endpoint
exports.health = onRequest({ maxInstances: 5 }, (req, res) => {
  return cors(req, res, () => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Buzzy Notification Functions'
    });
  });
});
