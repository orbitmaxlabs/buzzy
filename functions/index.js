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

// Send notification to a single user
exports.sendNotification = onRequest({ maxInstances: 10 }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { targetUid, title, body, data = {} } = req.body;

      if (!targetUid || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get the user's notification token from Firestore
      const db = admin.firestore();
      const tokenDoc = await db.collection('notificationTokens').doc(targetUid).get();

      if (!tokenDoc.exists) {
        return res.status(404).json({ error: 'User has no notification token' });
      }

      const tokenData = tokenDoc.data();
      const token = tokenData.token;

      // Send the notification
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        token,
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
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Notification sent successfully', { targetUid, messageId: response });
      res.json({ success: true, messageId: response });
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
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
          const tokenDoc = await db.collection('notificationTokens').doc(targetUid).get();

          if (!tokenDoc.exists) {
            results.push({ targetUid, success: false, error: 'No token found' });
            continue;
          }

          const tokenData = tokenDoc.data();
          const token = tokenData.token;

          // Send the notification
          const message = {
            notification: {
              title,
              body,
            },
            data: {
              ...data,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            token,
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
            sentAt: admin.firestore.FieldValue.serverTimestamp()
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
      service: 'Gaand Notification Functions'
    });
  });
});
