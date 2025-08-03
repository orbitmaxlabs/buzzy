import { sendNotificationToUser } from '../firebase.js';

// Send friend request notification
export const sendFriendRequestNotification = async (fromUser, toUid) => {
  try {
    console.log('📱 === SEND FRIEND REQUEST NOTIFICATION ===');
    console.log('From user:', fromUser);
    console.log('To UID:', toUid);
    
    const notification = {
      title: 'New Friend Request',
      body: `${fromUser.username} sent you a friend request!`,
      data: {
        type: 'friend_request',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        action: 'view_friend_requests'
      }
    };
    
    await sendNotificationToUser(toUid, notification);
    console.log('✅ Friend request notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending friend request notification:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Send friend request response notification
export const sendFriendRequestResponseNotification = async (fromUser, toUid, accepted) => {
  try {
    console.log('📱 === SEND FRIEND REQUEST RESPONSE NOTIFICATION ===');
    console.log('From user:', fromUser);
    console.log('To UID:', toUid);
    console.log('Accepted:', accepted);
    
    const notification = {
      title: accepted ? 'Friend Request Accepted!' : 'Friend Request Declined',
      body: accepted 
        ? `${fromUser.username} accepted your friend request!`
        : `${fromUser.username} declined your friend request.`,
      data: {
        type: 'friend_request_response',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        accepted: accepted,
        action: accepted ? 'view_friends' : 'view_profile'
      }
    };
    
    await sendNotificationToUser(toUid, notification);
    console.log('✅ Friend request response notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending friend request response notification:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Send friend added notification to both users
export const sendFriendAddedNotification = async (user1Uid, user1Username, user2Username) => {
  try {
    console.log('📱 === SEND FRIEND ADDED NOTIFICATION ===');
    console.log('User 1 UID:', user1Uid);
    console.log('User 1 Username:', user1Username);
    console.log('User 2 Username:', user2Username);
    
    // Send notification to user 1
    const notification1 = {
      title: 'New Friend Added!',
      body: `You are now friends with ${user2Username}!`,
      data: {
        type: 'friend_added',
        friendUsername: user2Username,
        action: 'view_friends'
      }
    };
    
    await sendNotificationToUser(user1Uid, notification1);
    console.log('✅ Friend added notification sent to user 1');
  } catch (error) {
    console.error('❌ Error sending friend added notification to user 1:', error);
  }
};

// Send welcome notification to new users
export const sendWelcomeNotification = async (uid, username) => {
  try {
    console.log('📱 === SEND WELCOME NOTIFICATION ===');
    console.log('UID:', uid);
    console.log('Username:', username);
    
    const notification = {
      title: 'Welcome to Buzzy! 🎉',
      body: `Hi ${username}! Start connecting with friends and stay in the loop!`,
      data: {
        type: 'welcome',
        action: 'view_profile'
      }
    };
    
    await sendNotificationToUser(uid, notification);
    console.log('✅ Welcome notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending welcome notification:', error);
  }
};

// Send cross-device notification to all user devices
export const sendCrossDeviceNotification = async (uid, notification) => {
  try {
    console.log('📱 === SEND CROSS-DEVICE NOTIFICATION ===');
    console.log('UID:', uid);
    console.log('Notification:', notification);
    
    // This will send to all devices where the user is logged in
    await sendNotificationToUser(uid, notification);
    console.log('✅ Cross-device notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending cross-device notification:', error);
  }
};

// Send message notification
export const sendMessageNotification = async (fromUser, toUid, messageText) => {
  try {
    console.log('📱 === SEND MESSAGE NOTIFICATION ===');
    console.log('From user:', fromUser);
    console.log('To UID:', toUid);
    console.log('Message:', messageText);
    
    const notification = {
      title: `New message from ${fromUser.username}`,
      body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
      data: {
        type: 'message',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        messageText: messageText,
        action: 'view_messages'
      }
    };
    
    await sendNotificationToUser(toUid, notification);
    console.log('✅ Message notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
  }
};

// Send system notification
export const sendSystemNotification = async (uid, title, body, data = {}) => {
  try {
    console.log('📱 === SEND SYSTEM NOTIFICATION ===');
    console.log('UID:', uid);
    console.log('Title:', title);
    console.log('Body:', body);
    console.log('Data:', data);
    
    const notification = {
      title,
      body,
      data: {
        type: 'system',
        ...data
      }
    };
    
    await sendNotificationToUser(uid, notification);
    console.log('✅ System notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending system notification:', error);
  }
};

// Check if notifications are supported and enabled
export const checkNotificationSupport = () => {
  const support = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    permission: 'Notification' in window ? Notification.permission : 'unsupported'
  };
  
  console.log('📱 === NOTIFICATION SUPPORT CHECK ===');
  console.log('Support details:', support);
  
  return support;
};

// Request notification permission with better UX
export const requestNotificationPermissionWithUX = async () => {
  try {
    console.log('📱 === REQUEST NOTIFICATION PERMISSION WITH UX ===');
    
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }
    
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
    }
    
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }
    
    // Show a custom prompt before requesting permission
    const userConfirmed = confirm(
      'Buzzy would like to send you notifications to keep you updated about friend requests and messages. Would you like to enable notifications?'
    );
    
    if (!userConfirmed) {
      console.log('❌ User declined notification permission');
      return false;
    }
    
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}; 