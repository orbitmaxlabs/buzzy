import { sendNotificationToUser } from '../firebase';

// Send friend request notification
export const sendFriendRequestNotification = async (fromUser, toUser) => {
  try {
    const notification = {
      title: 'New Friend Request',
      body: `${fromUser.username} wants to be your friend!`,
      data: {
        type: 'friend_request',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username
      }
    };

    const result = await sendNotificationToUser(toUser.uid, notification);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send friend request response notification
export const sendFriendRequestResponseNotification = async (fromUser, toUser, accepted) => {
  try {
    const action = accepted ? 'accepted' : 'declined';
    const notification = {
      title: 'Friend Request Response',
      body: `${fromUser.username} ${action} your friend request`,
      data: {
        type: 'friend_request_response',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        action: action
      }
    };

    const result = await sendNotificationToUser(toUser.uid, notification);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send friend added notification
export const sendFriendAddedNotification = async (user1, user2) => {
  try {
    // Send notification to user 1
    const notification1 = {
      title: 'New Friend Added',
      body: `You are now friends with ${user2.username}!`,
      data: {
        type: 'friend_added',
        friendUid: user2.uid,
        friendUsername: user2.username
      }
    };

    const result1 = await sendNotificationToUser(user1.uid, notification1);
    
    if (result1.success) {
      // Send notification to user 2
      const notification2 = {
        title: 'New Friend Added',
        body: `You are now friends with ${user1.username}!`,
        data: {
          type: 'friend_added',
          friendUid: user1.uid,
          friendUsername: user1.username
        }
      };

      const result2 = await sendNotificationToUser(user2.uid, notification2);
      
      if (result2.success) {
        return { success: true };
      } else {
        return { success: false, message: result2.message };
      }
    } else {
      return { success: false, message: result1.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send welcome notification
export const sendWelcomeNotification = async (user) => {
  try {
    const notification = {
      title: 'Welcome to Buzzy!',
      body: `Hi ${user.username}! Welcome to Buzzy. Start adding friends to get notifications!`,
      data: {
        type: 'welcome',
        username: user.username
      }
    };

    const result = await sendNotificationToUser(user.uid, notification);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send message notification
export const sendMessageNotification = async (fromUser, toUser, message) => {
  try {
    const notification = {
      title: `Message from ${fromUser.username}`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      data: {
        type: 'message',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        message: message
      }
    };

    const result = await sendNotificationToUser(toUser.uid, notification);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send system notification
export const sendSystemNotification = async (user, title, body, data = {}) => {
  try {
    const notification = {
      title: title,
      body: body,
      data: {
        type: 'system',
        ...data
      }
    };

    const result = await sendNotificationToUser(user.uid, notification);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
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