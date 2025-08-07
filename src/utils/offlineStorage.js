// src/utils/offlineStorage.js

// IndexedDB database name and version
const DB_NAME = 'GaandOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  USERS: 'users',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friendRequests',
  MESSAGES: 'messages',
  OFFLINE_ACTIONS: 'offlineActions',
  USER_PROFILE: 'userProfile'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'uid' });
          usersStore.createIndex('username', 'username', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.FRIENDS)) {
          const friendsStore = db.createObjectStore(STORES.FRIENDS, { keyPath: 'id' });
          friendsStore.createIndex('userUid', 'userUid', { unique: false });
          friendsStore.createIndex('friendUid', 'friendUid', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.FRIEND_REQUESTS)) {
          const requestsStore = db.createObjectStore(STORES.FRIEND_REQUESTS, { keyPath: 'id' });
          requestsStore.createIndex('fromUid', 'fromUid', { unique: false });
          requestsStore.createIndex('toUid', 'toUid', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.OFFLINE_ACTIONS)) {
          const actionsStore = db.createObjectStore(STORES.OFFLINE_ACTIONS, { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionsStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
          db.createObjectStore(STORES.USER_PROFILE, { keyPath: 'uid' });
        }

        console.log('✅ IndexedDB stores created successfully');
      };
    });
  }

  /**
   * Generic method to add data to a store
   */
  async addToStore(storeName, data) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to get data from a store
   */
  async getFromStore(storeName, key) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to get all data from a store
   */
  async getAllFromStore(storeName, indexName = null, query = null) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = indexName ? store.index(indexName).getAll(query) : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to delete data from a store
   */
  async deleteFromStore(storeName, key) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ensure the database is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // User Profile Methods
  async cacheUserProfile(profile) {
    return this.addToStore(STORES.USER_PROFILE, profile);
  }

  async getCachedUserProfile(uid) {
    return this.getFromStore(STORES.USER_PROFILE, uid);
  }

  // Friends Methods
  async cacheFriends(friends) {
    const promises = friends.map(friend => 
      this.addToStore(STORES.FRIENDS, {
        id: `${friend.userUid}_${friend.friendUid}`,
        ...friend,
        cachedAt: Date.now()
      })
    );
    return Promise.all(promises);
  }

  async getCachedFriends(userUid) {
    return this.getAllFromStore(STORES.FRIENDS, 'userUid', userUid);
  }

  async addCachedFriend(friend) {
    return this.addToStore(STORES.FRIENDS, {
      id: `${friend.userUid}_${friend.friendUid}`,
      ...friend,
      cachedAt: Date.now()
    });
  }

  async removeCachedFriend(userUid, friendUid) {
    const id = `${userUid}_${friendUid}`;
    return this.deleteFromStore(STORES.FRIENDS, id);
  }

  // Friend Requests Methods
  async cacheFriendRequests(requests) {
    const promises = requests.map(request => 
      this.addToStore(STORES.FRIEND_REQUESTS, {
        id: request.id || `${request.fromUid}_${request.toUid}`,
        ...request,
        cachedAt: Date.now()
      })
    );
    return Promise.all(promises);
  }

  async getCachedFriendRequests(userUid) {
    const incoming = await this.getAllFromStore(STORES.FRIEND_REQUESTS, 'toUid', userUid);
    const outgoing = await this.getAllFromStore(STORES.FRIEND_REQUESTS, 'fromUid', userUid);
    return [...incoming, ...outgoing];
  }

  async addCachedFriendRequest(request) {
    return this.addToStore(STORES.FRIEND_REQUESTS, {
      id: request.id || `${request.fromUid}_${request.toUid}`,
      ...request,
      cachedAt: Date.now()
    });
  }

  async updateCachedFriendRequest(requestId, updates) {
    const existing = await this.getFromStore(STORES.FRIEND_REQUESTS, requestId);
    if (existing) {
      return this.addToStore(STORES.FRIEND_REQUESTS, {
        ...existing,
        ...updates,
        updatedAt: Date.now()
      });
    }
  }

  // Offline Actions Queue
  async addOfflineAction(action) {
    const offlineAction = {
      ...action,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    return this.addToStore(STORES.OFFLINE_ACTIONS, offlineAction);
  }

  async getPendingOfflineActions() {
    return this.getAllFromStore(STORES.OFFLINE_ACTIONS, 'status', 'pending');
  }

  async updateOfflineActionStatus(actionId, status, error = null) {
    const action = await this.getFromStore(STORES.OFFLINE_ACTIONS, actionId);
    if (action) {
      action.status = status;
      action.updatedAt = Date.now();
      if (error) action.error = error;
      if (status === 'retry') action.retryCount = (action.retryCount || 0) + 1;
      return this.addToStore(STORES.OFFLINE_ACTIONS, action);
    }
  }

  async removeOfflineAction(actionId) {
    return this.deleteFromStore(STORES.OFFLINE_ACTIONS, actionId);
  }

  // Messages Methods
  async cacheMessages(messages) {
    const promises = messages.map(message => 
      this.addToStore(STORES.MESSAGES, {
        id: message.id || `${message.fromUid}_${message.timestamp}`,
        ...message,
        cachedAt: Date.now()
      })
    );
    return Promise.all(promises);
  }

  async getCachedMessages(conversationId) {
    return this.getAllFromStore(STORES.MESSAGES, 'conversationId', conversationId);
  }

  async addCachedMessage(message) {
    return this.addToStore(STORES.MESSAGES, {
      id: message.id || `${message.fromUid}_${message.timestamp}`,
      ...message,
      cachedAt: Date.now()
    });
  }

  // Utility Methods
  async clearAllData() {
    await this.ensureInitialized();
    
    const storeNames = Object.values(STORES);
    const promises = storeNames.map(storeName => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    return Promise.all(promises);
  }

  async getStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: estimate.usage && estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const offlineStorage = new OfflineStorage();
export default offlineStorage;
