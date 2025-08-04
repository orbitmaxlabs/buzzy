# Firebase Cloud Messaging (FCM) Setup Guide

## Current Issue
Your notifications are not working because Firebase Cloud Messaging is failing to generate real tokens due to a "Registration failed - push service error". This is happening because your domain `www.adrit.gay` is not properly configured in Firebase Console.

## Step-by-Step Fix

### 1. Firebase Console Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `buzzy-d2b2a`
3. **Navigate to Project Settings**:
   - Click the gear icon next to "Project Overview"
   - Select "Project settings"

### 2. Add Your Domain to Authorized Domains

1. **In Project Settings, go to the "General" tab**
2. **Scroll down to "Your apps" section**
3. **Find your web app** (should be the one with app ID: `1:512369963479:web:babd61d660cbd32beadb92`)
4. **Click on the web app**
5. **In the app settings, find "Authorized domains"**
6. **Add these domains**:
   - `www.adrit.gay`
   - `adrit.gay`
   - `localhost` (for development)

### 3. Configure Cloud Messaging

1. **In Firebase Console, go to "Cloud Messaging"**
2. **Click on "Web configuration"**
3. **Add your domain to the allowed domains list**
4. **Copy the VAPID key** (should be: `BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM`)

### 4. Verify Service Worker

Your service worker is already configured correctly at `/firebase-messaging-sw.js`. Make sure it's accessible at:
- `https://www.adrit.gay/firebase-messaging-sw.js`

### 5. Test the Configuration

After making these changes:

1. **Deploy your updated code**:
   ```bash
   npm run build
   firebase deploy
   ```

2. **Clear browser cache and reload** the page

3. **Check the browser console** for these messages:
   - ✅ Service Worker registered successfully
   - ✅ Firebase messaging service worker registered
   - ✅ Token generated successfully (should show a real FCM token, not fallback)

### 6. Alternative: Manual Domain Verification

If the above doesn't work, you may need to manually verify your domain:

1. **In Firebase Console, go to "Authentication"**
2. **Click on "Settings" tab**
3. **In "Authorized domains", add**:
   - `www.adrit.gay`
   - `adrit.gay`

### 7. Check Browser Support

Make sure you're using a supported browser:
- Chrome (recommended)
- Firefox
- Safari (iOS)
- Edge

### 8. Debug Steps

If you're still having issues:

1. **Check browser console** for specific error messages
2. **Verify HTTPS**: FCM requires HTTPS in production
3. **Check service worker**: Should be registered and active
4. **Test on different devices**: Try mobile and desktop

### 9. Fallback Solution

If FCM still doesn't work, the app will use fallback tokens and show a message that notifications are not properly configured. Users can still use the app, but won't receive push notifications.

## Expected Behavior After Fix

1. **Real FCM tokens** will be generated (not fallback tokens)
2. **Notifications will be sent** via Firebase Functions
3. **Background notifications** will work when the app is closed
4. **Foreground notifications** will work when the app is open

## Troubleshooting

### Common Issues:

1. **"Registration failed - push service error"**
   - Domain not added to Firebase Console
   - VAPID key not configured correctly
   - Service worker not accessible

2. **"User has no notification token"**
   - Token generation failed
   - User hasn't granted notification permission
   - Service worker not registered

3. **"Cannot send notification with fallback token"**
   - FCM not properly configured
   - Domain not verified in Firebase Console

### Debug Commands:

```bash
# Check Firebase project
firebase projects:list

# Check current project
firebase use

# Deploy functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting
```

## Next Steps

1. Follow the Firebase Console configuration steps above
2. Deploy your updated code
3. Test notifications on both devices
4. Check browser console for success messages
5. If still not working, check the Firebase Console logs for errors

The key issue is that your domain `www.adrit.gay` needs to be properly configured in Firebase Console for FCM to work. Once that's done, you should see real FCM tokens being generated instead of fallback tokens. 