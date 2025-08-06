import { sendNotificationToUser } from '../firebase.js';

// Send friend request notification
export const sendFriendRequestNotification = async (fromUser, toUid) => {
  try {
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
    
    const result = await sendNotificationToUser(toUid, notification);
    
    if (result.success) {
      console.log('✅ Friend request notification sent successfully');
    } else {
      console.log('⚠️ Friend request notification failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending friend request notification:', error);
  }
};

// Send friend request response notification
export const sendFriendRequestResponseNotification = async (fromUser, toUid, accepted) => {
  try {
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
    
    const result = await sendNotificationToUser(toUid, notification);
    
    if (result.success) {
      console.log('✅ Friend request response notification sent successfully');
    } else {
      console.log('⚠️ Friend request response notification failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending friend request response notification:', error);
  }
};

// Send friend added notification to both users
export const sendFriendAddedNotification = async (user1Uid, user1Username, user2Username) => {
  try {
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
    
    const result = await sendNotificationToUser(user1Uid, notification1);
    
    if (result.success) {
      console.log('✅ Friend added notification sent to user 1');
    } else {
      console.log('⚠️ Friend added notification failed for user 1:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending friend added notification to user 1:', error);
  }
};

// Send welcome notification to new users
export const sendWelcomeNotification = async (uid, username) => {
  try {
    const notification = {
      title: 'Welcome to Buzzy! 🎉',
      body: `Hi ${username}! Start connecting with friends and stay in the loop!`,
      data: {
        type: 'welcome',
        action: 'view_profile'
      }
    };
    
    const result = await sendNotificationToUser(uid, notification);
    
    if (result.success) {
      console.log('✅ Welcome notification sent successfully');
    } else {
      console.log('⚠️ Welcome notification failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending welcome notification:', error);
  }
};

// Send message notification
export const sendMessageNotification = async (fromUser, toUid, messageText) => {
  try {
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
    
    const result = await sendNotificationToUser(toUid, notification);
    
    if (result.success) {
      console.log('✅ Message notification sent successfully');
    } else {
      console.log('⚠️ Message notification failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
  }
};

// Send system notification
export const sendSystemNotification = async (uid, title, body, data = {}) => {
  try {
    const notification = {
      title,
      body,
      data: {
        type: 'system',
        ...data
      }
    };
    
    const result = await sendNotificationToUser(uid, notification);
    
    if (result.success) {
      console.log('✅ System notification sent successfully');
    } else {
      console.log('⚠️ System notification failed:', result.message);
    }
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
  
  return support;
};

// Request notification permission with better UX
export const requestNotificationPermissionWithUX = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }
    
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    // Show a custom prompt before requesting permission
    const userConfirmed = confirm(
      'Buzzy would like to send you notifications to keep you updated about friend requests and messages. Would you like to enable notifications?'
    );
    
    if (!userConfirmed) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}; 