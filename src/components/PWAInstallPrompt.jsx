import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎯 === PWA INSTALL PROMPT AVAILABLE ===');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('🎯 === PWA INSTALLED ===');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    if (!checkIfInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    console.log('🎯 === INSTALLING PWA ===');
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User choice:', outcome);
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      setIsInstalled(true);
      setShowInstallPrompt(false);
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="pwa-install-text">
          <h3>Install Buzzy</h3>
          <p>Get the full app experience with notifications and offline access!</p>
        </div>
        <div className="pwa-install-actions">
          <button 
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            Install
          </button>
          <button 
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 