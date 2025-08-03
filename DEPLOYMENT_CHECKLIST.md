# 🚀 Deployment Checklist for Buzzy Notifications

## ✅ Pre-Deployment Checklist

### 1. Security Setup
- [ ] Service account key added to `.gitignore` ✅
- [ ] Server updated to use environment variables ✅
- [ ] VAPID key replaced in `src/firebase.js` ✅

### 2. Code Review
- [ ] All notification components implemented ✅
- [ ] Service worker configured ✅
- [ ] Backend server created ✅

## 🔐 Step 1: Get Firebase Credentials

### Get Service Account Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `buzzy-d2b2a`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download JSON file
6. **Copy entire content** (you'll need this for environment variable)

### Verify VAPID Key:
- [ ] Check that VAPID key is set in `src/firebase.js` line 47
- [ ] Key should look like: `BFLXQcV7JCNgox4GwERkGd1x7FOM2CYRAf1HDh8uOYcKs9bMiywgWEjmcV_fkCSLLiTDgNOAyJdpvufAEvgD6HM`

## 🚀 Step 2: Deploy Notification Server

### Option A: Railway (Recommended)
```bash
cd server
npm install
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option B: Heroku
```bash
cd server
npm install
git init
git add .
git commit -m "Initial notification server"
heroku create your-buzzy-notifications
git push heroku main
```

### Option C: Vercel
```bash
cd server
npm install -g vercel
vercel
```

## 🔧 Step 3: Configure Environment Variables

### In Railway Dashboard:
1. Go to your project → **Variables** tab
2. Add variable: `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Value: Paste entire service account JSON content

### In Heroku:
```bash
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### In Vercel Dashboard:
1. Go to project settings → **Environment Variables**
2. Add the same variable and value

## 🔗 Step 4: Update Frontend Server URL

1. Get your deployed server URL (e.g., `https://your-app.railway.app`)
2. Update `src/firebase.js` line 383:
   ```javascript
   const response = await fetch('https://your-actual-server-url.railway.app/api/send-notification', {
   ```

## 🧪 Step 5: Test the Setup

### Local Testing:
```bash
# Test server locally
cd server
npm start

# Test frontend
npm run dev
```

### Production Testing:
1. Build and deploy frontend:
   ```bash
   npm run build
   npm run deploy
   ```
2. Install PWA on phone/desktop
3. Grant notification permissions
4. Send a friend request to test notifications

## 🔍 Step 6: Verify Everything Works

### Check These Points:
- [ ] Notification permission granted
- [ ] FCM token generated and saved to Firestore
- [ ] Notification bell shows in app
- [ ] Background notifications work
- [ ] In-app notifications display
- [ ] Friend request notifications sent

### Debug Commands:
```bash
# Check server logs
railway logs
# or
heroku logs --tail

# Check Firestore collections
# Go to Firebase Console → Firestore → Data
# Look for: notificationTokens, notifications
```

## 🎯 Step 7: Monitor and Optimize

### Monitor:
- [ ] Server response times
- [ ] Notification delivery rates
- [ ] User engagement with notifications
- [ ] Error rates in console

### Optimize:
- [ ] Add rate limiting to server
- [ ] Implement notification preferences
- [ ] Add analytics tracking
- [ ] Optimize notification timing

## 🆘 Troubleshooting

### Common Issues:

**"No service account key found"**
- Check environment variable is set correctly
- Verify JSON format is valid

**"User has no notification token"**
- Check user granted notification permission
- Verify FCM token is saved to Firestore

**"Failed to send notification"**
- Check server logs for errors
- Verify server URL is correct
- Check CORS configuration

**Notifications not showing on device**
- Check browser notification settings
- Verify service worker is registered
- Test with different browsers/devices

## 📞 Support

If you get stuck:
1. Check browser console for errors
2. Check server logs
3. Verify all environment variables
4. Test with a simple notification first

## 🎉 Success!

Once everything is working:
- [ ] Notifications appear on devices
- [ ] Background notifications work
- [ ] In-app notification history shows
- [ ] Friend requests trigger notifications

Your Buzzy app now has professional push notifications! 🚀 