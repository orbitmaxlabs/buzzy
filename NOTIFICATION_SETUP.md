# Buzzy Push Notification System

## Overview

This document describes the comprehensive push notification system implemented in Buzzy. The system ensures that all friends receive proper notifications when users send greetings, with the sender's name as the title and random Hindi messages as the body.

## System Architecture

### 1. Client-Side Components

#### Firebase Configuration (`src/firebase.js`)
- **Token Management**: Generates and stores FCM tokens for each user
- **Notification Setup**: Comprehensive setup function that handles permissions and token generation
- **User Validation**: Ensures users have proper notification tokens and settings
- **Friend Validation**: Checks if friends can receive notifications before sending

#### Notification Utilities (`src/utils/notificationUtils.js`)
- **Message Notifications**: Sends notifications with sender's name and random Hindi messages
- **Greeting Notifications**: Enhanced function for sending greetings to friends
- **Test Functions**: Debug functions to test notification delivery
- **Status Checking**: Functions to verify notification setup

#### Service Worker (`public/firebase-messaging-sw.js`)
- **Background Messages**: Handles notifications when app is in background
- **Click Actions**: Opens app when notification is clicked
- **Fallback Handling**: Handles raw push events for older browsers
- **Proper Data Extraction**: Ensures correct title and body are displayed

### 2. Server-Side Components

#### Firebase Functions (`functions/index.js`)
- **Token Retrieval**: Smart function that checks both user document and separate collection
- **Error Handling**: Comprehensive error handling with automatic token cleanup
- **Notification Storage**: Stores notification history in Firestore
- **Multi-User Support**: Batch notification sending for multiple users

## Key Features

### 1. Professional Notification Setup
- Automatic permission requests
- Token generation and storage
- Validation of notification settings
- Periodic token refresh

### 2. Smart Token Management
- Stores tokens in both user document and separate collection
- Automatic cleanup of invalid tokens
- Token age validation (refreshes after 30 days)
- Fallback mechanisms for token retrieval

### 3. Enhanced Error Handling
- Specific error messages for different failure reasons
- Automatic cleanup of invalid tokens
- Detailed logging for debugging
- User-friendly error messages

### 4. Proper Notification Content
- **Title**: Sender's username (not generic "Buzzy notification")
- **Body**: Random Hindi messages from the collection
- **Data**: Additional metadata for app handling
- **Icons**: Proper app icons for notifications

## Notification Flow

### 1. User Setup
```
User logs in → validateAndSetupNotifications() → 
Check current status → Setup if needed → 
Store token in database → Enable notifications
```

### 2. Sending Greetings
```
User clicks friend card → sendGreetingNotification() → 
Check friend notification status → 
Generate random Hindi message → 
Send notification via Firebase Functions → 
Store notification history → Return result
```

### 3. Receiving Notifications
```
Firebase Functions → FCM → Service Worker → 
Extract title/body from data → 
Show notification with proper content → 
Handle click to open app
```

## Debugging Tools

### 1. Test Functions
```javascript
// Test notification delivery
await sendTestNotification(userId);

// Check notification status
await checkNotificationStatus(userId);
```

### 2. Console Logging
- Comprehensive logging throughout the notification flow
- Clear emoji indicators for different stages
- Detailed error messages with reasons
- Token validation logging

### 3. Firebase Functions Logs
- Request/response logging
- Token validation logging
- Error details with cleanup actions
- Notification delivery confirmation

## Common Issues and Solutions

### 1. "User has no notification token"
**Cause**: User hasn't enabled notifications or token generation failed
**Solution**: 
- Ensure user grants notification permission
- Check browser support for notifications
- Verify service worker registration

### 2. "Notifications disabled"
**Cause**: User has disabled notifications in browser settings
**Solution**: 
- Guide user to browser settings
- Show notification permission request
- Provide clear instructions

### 3. Generic "Buzzy notification" title
**Cause**: Service worker not extracting proper data
**Solution**: 
- Updated service worker to use data fields as fallback
- Enhanced message structure in Firebase Functions
- Proper data extraction in background handler

### 4. Notifications not received
**Cause**: Invalid or expired tokens
**Solution**: 
- Automatic token cleanup in Firebase Functions
- Token refresh mechanism
- Validation before sending

## Testing the System

### 1. Manual Testing
1. Open browser console
2. Run: `await sendTestNotification(currentUserId)`
3. Check if notification appears
4. Verify title and body content

### 2. Friend Testing
1. Add a friend
2. Click on friend card to send greeting
3. Check console for detailed logs
4. Verify notification delivery

### 3. Error Testing
1. Disable notifications in browser
2. Try sending greeting
3. Check for proper error messages
4. Verify graceful handling

## Configuration

### 1. Firebase Configuration
- VAPID key in `src/firebase.js`
- Firebase config in service worker
- Functions configuration in `functions/index.js`

### 2. Notification Settings
- High priority for Android
- Sound and badge for iOS
- Proper icon and badge paths
- Click action configuration

### 3. Hindi Messages
- Collection of explicit Hindi messages in `src/utils/hindiMessages.js`
- Random selection for variety
- Proper encoding and emoji support

## Monitoring

### 1. Firebase Console
- Check Functions logs for delivery status
- Monitor Firestore for notification history
- Verify token storage and cleanup

### 2. Browser Console
- Detailed logging for debugging
- Error tracking and reporting
- Performance monitoring

### 3. User Feedback
- Success/error popups in app
- Clear error messages
- Status indicators on friend cards

## Best Practices

1. **Always validate before sending**: Check friend notification status
2. **Handle errors gracefully**: Provide clear user feedback
3. **Log comprehensively**: Enable debugging and monitoring
4. **Clean up invalid tokens**: Automatic cleanup prevents failures
5. **Test thoroughly**: Use test functions for verification
6. **Monitor delivery**: Track success rates and errors

This notification system ensures reliable delivery of personalized greetings with proper sender identification and engaging Hindi messages.
