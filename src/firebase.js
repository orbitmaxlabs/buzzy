// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Load Firebase configuration from a single shared file
const firebaseConfig = await fetch('/firebase-config.json').then(res => res.json());

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
  console.log('Firebase messaging initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase messaging:', error);
}
export { messaging };

// Random emoji generator for profile pictures
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👻', '👽', '🤖', '😈', '👿', '👹', '👺', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🦏', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐇', '🐿️', '🦔', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌸', '🌼', '🌻', '🌺', '🥀', '🌹', '🌷', '💐', '🌾', '🍄', '🍁', '🍂', '🍃', '🎋', '🎍', '🍀', '☘️', '🌿', '🌱', '🌴', '🌳', '🌲', '🎄', '🌵', '🐲', '🐉', '🦔', '🐿️', '🐇', '🐀', '🐁', '🦥', '🦦', '🦫', '🦡', '🦨', '🦝', '🐇', '🕊️', '🦩', '🦢', '🦜', '🦚', '🦃', '🐓', '🐈‍⬛', '🐈', '🐕‍🦺', '🦮', '🐩', '🐕', '🦌', '🐐', '🐑', '🐏', '🐖', '🐎', '🐄', '🐂', '🐃', '🦒', '🦙', '🐫', '🐪', '🦏', '🦛', '🐘', '🦍', '🦓', '🐆', '🐅', '🐊', '🦈', '🐋', '🐳', '🐬', '🐟', '🐠', '🐡', '🦀', '🦞', '🦐', '🦑', '🐙', '🦕', '🦖', '🦎', '🐍', '🐢', '🦂', '🕸️', '🕷️', '🦗', '🦟', '🐜', '🐞', '🐌', '🦋', '🐛', '🐝', '🦄', '🐴', '🐗', '🐺', '🦇', '🦉', '🦅', '🦆', '🐥', '🐣', '🐤', '🐦', '🐧', '🐔', '🐒', '🙊', '🙉', '🙈', '🐵', '🐸', '🐷', '🐮', '🦁', '🐯', '🐨', '🐼', '🐻', '🦊', '🐰', '🐹', '🐭', '🐶', '🐱', '😾', '😿', '🙀', '😽', '😼', '😻', '😹', '😸', '😺', '🤖', '👽', '👻', '👺', '👹', '🤠', '🤑', '🤕', '🤒', '😷', '🤧', '🤮', '🤢', '🥴', '🤐', '😵', '😪', '🤤', '😴', '🥱', '😲', '😮', '😧', '😦', '😯', '😑', '😐', '😶', '🤥', '🤫', '🤭', '🤔', '🤗', '😓', '😥', '😰', '😨', '😱', '🥶', '🥵', '😳', '🤯', '🤬', '😡', '😠', '😤', '😭', '😢', '🥺', '😩', '😫', '😖', '😣', '☹️', '🙁', '😕', '😟', '😔', '😞', '😒', '😏', '🥳', '🤩', '😎', '🤓', '🧐', '🤨', '🤪', '😜', '😝', '😛', '😋', '😚', '😙', '😗', '😘', '🥰', '😍', '😌', '😉', '🙃', '🙂', '😇', '😊', '🤣', '😂', '😅', '😆', '😁', '😄', '😃', '😀'];

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
    lastActive: new Date()
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
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '>=', username), where('username', '<=', username + '\uf8ff'));
  const querySnapshot = await getDocs(q);
  
  const users = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });
  
  return users;
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
      console.log(`Cleaned up ${duplicateDocs.length} duplicate friend entries for user ${uid}`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate friends:', error);
  }
};

export default app;

// Simplified notification functions
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
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }
    
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }
    
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
    }
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied by user');
      }
    }
    
    // Register service worker if needed
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }
    
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
    }
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM',
      serviceWorkerRegistration: registration
    });
    
    if (!token) {
      throw new Error('Failed to generate FCM token');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting notification token:', error);
    throw error;
  }
};

export const saveNotificationToken = async (uid, token) => {
  try {
    const tokenRef = doc(db, 'notificationTokens', uid);
    const tokenData = {
      token,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    await setDoc(tokenRef, tokenData);
  } catch (error) {
    console.error('Error saving notification token:', error);
    throw error;
  }
};

export const removeNotificationToken = async (uid) => {
  try {
    const tokenRef = doc(db, 'notificationTokens', uid);
    await deleteDoc(tokenRef);
  } catch (error) {
    console.error('Error removing notification token:', error);
    throw error;
  }
};

export const sendNotificationToUser = async (targetUid, notification) => {
  try {
    // Get the user's notification token from Firestore
    const tokenRef = doc(db, 'notificationTokens', targetUid);
    const tokenSnap = await getDoc(tokenRef);
    
    if (!tokenSnap.exists()) {
      return { 
        success: false, 
        message: 'User has no notification token',
        reason: 'no_token'
      };
    }

    const tokenData = tokenSnap.data();
    const token = tokenData.token;
    
    if (!token) {
      return { 
        success: false, 
        message: 'Token is null or empty',
        reason: 'empty_token'
      };
    }
    
    // Send notification via Firebase Functions
    const requestBody = {
      targetUid,
      title: notification.title,
      body: notification.body,
      data: notification.data || {}
    };
    
    const response = await fetch('https://us-central1-buzzy-d2b2a.cloudfunctions.net/sendNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Failed to send notification: ${response.status} ${errorText}`,
        reason: 'function_error'
      };
    }

    const result = await response.json();
    return { ...result, success: true };
  } catch (error) {
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
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
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
    console.log('Foreground message received:', payload);
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
