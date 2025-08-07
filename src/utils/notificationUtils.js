import { sendNotificationToUser } from '../firebase';
import { getRandomHindiMessage } from './hindiMessages.js';

export const sendWelcomeNotification = async (userId, username) => {
  try {
    const notification = {
      title: 'Welcome to Buzzy!',
      body: `Welcome ${username}! We're excited to have you on board.`,
      data: { type: 'welcome', userId, username }
    };
    const result = await sendNotificationToUser(userId, notification);
    return result.success ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendFriendRequestNotification = async (fromUser, toUser) => {
  try {
    const notification = {
      title: 'New Friend Request',
      body: `${fromUser.username} wants to be your friend!`,
      data: { type: 'friend_request', fromUid: fromUser.uid, fromUsername: fromUser.username }
    };
    const result = await sendNotificationToUser(toUser.uid, notification);
    return result.success ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendFriendRequestResponseNotification = async (fromUser, toUser, accepted) => {
  try {
    const notification = {
      title: 'Friend Request Response',
      body: `${fromUser.username} ${accepted ? 'accepted' : 'declined'} your friend request`,
      data: { type: 'friend_request_response', fromUid: fromUser.uid, accepted }
    };
    const result = await sendNotificationToUser(toUser.uid, notification);
    return result.success ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendFriendAddedNotification = async (fromUser, toUser) => {
  try {
    const notification = {
      title: 'New Friend Added',
      body: `You and ${fromUser.username} are now friends!`,
      data: { type: 'friend_added', fromUid: fromUser.uid, fromUsername: fromUser.username }
    };
    const result = await sendNotificationToUser(toUser.uid, notification);
    return result.success ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendMessageNotification = async (fromUser, toUid, message) => {
  try {
    console.log('📱 === SENDING MESSAGE NOTIFICATION ===');
    console.log('👤 From:', fromUser.username);
    console.log('👤 To UID:', toUid);
    console.log('📝 Original message:', message);
    
    const randomMessage = getRandomHindiMessage();
    console.log('🎲 Random Hindi message:', randomMessage);
    
    const notification = {
      title: fromUser.username,
      body: randomMessage,
      data: { 
        type: 'message', 
        fromUid: fromUser.uid, 
        fromUsername: fromUser.username, 
        originalMessage: message,
        randomMessage: randomMessage
      }
    };
    
    console.log('📤 Sending notification:', notification);
    const result = await sendNotificationToUser(toUid, notification);
    
    console.log('📥 Notification result:', result);
    
    if (result.success) {
      console.log('✅ Message notification sent successfully');
      return { success: true, message: randomMessage };
    } else {
      console.log('❌ Message notification failed:', result.message);
      return { success: false, message: result.message, reason: result.reason };
    }
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
    return { success: false, message: error.message };
  }
};

// Enhanced function to send greeting notifications
export const sendGreetingNotification = async (fromUser, toUid) => {
  try {
    console.log('🎉 === SENDING GREETING NOTIFICATION ===');
    console.log('👤 From:', fromUser.username);
    console.log('👤 To UID:', toUid);
    
    // Import the ensureFriendNotifications function dynamically
    const { ensureFriendNotifications } = await import('../firebase.js');
    
    // First check if friend can receive notifications
    console.log('🔍 Checking if friend can receive notifications...');
    const friendStatus = await ensureFriendNotifications(toUid);
    
    if (!friendStatus.success) {
      console.log('⚠️ Friend cannot receive notifications:', friendStatus.reason);
      return { 
        success: false, 
        message: `Friend cannot receive notifications: ${friendStatus.reason}`,
        reason: friendStatus.reason
      };
    }
    
    const randomMessage = getRandomHindiMessage();
    console.log('🎲 Random Hindi message:', randomMessage);
    
    const notification = {
      title: fromUser.username,
      body: randomMessage,
      data: { 
        type: 'greeting', 
        fromUid: fromUser.uid, 
        fromUsername: fromUser.username,
        randomMessage: randomMessage
      }
    };
    
    console.log('📤 Sending greeting notification:', notification);
    const result = await sendNotificationToUser(toUid, notification);
    
    console.log('📥 Greeting notification result:', result);
    
    if (result.success) {
      console.log('✅ Greeting notification sent successfully');
      return { success: true, message: randomMessage };
    } else {
      console.log('❌ Greeting notification failed:', result.message);
      return { success: false, message: result.message, reason: result.reason };
    }
  } catch (error) {
    console.error('❌ Error sending greeting notification:', error);
    return { success: false, message: error.message };
  }
}; 

// Test notification function for debugging
export const sendTestNotification = async (uid) => {
  try {
    console.log('🧪 === SENDING TEST NOTIFICATION ===');
    console.log('👤 Testing for user:', uid);
    
    const notification = {
      title: 'Test Notification',
      body: 'This is a test notification to verify the system is working! 🎉',
      data: { 
        type: 'test', 
        timestamp: Date.now(),
        test: true
      }
    };
    
    console.log('📤 Sending test notification:', notification);
    const result = await sendNotificationToUser(uid, notification);
    
    console.log('📥 Test notification result:', result);
    
    if (result.success) {
      console.log('✅ Test notification sent successfully');
      return { success: true, message: 'Test notification sent successfully' };
    } else {
      console.log('❌ Test notification failed:', result.message);
      return { success: false, message: result.message, reason: result.reason };
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return { success: false, message: error.message };
  }
};

// Function to check notification status for debugging
export const checkNotificationStatus = async (uid) => {
  try {
    console.log('🔍 === CHECKING NOTIFICATION STATUS ===');
    console.log('👤 Checking for user:', uid);
    
    // Import the checkUserNotificationStatus function dynamically
    const { checkUserNotificationStatus } = await import('../firebase.js');
    
    const status = await checkUserNotificationStatus(uid);
    console.log('📊 Notification status:', status);
    
    return status;
  } catch (error) {
    console.error('❌ Error checking notification status:', error);
    return { enabled: false, reason: 'error', error: error.message };
  }
}; 