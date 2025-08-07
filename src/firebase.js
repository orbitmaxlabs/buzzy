// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Load Firebase configuration from a single shared file
const configFile = await fetch('/firebase-config.json').then(res => res.json());
const firebaseConfig = {
  apiKey: configFile.apiKey,
  authDomain: configFile.authDomain,
  projectId: configFile.projectId,
  storageBucket: configFile.storageBucket,
  messagingSenderId: configFile.messagingSenderId,
  appId: configFile.appId
};
const vapidKey = configFile.vapidKey;
const functionsUrl = configFile.functionsUrl || 'https://us-central1-buzzy-d2b2a.cloudfunctions.net';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.error('Failed to initialize Firebase messaging:', error);
}
export { messaging };

// Random emoji generator for profile pictures
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👻', '👽', '🤖', '😈', '👿', '👹', '👺', '💀', '☠️', '💩', '🤡'];

const getRandomEmoji = () => {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
};

// User management functions
export const createUserProfile = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  
  // Generate a unique username from email if displayName is not available
  const baseUsername = user.displayName || user.email.split('@')[0];
  let username = baseUsername;
  let counter = 1;
  
  // Check if username already exists and make it unique
  while (true) {
    const existingUser = await searchUsersByUsername(username);
    if (existingUser.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  const userData = {
    uid: user.uid,
    email: user.email,
    username: username,
    photoURL: getRandomEmoji(),
    createdAt: new Date(),
    lastActive: new Date(),
    // Notification settings
    notificationToken: null,
    notificationPermission: 'default',
    notificationEnabled: false,
    lastTokenUpdate: null
  };
  
  await setDoc(userRef, userData);
  return userData;
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    
    // Ensure photoURL is an emoji, not a URL
    if (userData.photoURL && userData.photoURL.startsWith('http')) {
      userData.photoURL = getRandomEmoji();
      await updateUserProfile(uid, { photoURL: userData.photoURL });
    }
    
    return userData;
  } else {
    return null;
  }
};

export const updateUserProfile = async (uid, updates) => {
  const userRef = doc(db, 'users', uid);
  
  // If username is being updated, check for uniqueness
  if (updates.username) {
    const existingUsers = await searchUsersByUsername(updates.username);
    const isDuplicate = existingUsers.some(user => user.uid !== uid);
    if (isDuplicate) {
      throw new Error('Username already taken');
    }
  }
  
  await updateDoc(userRef, { ...updates, lastActive: new Date() });
};

export const searchUsersByUsername = async (username) => {
  try {
    console.log('🔍 Searching users by username:', username);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '>=', username), where('username', '<=', username + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('🔍 Search results:', users.length, 'users found');
    return users;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return [];
  }
};

// Friend requests functions
export const sendFriendRequest = async (fromUid, toUid) => {
  // Check if request already exists
  const requestsRef = collection(db, 'friendRequests');
  const existingQuery = query(
    requestsRef, 
    where('fromUid', '==', fromUid), 
    where('toUid', '==', toUid)
  );
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    throw new Error('Friend request already sent');
  }
  
  const requestData = {
    fromUid,
    toUid,
    status: 'pending',
    createdAt: new Date()
  };
  
  await addDoc(requestsRef, requestData);
};

export const getFriendRequests = async (uid) => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(requestsRef, where('toUid', '==', uid), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);
  
  const requests = [];
  for (const doc of querySnapshot.docs) {
    const requestData = doc.data();
    const fromUser = await getUserProfile(requestData.fromUid);
    requests.push({
      id: doc.id,
      ...requestData,
      fromUser
    });
  }
  
  return requests;
};

export const respondToFriendRequest = async (requestId, response) => {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { 
    status: response, 
    respondedAt: new Date() 
  });
};

// Friends management
export const getFriends = async (uid) => {
  const friendsRef = collection(db, 'friends');
  const q = query(friendsRef, where('userUid', '==', uid));
  const querySnapshot = await getDocs(q);
  
  const friends = [];
  const seenFriendUids = new Set();
  
  for (const doc of querySnapshot.docs) {
    const friendData = doc.data();
    
    if (seenFriendUids.has(friendData.friendUid)) {
      continue;
    }
    
    const friendUser = await getUserProfile(friendData.friendUid);
    if (friendUser) {
      if (friendUser.photoURL && friendUser.photoURL.startsWith('http')) {
        friendUser.photoURL = getRandomEmoji();
        await updateUserProfile(friendUser.uid, { photoURL: friendUser.photoURL });
      }
      
      friends.push({
        id: doc.id,
        ...friendData,
        ...friendUser
      });
      
      seenFriendUids.add(friendData.friendUid);
    }
  }
  
  return friends;
};

export const addFriend = async (userUid, friendUid) => {
  const batch = writeBatch(db);
  const friendsRef = collection(db, 'friends');
  
  // Check if friendship already exists
  const existingQuery1 = query(
    friendsRef, 
    where('userUid', '==', userUid), 
    where('friendUid', '==', friendUid)
  );
  const existingQuery2 = query(
    friendsRef, 
    where('userUid', '==', friendUid), 
    where('friendUid', '==', userUid)
  );
  
  const [existing1, existing2] = await Promise.all([
    getDocs(existingQuery1),
    getDocs(existingQuery2)
  ]);
  
  if (!existing1.empty || !existing2.empty) {
    throw new Error('Friendship already exists');
  }
  
  // Add friend relationship for both users
  const friendDoc1 = doc(friendsRef);
  const friendDoc2 = doc(friendsRef);
  
  batch.set(friendDoc1, {
    userUid,
    friendUid,
    addedAt: new Date()
  });
  
  batch.set(friendDoc2, {
    userUid: friendUid,
    friendUid: userUid,
    addedAt: new Date()
  });
  
  await batch.commit();
};

export const removeFriend = async (userUid, friendUid) => {
  const batch = writeBatch(db);
  const friendsRef = collection(db, 'friends');
  
  // Find and remove friend relationships for both users
  const q1 = query(friendsRef, where('userUid', '==', userUid), where('friendUid', '==', friendUid));
  const q2 = query(friendsRef, where('userUid', '==', friendUid), where('friendUid', '==', userUid));
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  snap1.forEach(doc => batch.delete(doc.ref));
  snap2.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
};

// Migration function to clean up duplicates and ensure all users have emojis
export const migrateUserData = async (uid) => {
  try {
    const userData = await getUserProfile(uid);
    if (userData) {
      if (userData.photoURL && userData.photoURL.startsWith('http')) {
        await updateUserProfile(uid, { photoURL: getRandomEmoji() });
      }
    }
  } catch (error) {
    console.error('Error migrating user data:', error);
  }
};

// Clean up duplicate friend entries
export const cleanupDuplicateFriends = async (uid) => {
  try {
    const friendsRef = collection(db, 'friends');
    const q = query(friendsRef, where('userUid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    const seenFriendUids = new Set();
    const duplicateDocs = [];
    
    querySnapshot.forEach(doc => {
      const friendData = doc.data();
      if (seenFriendUids.has(friendData.friendUid)) {
        duplicateDocs.push(doc.ref);
      } else {
        seenFriendUids.add(friendData.friendUid);
      }
    });
    
    if (duplicateDocs.length > 0) {
      const batch = writeBatch(db);
      duplicateDocs.forEach(docRef => {
        batch.delete(docRef);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error cleaning up duplicate friends:', error);
  }
};

export default app;

// Notification functions
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getNotificationToken = async () => {
  try {
    console.log('🔑 === FCM TOKEN GENERATION START ===');

    if (!messaging) {
      console.log('⚠️ Messaging not initialized, reinitializing…');
      messaging = getMessaging(app);
    }

    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied. Enable it in your browser settings.');
    }
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting permission…');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        throw new Error('User denied notifications');
      }
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }
    console.log('⏳ Waiting for service worker to be ready…');
    // Let Firebase use its dedicated messaging SW (firebase-messaging-sw.js)
    console.log('🔑 Generating FCM token…');
    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      throw new Error('Failed to generate FCM token (empty)');
    }

    console.log('✅ FCM token:', token.substring(0, 20) + '…');
    console.log('🔑 === FCM TOKEN GENERATION COMPLETE ===');
    return token;
  } catch (error) {
    console.error('❌ Error getting notification token:', error);
    throw error;
  }
};


export const saveNotificationToken = async (uid, token) => {
  try {
    // Save token in both places for compatibility
    const tokenRef = doc(db, 'notificationTokens', uid);
    const tokenData = {
      token,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    await setDoc(tokenRef, tokenData);
    
    // Also update the user document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      notificationToken: token,
      lastTokenUpdate: new Date()
    });
  } catch (error) {
    console.error('Error saving notification token:', error);
    throw error;
  }
};

export const removeNotificationToken = async (uid) => {
  try {
    // Remove token from both places
    const tokenRef = doc(db, 'notificationTokens', uid);
    await deleteDoc(tokenRef);
    
    // Also remove from user document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      notificationToken: null,
      notificationEnabled: false,
      lastTokenUpdate: new Date()
    });
  } catch (error) {
    console.error('Error removing notification token:', error);
    throw error;
  }
};

export const sendNotificationToUser = async (targetUid, notification) => {
  try {
    console.log('📱 === SENDING NOTIFICATION ===');
    console.log('👤 Target user:', targetUid);
    console.log('📝 Notification:', notification);
    
    const userRef = doc(db, 'users', targetUid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('❌ User not found');
      return { 
        success: false, 
        message: 'User not found',
        reason: 'user_not_found'
      };
    }

    const userData = userSnap.data();
    const token = userData.notificationToken;
    
    console.log('🔍 User notification data:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      notificationEnabled: userData.notificationEnabled,
      permission: userData.notificationPermission
    });
    
    if (!token) {
      console.log('❌ User has no notification token');
      return { 
        success: false, 
        message: 'User has no notification token',
        reason: 'no_token'
      };
    }
    
    if (!userData.notificationEnabled) {
      console.log('❌ User has notifications disabled');
      return { 
        success: false, 
        message: 'User has notifications disabled',
        reason: 'notifications_disabled'
      };
    }
    
    console.log('📤 Sending notification via Firebase Functions...');
    const requestBody = {
      targetUid,
      title: notification.title,
      body: notification.body,
      data: notification.data || {}
    };
    
    console.log('📤 Request body:', requestBody);
    
    const idToken = await auth.currentUser?.getIdToken?.();
    const response = await fetch(`${functionsUrl}/sendNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Function error:', errorText);
      return { 
        success: false, 
        message: `Failed to send notification: ${response.status} ${errorText}`,
        reason: 'function_error'
      };
    }

    const result = await response.json();
    console.log('✅ Notification sent successfully:', result);
    return { ...result, success: true };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { 
      success: false, 
      message: `Error sending notification: ${error.message}`,
      reason: 'exception'
    };
  }
};

export const getUserNotifications = async (uid) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const notifications = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Message functions
export const sendMessage = async (fromUid, toUid, messageText) => {
  try {
    const messageData = {
      fromUid,
      toUid,
      message: messageText,
      createdAt: new Date(),
      read: false
    };
    
    await addDoc(collection(db, 'messages'), messageData);
    return messageData;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (userUid, friendUid) => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('fromUid', 'in', [userUid, friendUid]),
      where('toUid', 'in', [userUid, friendUid])
    );
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by creation time
    return messages.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Comprehensive notification setup function
export const setupUserNotifications = async (uid) => {
  try {
    console.log('🔔 === NOTIFICATION SETUP START ===');
    console.log('👤 Setting up notifications for user:', uid);
    
    console.log('🔍 Step 1: Checking browser support...');
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser');
      throw new Error('Notifications are not supported in this browser');
    }
    
    console.log('🔍 Step 2: Checking current permission status...');
    const currentPermission = Notification.permission;
    console.log('📱 Current notification permission:', currentPermission);
    
    console.log('🔍 Step 3: Requesting permission if needed...');
    let permissionGranted = false;
    if (currentPermission === 'denied') {
      console.error('❌ Notification permission is denied');
      throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
    } else if (currentPermission === 'default') {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      permissionGranted = permission === 'granted';
    } else if (currentPermission === 'granted') {
      console.log('✅ Permission already granted');
      permissionGranted = true;
    }
    
    if (!permissionGranted) {
      console.error('❌ Notification permission denied by user');
      throw new Error('Notification permission denied by user');
    }
    
    console.log('🔍 Step 4: Generating FCM token...');
    const token = await getNotificationToken();
    console.log('✅ FCM token generated:', token.substring(0, 20) + '...');
    
    console.log('🔍 Step 5: Saving token to database...');
    await saveNotificationToken(uid, token);

    console.log('🔍 Step 6: Updating user profile with notification data...');
    const userRef = doc(db, 'users', uid);
    const updateData = {
      notificationPermission: 'granted',
      notificationEnabled: true,
      lastTokenUpdate: new Date(),
      lastActive: new Date()
    };
    console.log('📝 Updating user document with:', updateData);
    await updateDoc(userRef, updateData);
    console.log('✅ User profile updated successfully');

    console.log('🔍 Step 7: Verifying token storage...');
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    console.log('🔍 Stored token in user document:', {
      hasToken: !!userData.notificationToken,
      tokenLength: userData.notificationToken?.length || 0,
      tokenStart: userData.notificationToken?.substring(0, 20) + '...',
      notificationEnabled: userData.notificationEnabled,
      permission: userData.notificationPermission
    });
    
    console.log('✅ === NOTIFICATION SETUP COMPLETE ===');
    return {
      success: true,
      token: token,
      permission: 'granted'
    };
    
  } catch (error) {
    console.error('❌ === NOTIFICATION SETUP FAILED ===');
    console.error('Error setting up notifications:', error);
    
    console.log('🔍 Updating user profile with error state...');
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      notificationPermission: Notification.permission,
      notificationEnabled: false,
      lastTokenUpdate: new Date(),
      lastActive: new Date()
    });
    
    throw error;
  }
};

// Check if user has notifications enabled
export const checkUserNotificationStatus = async (uid) => {
  try {
    console.log('🔍 === CHECKING NOTIFICATION STATUS ===');
    console.log('👤 Checking status for user:', uid);
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('❌ User not found');
      return { enabled: false, reason: 'user_not_found' };
    }
    
    const userData = userSnap.data();
    const status = {
      enabled: userData.notificationEnabled || false,
      permission: userData.notificationPermission || 'default',
      hasToken: !!userData.notificationToken,
      lastUpdate: userData.lastTokenUpdate
    };
    
    console.log('📊 Notification status:', status);
    console.log('✅ === STATUS CHECK COMPLETE ===');
    return status;
  } catch (error) {
    console.error('❌ Error checking notification status:', error);
    return { enabled: false, reason: 'error' };
  }
};

// Refresh notification token (called periodically)
export const refreshNotificationToken = async (uid) => {
  try {
    console.log('🔄 Refreshing notification token for user:', uid);
    
    // Check current permission
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }
    
    // Generate new token
    const newToken = await getNotificationToken();
    
    // Update user profile
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      notificationToken: newToken,
      lastTokenUpdate: new Date(),
      lastActive: new Date()
    });
    
    // Update separate collection
    await saveNotificationToken(uid, newToken);
    
    console.log('✅ Token refreshed successfully');
    return { success: true, token: newToken };
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    throw error;
  }
};
