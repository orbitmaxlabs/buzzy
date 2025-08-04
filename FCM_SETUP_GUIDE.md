# Firebase Cloud Messaging (FCM) Setup Guide

## Current Issue
The notification system is failing to get real FCM tokens and falling back to fake tokens. This guide will help you fix the FCM configuration.

## Step 1: Get Your VAPID Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `buzzy-d2b2a`
3. Go to Project Settings (gear icon)
4. Go to the "Cloud Messaging" tab
5. Scroll down to "Web configuration"
6. Click "Generate key pair" if you don't have one
7. Copy the "Key pair" (this is your VAPID key)

## Step 2: Update the VAPID Key

Replace the current VAPID key in these files:

### In `src/firebase.js` (line ~400):
```javascript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_NEW_VAPID_KEY_HERE',
  serviceWorkerRegistration: registration
});
```

### In `public/firebase-messaging-sw.js` (if needed):
The service worker doesn't need the VAPID key, but make sure the Firebase config is correct.

## Step 3: Verify Firebase Project Configuration

1. In Firebase Console, go to Project Settings
2. Under "General" tab, verify your app is registered
3. Under "Cloud Messaging" tab, ensure:
   - Web Push certificates are generated
   - Your domain is authorized (add `www.adrit.gay` and `adrit.gay`)

## Step 4: Deploy Firebase Functions

Make sure your Firebase Functions are deployed:

```bash
firebase deploy --only functions
```

## Step 5: Test the Configuration

1. Clear your browser cache
2. Reload the app
3. Check the browser console for FCM token generation
4. Look for real tokens instead of fallback tokens

## Common Issues and Solutions

### Issue: "Registration failed - push service error"
**Solution**: 
- Check if your domain is authorized in Firebase Console
- Ensure HTTPS is enabled
- Verify VAPID key is correct

### Issue: Service worker not registering
**Solution**:
- Clear browser cache
- Check if `/firebase-messaging-sw.js` is accessible
- Ensure the service worker file is in the correct location

### Issue: Token generation fails
**Solution**:
- Check browser console for specific error messages
- Verify Firebase project configuration
- Ensure all Firebase services are enabled

## Debugging Steps

1. Open browser console
2. Look for FCM-related logs
3. Check if real tokens are being generated
4. Verify service worker registration
5. Test notification sending

## Expected Behavior

After fixing the configuration:
- Real FCM tokens should be generated (not fallback tokens)
- Notifications should be sent via Firebase Functions
- Service worker should handle background notifications
- No more "fallback token" messages in console

## Contact

If you continue to have issues, check:
1. Firebase Console logs
2. Browser console for specific errors
3. Network tab for failed requests
4. Service worker status in browser dev tools 