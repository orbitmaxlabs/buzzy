import { sendNotificationToUser } from '../firebase.js';
import { getRandomHindiMessage } from './hindiMessages.js';

export const sendWelcomeNotification = async (userId, username) => {
  try {
    const notification = {
      title: 'Welcome to Gaand!',
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
    const randomMessage = getRandomHindiMessage();
    const notification = {
      title: fromUser.username,
      body: randomMessage,
      data: { type: 'message', fromUid: fromUser.uid, fromUsername: fromUser.username, originalMessage: message }
    };
    const result = await sendNotificationToUser(toUid, notification);
    return result.success ? { success: true } : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}; 