import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { recoverPushService } from '../utils/pushServiceFix.js';
import { saveNotificationToken } from '../firebase.js';

const PushServiceRecoveryButton = () => {
  const { user } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if we should show the recovery button
  useEffect(() => {
    // Check localStorage to see if we've recently attempted recovery
    const lastRecoveryAttempt = localStorage.getItem('lastPushServiceRecovery');
    if (lastRecoveryAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastRecoveryAttempt);
      // Don't show if we attempted recovery in the last 5 minutes
      if (timeSinceLastAttempt < 5 * 60 * 1000) {
        setShouldShow(false);
        return;
      }
    }

    // Check if there's actually a push service error
    // This will be set by other components when they detect an error
    const checkForError = () => {
      const errorFlag = sessionStorage.getItem('pushServiceError');
      if (errorFlag === 'true' && user) {
        setHasError(true);
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }
    };

    checkForError();
    // Check periodically but not too often
    const interval = setInterval(checkForError, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleRecovery = async () => {
    if (!user) {
      setRecoveryStatus({
        success: false,
        message: 'Please log in first'
      });
      return;
    }

    setIsRecovering(true);
    setRecoveryStatus(null);
    
    try {
      console.log('🔧 Starting push service recovery...');
      
      // Run the recovery
      const result = await recoverPushService();
      
      if (result.success) {
        console.log('✅ Recovery successful, saving token...');
        
        // Save the recovered token
        try {
          await saveNotificationToken(user.uid, result.token);
          
          setRecoveryStatus({
            success: true,
            message: `✅ Notifications fixed! Token generated using strategy ${result.strategy}`,
            details: result
          });
          
          // Mark recovery as attempted
          localStorage.setItem('lastPushServiceRecovery', Date.now().toString());
          // Clear the error flag
          sessionStorage.removeItem('pushServiceError');
          
          // Hide the button after success
          setTimeout(() => {
            setShouldShow(false);
          }, 5000);
          
          // Only reload if absolutely necessary (user can do it manually)
          // Removing automatic reload to prevent loops
          console.log('Recovery successful! You may need to refresh the page to see all changes.');
          
        } catch (saveError) {
          console.error('Failed to save token:', saveError);
          setRecoveryStatus({
            success: false,
            message: '❌ Token generated but failed to save',
            error: saveError.message,
            details: result
          });
        }
        
      } else {
        console.error('Recovery failed:', result);
        setRecoveryStatus({
          success: false,
          message: '❌ Recovery failed',
          error: result.error,
          issues: result.issues,
          details: result
        });
      }
      
    } catch (error) {
      console.error('Recovery error:', error);
      setRecoveryStatus({
        success: false,
        message: '❌ Recovery error',
        error: error.message
      });
    } finally {
      setIsRecovering(false);
    }
  };

  // Don't show if user is not logged in or if we shouldn't show
  if (!user || !shouldShow || !hasError) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '15px',
      maxWidth: '400px',
      border: '2px solid #ff6b6b'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong style={{ color: '#ff6b6b' }}>
          ⚠️ Notification Issue Detected
        </strong>
        <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
          Push service error preventing notifications
        </p>
      </div>

      <button
        onClick={handleRecovery}
        disabled={isRecovering}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isRecovering ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isRecovering ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {isRecovering ? '🔧 Recovering...' : '🔧 Fix Notifications Now'}
      </button>

      {recoveryStatus && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: recoveryStatus.success ? '#d4edda' : '#f8d7da',
          color: recoveryStatus.success ? '#155724' : '#721c24',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <div>{recoveryStatus.message}</div>
          
          {recoveryStatus.error && (
            <div style={{ marginTop: '5px', fontSize: '11px' }}>
              Error: {recoveryStatus.error}
            </div>
          )}
          
          {recoveryStatus.issues && recoveryStatus.issues.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              <strong>Issues found:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {recoveryStatus.issues.map((issue, index) => (
                  <li key={index} style={{ fontSize: '11px' }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              marginTop: '5px',
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          {showDetails && recoveryStatus.details && (
            <pre style={{
              marginTop: '5px',
              fontSize: '10px',
              backgroundColor: '#f5f5f5',
              padding: '5px',
              borderRadius: '3px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(recoveryStatus.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div style={{
        marginTop: '10px',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        This will attempt to fix push notification issues
      </div>
    </div>
  );
};

export default PushServiceRecoveryButton;
