import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowBanner(true);
      } else {
        // Hide banner after a short delay when coming back online
        setTimeout(() => setShowBanner(false), 2000);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (!showBanner || isOnline) {
    return null;
  }

  return (
    <div className="offline-banner">
      <div className="offline-banner-content">
        <span className="offline-banner-icon">📡</span>
        <span className="offline-banner-text">
          You're offline. Some features may be limited, but your actions will be saved and synced when you're back online.
        </span>
        <button 
          className="offline-banner-close"
          onClick={() => setShowBanner(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
