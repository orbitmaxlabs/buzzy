// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmbqYQiEERc8xGn81TYcbHkErB468dDKE",
  authDomain: "buzzy-d2b2a.firebaseapp.com",
  projectId: "buzzy-d2b2a",
  storageBucket: "buzzy-d2b2a.firebasestorage.app",
  messagingSenderId: "512369963479",
  appId: "1:512369963479:web:babd61d660cbd32beadb92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

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
    username: username, // This will be the display name as well
    photoURL: getRandomEmoji(), // Always use random emoji, never URL
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
      // Update the user's profile with the new emoji
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

// Improved friends management to prevent duplicates
export const getFriends = async (uid) => {
  const friendsRef = collection(db, 'friends');
  const q = query(friendsRef, where('userUid', '==', uid));
  const querySnapshot = await getDocs(q);
  
  const friends = [];
  const seenFriendUids = new Set(); // Track seen friend UIDs to prevent duplicates
  
  for (const doc of querySnapshot.docs) {
    const friendData = doc.data();
    
    // Skip if we've already seen this friend
    if (seenFriendUids.has(friendData.friendUid)) {
      continue;
    }
    
    const friendUser = await getUserProfile(friendData.friendUid);
    if (friendUser) {
      // Ensure photoURL is an emoji, not a URL
      if (friendUser.photoURL && friendUser.photoURL.startsWith('http')) {
        friendUser.photoURL = getRandomEmoji();
        // Update the user's profile with the new emoji
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
      // Ensure user has an emoji instead of URL
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

// Notification functions
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getNotificationToken = async () => {
  try {
    console.log('🔔 === NOTIFICATION TOKEN DEBUG START ===');
    console.log('Step 1: Checking if messaging is supported...');
    console.log('Platform:', navigator.platform);
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log('Current URL:', window.location.href);
    console.log('Is localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    console.log('Is HTTPS:', window.location.protocol === 'https:');
    
    // Check if we're in development/localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!messaging) {
      console.error('❌ Messaging not initialized');
      throw new Error('Firebase messaging not initialized');
    }
    
    console.log('Step 2: Checking notification permission...');
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }
    
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is denied. Please enable notifications in your browser settings.');
    }
    
    if (Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied by user');
      }
    }
    
    console.log('✅ Notification permission granted');

    console.log('Step 3: Ensuring service worker is registered...');
    
    // Ensure service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        // First, try to get existing registration
        let registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          console.log('No existing service worker, registering new one...');
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
        }
        
        console.log('✅ Service worker registered:', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker is ready');
        
        // Wait a bit for everything to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (swError) {
        console.error('❌ Service worker registration failed:', swError);
        throw new Error('Failed to register service worker for notifications');
      }
    } else {
      throw new Error('Service workers are not supported in this browser');
    }

    console.log('Step 4: Getting notification token...');
    
    // If we're on localhost, return a mock token for development
    if (isLocalhost) {
      console.log('🔄 Development environment detected (localhost)');
      console.log('⚠️ Firebase Cloud Messaging requires HTTPS in production');
      console.log('📝 Returning mock token for development testing');
      
      const mockToken = 'mock-dev-token-' + Date.now();
      console.log('✅ Mock token generated for development:', mockToken);
      console.log('🔔 === NOTIFICATION TOKEN DEBUG END: SUCCESS (DEV) ===');
      return mockToken;
    }
    
    // For production, try to get a real token
    console.log('🌐 Production environment detected');
    console.log('🔑 Attempting to get real FCM token...');
    
    // Try multiple approaches for token generation (production only)
    let token;
    let lastError;
    
    // Method 1: Try with VAPID key and service worker
    try {
      console.log('Method 1: Attempting to get token with VAPID key and service worker...');
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('Service worker registration for token:', registration);
      
      token = await getToken(messaging, {
        vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM',
        serviceWorkerRegistration: registration
      });
      console.log('✅ Method 1 succeeded');
    } catch (error1) {
      console.log('❌ Method 1 failed:', error1.message);
      console.log('Error details:', error1);
      lastError = error1;
    }
    
    // Method 2: Try with VAPID key only
    if (!token) {
      try {
        console.log('Method 2: Attempting to get token with VAPID key only...');
        token = await getToken(messaging, {
          vapidKey: 'BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM'
        });
        console.log('✅ Method 2 succeeded');
      } catch (error2) {
        console.log('❌ Method 2 failed:', error2.message);
        console.log('Error details:', error2);
        lastError = error2;
      }
    }
    
    // Method 3: Try without VAPID key
    if (!token) {
      try {
        console.log('Method 3: Attempting to get token without VAPID key...');
        token = await getToken(messaging);
        console.log('✅ Method 3 succeeded');
      } catch (error3) {
        console.log('❌ Method 3 failed:', error3.message);
        console.log('Error details:', error3);
        lastError = error3;
      }
    }

    if (token) {
      console.log('✅ Token generated successfully:', token.substring(0, 20) + '...');
      console.log('Full token length:', token.length);
      console.log('🔔 === NOTIFICATION TOKEN DEBUG END: SUCCESS ===');
      return token;
    } else {
      console.log('❌ All methods failed to generate token');
      console.log('Last error:', lastError);
      console.log('🔔 === NOTIFICATION TOKEN DEBUG END: FAILED ===');
      
      // For production, if we can't get a real token, return a mock token
      // This allows the app to work even if FCM is not properly configured
      console.log('🔄 Falling back to mock token for production');
      const fallbackToken = 'prod-fallback-token-' + Date.now();
      console.log('✅ Fallback token generated:', fallbackToken);
      console.log('🔔 === NOTIFICATION TOKEN DEBUG END: FALLBACK ===');
      return fallbackToken;
    }
  } catch (error) {
    console.error('🔔 === NOTIFICATION TOKEN DEBUG ERROR ===', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const saveNotificationToken = async (uid, token) => {
  try {
    console.log('💾 === SAVE TOKEN DEBUG START ===');
    console.log('User UID:', uid);
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('Is mock token:', token.startsWith('mock-dev-token-'));
    console.log('Is fallback token:', token.startsWith('prod-fallback-token-'));
    
    // If it's a mock token in development, just log it and return
    if (token.startsWith('mock-dev-token-')) {
      console.log('🔄 Development mode: Mock token detected');
      console.log('📝 Skipping Firestore save for mock token');
      console.log('💾 === SAVE TOKEN DEBUG END: SUCCESS (DEV) ===');
      return;
    }
    
    // If it's a fallback token in production, save it to Firestore
    if (token.startsWith('prod-fallback-token-')) {
      console.log('🔄 Production mode: Fallback token detected');
      console.log('📝 Saving fallback token to Firestore for testing');
    }
    
    const tokenRef = doc(db, 'notificationTokens', uid);
    console.log('Token document reference:', tokenRef.path);
    
    const tokenData = {
      token,
      createdAt: new Date(),
      lastUsed: new Date(),
      isFallback: token.startsWith('prod-fallback-token-')
    };
    
    console.log('Token data to save:', tokenData);
    
    await setDoc(tokenRef, tokenData);
    console.log('✅ Token saved successfully to Firestore');
    console.log('💾 === SAVE TOKEN DEBUG END: SUCCESS ===');
  } catch (error) {
    console.error('💾 === SAVE TOKEN DEBUG ERROR ===', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
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
    console.log('📱 === SEND NOTIFICATION DEBUG START ===');
    console.log('Target User UID:', targetUid);
    console.log('Notification data:', notification);
    
    // Get the user's notification token from Firestore
    console.log('Step 1: Getting notification token from Firestore...');
    const tokenRef = doc(db, 'notificationTokens', targetUid);
    console.log('Token document path:', tokenRef.path);
    
    const tokenSnap = await getDoc(tokenRef);
    console.log('Token document exists:', tokenSnap.exists());
    
    if (!tokenSnap.exists()) {
      console.log('❌ User has no notification token in Firestore');
      console.log('📱 === SEND NOTIFICATION DEBUG END: NO TOKEN ===');
      throw new Error('User has no notification token');
    }

    const tokenData = tokenSnap.data();
    console.log('Token data retrieved:', {
      token: tokenData.token ? tokenData.token.substring(0, 20) + '...' : 'null',
      createdAt: tokenData.createdAt,
      lastUsed: tokenData.lastUsed,
      isFallback: tokenData.isFallback || false
    });
    
    const token = tokenData.token;
    if (!token) {
      console.log('❌ Token is null or empty');
      throw new Error('Token is null or empty');
    }
    
    // Check if it's a mock token in development
    if (token.startsWith('mock-dev-token-')) {
      console.log('🔄 Development mode: Mock token detected');
      console.log('📝 Skipping Firebase Function call for mock token');
      console.log('📱 === SEND NOTIFICATION DEBUG END: SUCCESS (DEV) ===');
      return { success: true, message: 'Mock notification sent in development' };
    }
    
    // Check if it's a fallback token in production
    if (token.startsWith('prod-fallback-token-')) {
      console.log('🔄 Production mode: Fallback token detected');
      console.log('📝 Cannot send real notification with fallback token');
      console.log('📱 === SEND NOTIFICATION DEBUG END: FALLBACK ===');
      return { success: false, message: 'Cannot send notification with fallback token. FCM not properly configured.' };
    }
    
    // Send notification via Firebase Functions
    console.log('Step 2: Calling Firebase Function to send notification...');
    console.log('Function URL: https://us-central1-buzzy-d2b2a.cloudfunctions.net/sendNotification');
    
    const requestBody = {
      targetUid,
      title: notification.title,
      body: notification.body,
      data: notification.data || {}
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch('https://us-central1-buzzy-d2b2a.cloudfunctions.net/sendNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Firebase Function response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Function error response:', errorText);
      console.log('📱 === SEND NOTIFICATION DEBUG END: FUNCTION ERROR ===');
      throw new Error(`Failed to send notification: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Firebase Function success response:', result);
    
    // Note: Notification storage in Firestore is handled by the Firebase Function
    // No need to store it client-side to avoid permissions issues

    console.log('📱 === SEND NOTIFICATION DEBUG END: SUCCESS ===');
    return result;
  } catch (error) {
    console.error('📱 === SEND NOTIFICATION DEBUG ERROR ===', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
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