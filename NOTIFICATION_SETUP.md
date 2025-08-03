# Push Notification Setup Guide for Buzzy

This guide will help you set up professional push notifications for your Buzzy web app.

## What's Been Implemented

✅ **Frontend Components:**
- Notification context and hooks
- Notification bell component with dropdown
- Permission request handling
- In-app notification display
- Service worker for background notifications

✅ **Backend Infrastructure:**
- Firebase Cloud Messaging integration
- Notification server (Express.js)
- Firestore storage for notification tokens and history
- Utility functions for different notification types

## What You Need to Do

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`buzzy-d2b2a`)
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Save it as `server/serviceAccountKey.json`

### 2. Get VAPID Key for Web Push

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Scroll down to "Web configuration"
3. Generate a new key pair
4. Copy the "Key pair" (this is your VAPID key)
5. Replace `'YOUR_VAPID_KEY_HERE'` in `src/firebase.js` line 47

### 3. Deploy the Notification Server

You have several options:

#### Option A: Deploy to Heroku
```bash
cd server
npm install
git init
git add .
git commit -m "Initial commit"
heroku create your-notification-server
git push heroku main
```

#### Option B: Deploy to Railway
```bash
cd server
npm install
# Connect to Railway and deploy
```

#### Option C: Deploy to Vercel
```bash
cd server
npm install
vercel
```

#### Option D: Deploy to Firebase Functions
```bash
# Convert the Express server to Firebase Functions
firebase init functions
# Copy the server logic to functions/index.js
```

### 4. Update Server URL

Once deployed, update the server URL in `src/firebase.js`:
```javascript
const response = await fetch('https://your-actual-server-url.com/api/send-notification', {
```

### 5. Test the Setup

1. Build and deploy your app:
```bash
npm run build
npm run deploy
```

2. Install the PWA on your phone/desktop
3. Grant notification permissions
4. Test by sending a friend request

## How It Works

### Frontend Flow:
1. User grants notification permission
2. App gets FCM token and saves to Firestore
3. Notification bell shows unread count
4. Users can view notifications in dropdown
5. Background notifications work via service worker

### Backend Flow:
1. App calls notification server API
2. Server gets user's FCM token from Firestore
3. Server sends push notification via Firebase Admin SDK
4. Notification appears on user's device
5. Notification is stored in Firestore for in-app display

## Notification Types Implemented

- **Welcome notifications** - When new users sign up
- **Friend request notifications** - When someone sends a friend request
- **Friend request responses** - When someone accepts/declines a request
- **Friend added notifications** - When two users become friends
- **General notifications** - For any custom notifications

## Customization

### Add New Notification Types:
1. Add function in `src/utils/notificationUtils.js`
2. Import and use in your components
3. Update the notification bell styling if needed

### Styling:
- Modify `src/components/NotificationBell.jsx` for UI changes
- Update CSS in `src/App.css` for styling

### Server Features:
- Add rate limiting
- Add authentication
- Add notification scheduling
- Add notification templates

## Troubleshooting

### Common Issues:

1. **Notifications not showing:**
   - Check browser permissions
   - Verify VAPID key is correct
   - Check service worker registration

2. **Server errors:**
   - Verify service account key is correct
   - Check server logs
   - Ensure CORS is configured

3. **Tokens not saving:**
   - Check Firestore rules
   - Verify user authentication

### Debug Steps:
1. Check browser console for errors
2. Check server logs
3. Verify Firestore collections exist
4. Test with Postman/curl

## Security Considerations

1. **Add authentication to your notification server**
2. **Rate limit notification sending**
3. **Validate notification content**
4. **Use environment variables for sensitive data**

## Next Steps

1. Deploy the notification server
2. Test with real devices
3. Add more notification types as needed
4. Implement notification preferences
5. Add notification analytics

## Support

If you encounter issues:
1. Check the browser console
2. Check server logs
3. Verify all configuration steps
4. Test with a simple notification first

The notification system is now fully integrated and ready to provide a professional user experience for your Buzzy app! 