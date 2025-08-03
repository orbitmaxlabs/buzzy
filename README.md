# Buzzy - Social Friend Management App

A modern, responsive web application for managing friends and social connections, built with React, Vite, and Firebase.

## Features

### 🔐 Authentication
- Google Sign-in integration
- Secure user profile management
- Automatic user profile creation on first login

### 👥 Friend Management
- **Real User Data**: Display actual user information from Firebase
- **Friend Requests**: Send and receive friend requests with approve/deny functionality
- **Username Search**: Search for users by their username to add as friends
- **Friend List**: View and manage your current friends
- **Remove Friends**: Easily remove friends from your list

### 👤 Profile Management
- **Editable Profile**: Update your display name, username, and avatar (emoji)
- **Real-time Updates**: Changes are immediately reflected across the app
- **Profile Viewing**: View your profile information and friend count

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface with smooth animations
- **Mobile-Friendly**: Optimized for all device sizes
- **PWA Support**: Progressive Web App with offline capabilities
- **Real-time Updates**: Live updates for friend requests and friend lists

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/orbitmaxlabs/buzzy.git
cd buzzy
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Google provider
   - Enable Firestore database
   - Update the Firebase configuration in `src/firebase.js`

4. Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

### Deployment

```bash
npm run deploy
```

## Firebase Configuration

The app uses the following Firebase services:

- **Authentication**: Google Sign-in
- **Firestore**: User profiles, friend requests, and friend relationships

### Database Structure

#### Users Collection (`users/{userId}`)
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  username: string,
  photoURL: string,
  createdAt: timestamp,
  lastActive: timestamp
}
```

#### Friend Requests Collection (`friendRequests/{requestId}`)
```javascript
{
  fromUid: string,
  toUid: string,
  status: 'pending' | 'accepted' | 'declined',
  createdAt: timestamp,
  respondedAt?: timestamp
}
```

#### Friends Collection (`friends/{friendId}`)
```javascript
{
  userUid: string,
  friendUid: string,
  addedAt: timestamp
}
```

## Features in Detail

### Friend Requests
- **Send Requests**: Search for users by username and send friend requests
- **Receive Requests**: View incoming friend requests in a dedicated section
- **Approve/Deny**: Accept or decline friend requests with one-click actions
- **Real-time Updates**: Friend requests appear immediately when received

### User Search
- **Username-based Search**: Find users by their username
- **Smart Filtering**: Automatically excludes current user and existing friends
- **Instant Results**: Real-time search results with user avatars and names

### Profile Editing
- **Display Name**: Update your public display name
- **Username**: Change your unique username for friend searches
- **Avatar**: Set custom emoji avatars
- **Real-time Sync**: Changes are immediately saved to Firebase

## Security

The app implements comprehensive security rules:

- Users can only read/write their own profile data
- Friend requests can only be created by authenticated users
- Users can only access friend requests they're involved in
- All operations require authentication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@adrit.gay or create an issue in the GitHub repository.
