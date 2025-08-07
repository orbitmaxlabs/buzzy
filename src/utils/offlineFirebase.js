// src/utils/offlineFirebase.js

import offlineStorage from './offlineStorage.js';
import offlineSync from './offlineSync.js';
import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends, 
  addFriend, 
  removeFriend, 
  updateUserProfile,
  getUserProfile,
  sendNotificationToUser
} from '../firebase.js';

class OfflineFirebase {
  constructor() {
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  /**
   * Initialize offline storage
   */
  async initialize() {
    try {
      await offlineStorage.initialize();
      console.log('✅ OfflineFirebase initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OfflineFirebase:', error);
      throw error;
    }
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 App is back online');
      this.isOnline = true;
      offlineSync.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      console.log('❌ App is offline');
      this.isOnline = false;
    });
  }

  /**
   * Check if the app is currently online
   */
  isAppOnline() {
    return this.isOnline && navigator.onLine;
  }

  /**
   * Get user profile with offline caching
   */
  async getUserProfile(uid) {
    try {
      // Try to get from Firebase first if online
      if (this.isAppOnline()) {
        const profile = await getUserProfile(uid);
        if (profile) {
          // Cache the profile
          await offlineStorage.cacheUserProfile(profile);
          return profile;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get profile from Firebase, trying cache:', error);
    }

    // Fallback to cached data
    const cachedProfile = await offlineStorage.getCachedUserProfile(uid);
    if (cachedProfile) {
      console.log('📱 Using cached user profile');
      return cachedProfile;
    }

    throw new Error('User profile not found');
  }

  /**
   * Search users with offline caching
   */
  async searchUsersByUsername(query) {
    try {
      if (this.isAppOnline()) {
        const users = await searchUsersByUsername(query);
        // Cache search results
        for (const user of users) {
          await offlineStorage.addToStore('users', {
            ...user,
            cachedAt: Date.now()
          });
        }
        return users;
      }
    } catch (error) {
      console.warn('⚠️ Failed to search users from Firebase:', error);
    }

    // Fallback to cached search results
    const cachedUsers = await offlineStorage.getAllFromStore('users');
    const filteredUsers = cachedUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('📱 Using cached search results');
    return filteredUsers;
  }

  /**
   * Get friends with offline caching
   */
  async getFriends(userUid) {
    try {
      if (this.isAppOnline()) {
        const friends = await getFriends(userUid);
        // Cache friends list
        await offlineStorage.cacheFriends(friends);
        return friends;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get friends from Firebase, trying cache:', error);
    }

    // Fallback to cached data
    const cachedFriends = await offlineStorage.getCachedFriends(userUid);
    console.log('📱 Using cached friends list');
    return cachedFriends;
  }

  /**
   * Get friend requests with offline caching
   */
  async getFriendRequests(userUid) {
    try {
      if (this.isAppOnline()) {
        const requests = await getFriendRequests(userUid);
        // Cache friend requests
        await offlineStorage.cacheFriendRequests(requests);
        return requests;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get friend requests from Firebase, trying cache:', error);
    }

    // Fallback to cached data
    const cachedRequests = await offlineStorage.getCachedFriendRequests(userUid);
    console.log('📱 Using cached friend requests');
    return cachedRequests;
  }

  /**
   * Send friend request with offline support
   */
  async sendFriendRequest(fromUid, toUid) {
    const action = {
      type: 'SEND_FRIEND_REQUEST',
      data: { fromUid, toUid }
    };

    if (this.isAppOnline()) {
      try {
        const result = await sendFriendRequest(fromUid, toUid);
        console.log('✅ Friend request sent successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to send friend request online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      
      // Optimistically update local cache
      const newRequest = {
        id: `${fromUid}_${toUid}`,
        fromUid,
        toUid,
        status: 'pending',
        createdAt: new Date(),
        cachedAt: Date.now()
      };
      await offlineStorage.addCachedFriendRequest(newRequest);
      
      console.log('📝 Friend request queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Respond to friend request with offline support
   */
  async respondToFriendRequest(requestId, response) {
    const action = {
      type: 'RESPOND_TO_FRIEND_REQUEST',
      data: { requestId, response }
    };

    if (this.isAppOnline()) {
      try {
        const result = await respondToFriendRequest(requestId, response);
        console.log('✅ Friend request response sent successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to respond to friend request online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      
      // Optimistically update local cache
      await offlineStorage.updateCachedFriendRequest(requestId, {
        status: response,
        respondedAt: new Date()
      });
      
      console.log('📝 Friend request response queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Add friend with offline support
   */
  async addFriend(userUid, friendUid) {
    const action = {
      type: 'ADD_FRIEND',
      data: { userUid, friendUid }
    };

    if (this.isAppOnline()) {
      try {
        const result = await addFriend(userUid, friendUid);
        console.log('✅ Friend added successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to add friend online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      
      // Optimistically update local cache
      const newFriend = {
        userUid,
        friendUid,
        addedAt: new Date(),
        cachedAt: Date.now()
      };
      await offlineStorage.addCachedFriend(newFriend);
      
      console.log('📝 Add friend queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Remove friend with offline support
   */
  async removeFriend(userUid, friendUid) {
    const action = {
      type: 'REMOVE_FRIEND',
      data: { userUid, friendUid }
    };

    if (this.isAppOnline()) {
      try {
        const result = await removeFriend(userUid, friendUid);
        console.log('✅ Friend removed successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to remove friend online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      
      // Optimistically update local cache
      await offlineStorage.removeCachedFriend(userUid, friendUid);
      
      console.log('📝 Remove friend queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Update user profile with offline support
   */
  async updateUserProfile(uid, updates) {
    const action = {
      type: 'UPDATE_PROFILE',
      data: { uid, updates }
    };

    if (this.isAppOnline()) {
      try {
        const result = await updateUserProfile(uid, updates);
        console.log('✅ Profile updated successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to update profile online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      
      // Optimistically update local cache
      const cachedProfile = await offlineStorage.getCachedUserProfile(uid);
      if (cachedProfile) {
        const updatedProfile = { ...cachedProfile, ...updates };
        await offlineStorage.cacheUserProfile(updatedProfile);
      }
      
      console.log('📝 Profile update queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Send notification with offline support
   */
  async sendNotificationToUser(targetUid, notification) {
    const action = {
      type: 'SEND_NOTIFICATION',
      data: { targetUid, notification }
    };

    if (this.isAppOnline()) {
      try {
        const result = await sendNotificationToUser(targetUid, notification);
        console.log('✅ Notification sent successfully');
        return result;
      } catch (error) {
        console.warn('⚠️ Failed to send notification online, queuing for offline sync:', error);
        await offlineSync.queueAction(action);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineSync.queueAction(action);
      console.log('📝 Notification queued for offline sync');
      return { success: true, offline: true };
    }
  }

  /**
   * Force sync all pending actions
   */
  async forceSync() {
    return offlineSync.forceSync();
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return offlineSync.getSyncStatus();
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    return offlineStorage.clearAllData();
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage() {
    return offlineStorage.getStorageUsage();
  }
}

// Create and export a singleton instance
const offlineFirebase = new OfflineFirebase();
export default offlineFirebase;
