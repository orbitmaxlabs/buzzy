import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './init';

// Emoji utils for profile pictures
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👻', '👽', '🤖', '😈', '👿', '👹', '👺', '💀', '☠️', '💩', '🤡'];

const getRandomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

/**
 * Creates a new user document with unique username and random emoji avatar.
 */
export const createUserProfile = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  const baseUsername = user.displayName || user.email.split('@')[0];
  let username = baseUsername;
  let counter = 1;

  // Ensure username uniqueness
  while (true) {
    const existing = await searchUsersByUsername(username);
    if (existing.length === 0) break;
    username = `${baseUsername}${counter++}`;
  }

  const data = {
    uid: user.uid,
    email: user.email,
    username,
    photoURL: getRandomEmoji(),
    createdAt: new Date(),
    lastActive: new Date(),
    notificationToken: null,
    notificationPermission: 'default',
    notificationEnabled: false,
    lastTokenUpdate: null
  };

  await setDoc(userRef, data);
  return data;
};

/**
 * Fetches a user's profile and migrates photoURL to emoji if needed.
 */
export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const userData = snap.data();

  if (userData.photoURL?.startsWith('http')) {
    const emoji = getRandomEmoji();
    userData.photoURL = emoji;
    await updateUserProfile(uid, { photoURL: emoji });
  }

  return userData;
};

/**
 * Updates fields on a user profile, ensuring unique username.
 */
export const updateUserProfile = async (uid, updates) => {
  if (updates.username) {
    const duplicates = await searchUsersByUsername(updates.username);
    if (duplicates.some(u => u.uid !== uid)) {
      throw new Error('Username already taken');
    }
  }

  await updateDoc(doc(db, 'users', uid), { ...updates, lastActive: new Date() });
};

/**
 * Searches users by username prefix.
 */
export const searchUsersByUsername = async (username) => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', username),
    where('username', '<=', username + '\uf8ff')
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
};
