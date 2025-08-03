import React, { useState, useEffect } from 'react';
import { sendMessage, getMessages } from '../firebase';
import { sendMessageNotification } from '../utils/notificationUtils';
import { useAuth } from '../contexts/AuthContext';

const MessageModal = ({ friend, isOpen, onClose }) => {
  const { currentUser: authUser, userProfile } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load messages when modal opens
  useEffect(() => {
    if (isOpen && friend && authUser) {
      loadMessages();
    }
  }, [isOpen, friend, authUser]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messageList = await getMessages(authUser.uid, friend.uid);
      setMessages(messageList);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !authUser || !friend) return;

    try {
      setSending(true);
      console.log('Sending message to friend:', friend.username, friend.uid);
      
      // Send the message
      const messageResult = await sendMessage(authUser.uid, friend.uid, messageText.trim());
      console.log('Message sent successfully:', messageResult);
      
      // Send notification to the friend
      console.log('Sending notification to friend...');
      await sendMessageNotification(userProfile, friend.uid, messageText.trim());
      console.log('Notification sent successfully');
      
      // Clear input and reload messages
      setMessageText('');
      await loadMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = date.toDate ? date.toDate() : new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <p className="message-modal-status">Online</p>
            </div>
          </div>
          <button className="message-modal-close" onClick={onClose}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="message-modal-content">
          {loading ? (
            <div className="message-loading">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="message-empty">
              <div className="message-empty-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p>No messages yet</p>
              <p className="message-empty-subtitle">Start the conversation!</p>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${message.fromUid === authUser.uid ? 'message-sent' : 'message-received'}`}
                >
                  <div className="message-bubble">
                    <p className="message-text">{message.message}</p>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <form className="message-input-container" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="message-input"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="message-send-btn"
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <svg className="icon animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            ) : (
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageModal; 