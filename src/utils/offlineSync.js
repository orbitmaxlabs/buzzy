// src/utils/offlineSync.js

import offlineStorage from './offlineStorage.js';
import { 
  sendFriendRequest, 
  respondToFriendRequest, 
  addFriend, 
  removeFriend, 
  updateUserProfile,
  sendNotificationToUser
} from '../firebase.js';

class OfflineSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.setupNetworkListeners();
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 App is back online');
      this.isOnline = true;
      this.syncOfflineActions();
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
   * Add an action to the offline queue
   */
  async queueAction(action) {
    try {
      await offlineStorage.addOfflineAction(action);
      console.log('📝 Action queued for offline sync:', action.type);
      
      // If we're online, try to sync immediately
      if (this.isAppOnline()) {
        this.syncOfflineActions();
      }
    } catch (error) {
      console.error('❌ Failed to queue offline action:', error);
    }
  }

  /**
   * Sync all pending offline actions
   */
  async syncOfflineActions() {
    if (this.syncInProgress || !this.isAppOnline()) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting offline sync...');

    try {
      const pendingActions = await offlineStorage.getPendingOfflineActions();
      console.log(`📋 Found ${pendingActions.length} pending actions to sync`);

      for (const action of pendingActions) {
        await this.processAction(action);
      }

      console.log('✅ Offline sync completed successfully');
    } catch (error) {
      console.error('❌ Offline sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single offline action
   */
  async processAction(action) {
    try {
      console.log(`🔄 Processing action: ${action.type}`, action);

      let result;
      switch (action.type) {
        case 'SEND_FRIEND_REQUEST':
          result = await this.syncFriendRequest(action);
          break;
        case 'RESPOND_TO_FRIEND_REQUEST':
          result = await this.syncFriendRequestResponse(action);
          break;
        case 'ADD_FRIEND':
          result = await this.syncAddFriend(action);
          break;
        case 'REMOVE_FRIEND':
          result = await this.syncRemoveFriend(action);
          break;
        case 'UPDATE_PROFILE':
          result = await this.syncProfileUpdate(action);
          break;
        case 'SEND_NOTIFICATION':
          result = await this.syncNotification(action);
          break;
        default:
          console.warn('⚠️ Unknown action type:', action.type);
          await offlineStorage.updateOfflineActionStatus(action.id, 'failed', 'Unknown action type');
          return;
      }

      if (result.success) {
        await offlineStorage.removeOfflineAction(action.id);
        console.log(`✅ Action ${action.type} synced successfully`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Failed to process action ${action.type}:`, error);
      
      const retryCount = action.retryCount || 0;
      if (retryCount < this.maxRetries) {
        await offlineStorage.updateOfflineActionStatus(action.id, 'retry', error.message);
        console.log(`🔄 Will retry action ${action.type} (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        // Schedule retry
        setTimeout(() => {
          this.syncOfflineActions();
        }, this.retryDelay * (retryCount + 1));
      } else {
        await offlineStorage.updateOfflineActionStatus(action.id, 'failed', error.message);
        console.error(`❌ Action ${action.type} failed permanently after ${this.maxRetries} retries`);
      }
    }
  }

  /**
   * Sync friend request action
   */
  async syncFriendRequest(action) {
    try {
      const { fromUid, toUid } = action.data;
      const result = await sendFriendRequest(fromUid, toUid);
      return { success: true, result };
    } catch (error) {
      // Check if it's a duplicate request error
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('ℹ️ Friend request already exists, marking as successful');
        return { success: true };
      }
      throw error;
    }
  }

  /**
   * Sync friend request response action
   */
  async syncFriendRequestResponse(action) {
    const { requestId, response, fromUid, toUid } = action.data;
    const result = await respondToFriendRequest(requestId, response);
    return { success: true, result };
  }

  /**
   * Sync add friend action
   */
  async syncAddFriend(action) {
    const { userUid, friendUid } = action.data;
    const result = await addFriend(userUid, friendUid);
    return { success: true, result };
  }

  /**
   * Sync remove friend action
   */
  async syncRemoveFriend(action) {
    const { userUid, friendUid } = action.data;
    const result = await removeFriend(userUid, friendUid);
    return { success: true, result };
  }

  /**
   * Sync profile update action
   */
  async syncProfileUpdate(action) {
    const { uid, updates } = action.data;
    const result = await updateUserProfile(uid, updates);
    return { success: true, result };
  }

  /**
   * Sync notification action
   */
  async syncNotification(action) {
    const { targetUid, notification } = action.data;
    const result = await sendNotificationToUser(targetUid, notification);
    return { success: true, result };
  }

  /**
   * Force sync all pending actions
   */
  async forceSync() {
    console.log('🔄 Force syncing offline actions...');
    return this.syncOfflineActions();
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const pendingActions = await offlineStorage.getPendingOfflineActions();
    const failedActions = await offlineStorage.getAllFromStore('offlineActions', 'status', 'failed');
    
    return {
      isOnline: this.isAppOnline(),
      syncInProgress: this.syncInProgress,
      pendingCount: pendingActions.length,
      failedCount: failedActions.length,
      lastSyncAttempt: Date.now()
    };
  }

  /**
   * Clear all failed actions
   */
  async clearFailedActions() {
    const failedActions = await offlineStorage.getAllFromStore('offlineActions', 'status', 'failed');
    const promises = failedActions.map(action => 
      offlineStorage.removeOfflineAction(action.id)
    );
    await Promise.all(promises);
    console.log(`🗑️ Cleared ${failedActions.length} failed actions`);
  }

  /**
   * Retry failed actions
   */
  async retryFailedActions() {
    const failedActions = await offlineStorage.getAllFromStore('offlineActions', 'status', 'failed');
    
    for (const action of failedActions) {
      await offlineStorage.updateOfflineActionStatus(action.id, 'pending');
    }
    
    console.log(`🔄 Reset ${failedActions.length} failed actions to pending`);
    this.syncOfflineActions();
  }
}

// Create and export a singleton instance
const offlineSync = new OfflineSync();
export default offlineSync;
