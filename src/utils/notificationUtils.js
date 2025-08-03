import { sendNotificationToUser } from '../firebase';

// Utility function to send friend request notifications
export const sendFriendRequestNotification = async (fromUser, toUid) => {
  try {
    await sendNotificationToUser(toUid, {
      title: 'New Friend Request',
      body: `${fromUser.username} sent you a friend request`,
      data: {
        type: 'friend_request',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username
      }
    });
  } catch (error) {
    console.error('Error sending friend request notification:', error);
  }
};

// Utility function to send friend request response notifications
export const sendFriendRequestResponseNotification = async (toUser, fromUid, accepted) => {
  try {
    await sendNotificationToUser(fromUid, {
      title: 'Friend Request Response',
      body: `${toUser.username} ${accepted ? 'accepted' : 'declined'} your friend request`,
      data: {
        type: 'friend_request_response',
        toUid: toUser.uid,
        toUsername: toUser.username,
        accepted
      }
    });
  } catch (error) {
    console.error('Error sending friend request response notification:', error);
  }
};

// Utility function to send general notifications
export const sendGeneralNotification = async (targetUid, title, body, data = {}) => {
  try {
    await sendNotificationToUser(targetUid, {
      title,
      body,
      data
    });
  } catch (error) {
    console.error('Error sending general notification:', error);
  }
};

// Utility function to send welcome notification
export const sendWelcomeNotification = async (uid, username) => {
  try {
    await sendNotificationToUser(uid, {
      title: 'Welcome to Buzzy! 🎉',
      body: `Hi ${username}! Welcome to Buzzy. Start connecting with friends and stay in the loop!`,
      data: {
        type: 'welcome',
        username
      }
    });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
};

// Utility function to send friend added notification
export const sendFriendAddedNotification = async (friendUid, friendUsername, currentUsername) => {
  try {
    await sendNotificationToUser(friendUid, {
      title: 'New Friend Added! 👥',
      body: `You and ${currentUsername} are now friends on Buzzy!`,
      data: {
        type: 'friend_added',
        friendUsername: currentUsername
      }
    });
  } catch (error) {
    console.error('Error sending friend added notification:', error);
  }
};

// Utility function to send message notification
export const sendMessageNotification = async (fromUser, toUid, messageText) => {
  try {
    console.log(`📱 Sending message notification...`);
    
    await sendNotificationToUser(toUid, {
      title: `New Message from ${fromUser.username}`,
      body: messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
      data: {
        type: 'message',
        fromUid: fromUser.uid,
        fromUsername: fromUser.username,
        message: messageText
      }
    });
    
    console.log(`✅ Message notification sent successfully`);
    
  } catch (error) {
    console.error(`❌ Failed to send message notification:`, error);
    throw error;
  }
}; 