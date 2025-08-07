import React, { useState, useEffect } from 'react';
import offlineSync from '../utils/offlineSync.js';
import offlineStorage from '../utils/offlineStorage.js';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    pendingCount: 0,
    failedCount: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [storageUsage, setStorageUsage] = useState(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateSyncStatus = async () => {
      try {
        const status = await offlineSync.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Error getting sync status:', error);
      }
    };

    const updateStorageUsage = async () => {
      try {
        const usage = await offlineStorage.getStorageUsage();
        setStorageUsage(usage);
      } catch (error) {
        console.error('Error getting storage usage:', error);
      }
    };

    // Initial updates
    updateOnlineStatus();
    updateSyncStatus();
    updateStorageUsage();

    // Setup listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Periodic updates
    const syncInterval = setInterval(updateSyncStatus, 5000);
    const storageInterval = setInterval(updateStorageUsage, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(syncInterval);
      clearInterval(storageInterval);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await offlineSync.forceSync();
      // Update status after sync
      setTimeout(async () => {
        const status = await offlineSync.getSyncStatus();
        setSyncStatus(status);
      }, 1000);
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear all cached data? This will remove all offline data.')) {
      try {
        await offlineStorage.clearAllData();
        setSyncStatus(prev => ({ ...prev, pendingCount: 0, failedCount: 0 }));
        console.log('Cache cleared successfully');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  };

  const handleRetryFailed = async () => {
    try {
      await offlineSync.retryFailedActions();
      // Update status after retry
      setTimeout(async () => {
        const status = await offlineSync.getSyncStatus();
        setSyncStatus(status);
      }, 1000);
    } catch (error) {
      console.error('Error retrying failed actions:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (syncStatus.syncInProgress) return 'bg-yellow-500';
    if (syncStatus.failedCount > 0) return 'bg-orange-500';
    if (syncStatus.pendingCount > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.failedCount > 0) return `${syncStatus.failedCount} Failed`;
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} Pending`;
    return 'Online';
  };

  if (isOnline && syncStatus.pendingCount === 0 && syncStatus.failedCount === 0 && !syncStatus.syncInProgress) {
    return null; // Don't show indicator when everything is fine
  }

  return (
    <div className="offline-indicator">
      {/* Main indicator */}
      <div 
        className={`offline-status ${getStatusColor()}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="offline-status-icon">
          {!isOnline ? '📡' : syncStatus.syncInProgress ? '🔄' : '📱'}
        </div>
        <div className="offline-status-text">
          {getStatusText()}
        </div>
        <div className="offline-status-arrow">
          {showDetails ? '▲' : '▼'}
        </div>
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="offline-details">
          <div className="offline-details-header">
            <h3>Offline Status</h3>
            <button 
              className="offline-close-btn"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
          </div>

          <div className="offline-details-content">
            {/* Network Status */}
            <div className="offline-status-item">
              <span className="offline-status-label">Network:</span>
              <span className={`offline-status-value ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Sync Status */}
            <div className="offline-status-item">
              <span className="offline-status-label">Sync Status:</span>
              <span className={`offline-status-value ${syncStatus.syncInProgress ? 'text-yellow-600' : 'text-green-600'}`}>
                {syncStatus.syncInProgress ? 'In Progress' : 'Idle'}
              </span>
            </div>

            {/* Pending Actions */}
            {syncStatus.pendingCount > 0 && (
              <div className="offline-status-item">
                <span className="offline-status-label">Pending Actions:</span>
                <span className="offline-status-value text-blue-600">
                  {syncStatus.pendingCount}
                </span>
              </div>
            )}

            {/* Failed Actions */}
            {syncStatus.failedCount > 0 && (
              <div className="offline-status-item">
                <span className="offline-status-label">Failed Actions:</span>
                <span className="offline-status-value text-red-600">
                  {syncStatus.failedCount}
                </span>
              </div>
            )}

            {/* Storage Usage */}
            {storageUsage && (
              <div className="offline-status-item">
                <span className="offline-status-label">Storage:</span>
                <span className="offline-status-value">
                  {formatBytes(storageUsage.usage)} / {formatBytes(storageUsage.quota)}
                  <span className="offline-storage-percentage">
                    ({storageUsage.percentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="offline-actions">
              {syncStatus.pendingCount > 0 && (
                <button 
                  className="offline-action-btn offline-sync-btn"
                  onClick={handleForceSync}
                  disabled={syncStatus.syncInProgress}
                >
                  {syncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
                </button>
              )}

              {syncStatus.failedCount > 0 && (
                <button 
                  className="offline-action-btn offline-retry-btn"
                  onClick={handleRetryFailed}
                >
                  Retry Failed
                </button>
              )}

              <button 
                className="offline-action-btn offline-clear-btn"
                onClick={handleClearCache}
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
