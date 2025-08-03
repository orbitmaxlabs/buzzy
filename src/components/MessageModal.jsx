import React, { useState, useEffect } from 'react';
import { sendMessage } from '../firebase';
import { sendMessageNotification } from '../utils/notificationUtils';
import { useAuth } from '../contexts/AuthContext';

const MessageModal = ({ friend, isOpen, onClose }) => {
  const { currentUser: authUser, userProfile } = useAuth();
  const [sending, setSending] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Pre-written greeting message
  const greetingMessage = "Hey! 👋 Just wanted to say hello and see how you're doing!";

  useEffect(() => {
    if (isOpen && friend && authUser) {
      // Automatically send greeting when modal opens
      sendGreeting();
    }
  }, [isOpen, friend, authUser]);

  const sendGreeting = async () => {
    if (!authUser || !friend) {
      setDebugInfo('ERROR: Missing authUser or friend data');
      return;
    }

    try {
      setSending(true);
      setDebugInfo('Starting to send greeting...');
      
      console.log('=== GREETING DEBUG START ===');
      console.log('Auth User:', authUser.uid, userProfile?.username);
      console.log('Friend:', friend.uid, friend.username);
      console.log('Greeting message:', greetingMessage);
      
      // Step 1: Send the message to Firestore
      setDebugInfo('Step 1: Sending message to Firestore...');
      console.log('Step 1: Sending message to Firestore...');
      
      const messageResult = await sendMessage(authUser.uid, friend.uid, greetingMessage);
      console.log('Message sent to Firestore:', messageResult);
      setDebugInfo('Step 1: ✅ Message sent to Firestore');
      
      // Step 2: Send notification
      setDebugInfo('Step 2: Sending push notification...');
      console.log('Step 2: Sending push notification...');
      
      await sendMessageNotification(userProfile, friend.uid, greetingMessage);
      console.log('Step 2: ✅ Push notification sent');
      setDebugInfo('Step 2: ✅ Push notification sent');
      
      // Step 3: Success
      setDebugInfo('✅ Greeting sent successfully!');
      console.log('=== GREETING DEBUG END: SUCCESS ===');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSending(false);
        setDebugInfo('');
      }, 2000);
      
    } catch (error) {
      console.error('=== GREETING DEBUG ERROR ===', error);
      
      // Check if it's a notification token error
      if (error.message.includes('no notification token') || error.message.includes('User has no notification token')) {
        setDebugInfo(`⚠️ ${friend.username} hasn't enabled notifications yet. The message was sent, but they won't receive a push notification.`);
      } else {
        setDebugInfo(`❌ ERROR: ${error.message}`);
      }
      
      // Keep modal open for 4 seconds to show error
      setTimeout(() => {
        onClose();
        setSending(false);
        setDebugInfo('');
      }, 4000);
    }
  };

  if (!isOpen || !friend) return null;

  return (
    <div className="message-modal-overlay" onClick={onClose}>
      <div className="message-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="message-modal-header">
          <div className="message-modal-user-info">
            <div className="message-modal-avatar">
              <span className="avatar-emoji">{friend.photoURL || '👤'}</span>
            </div>
            <div className="message-modal-user-details">
              <h3 className="message-modal-username">{friend.username}</h3>
              <p className="message-modal-status">Sending greeting...</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="message-modal-content">
          {sending ? (
            <div className="greeting-sending">
              <div className="loading-spinner">
                <svg className="icon animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
              <h3>Sending Greeting to {friend.username}</h3>
              <p className="greeting-message">{greetingMessage}</p>
              
              {/* Debug Info */}
              <div className="debug-info">
                <h4>Debug Info:</h4>
                <pre>{debugInfo}</pre>
              </div>
            </div>
          ) : (
            <div className="greeting-success">
              <div className="success-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              </div>
              <h3>Greeting Sent! 🎉</h3>
              <p>Your greeting has been sent to {friend.username}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal; 