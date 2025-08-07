import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'

import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends, 
  addFriend, 
  migrateUserData,
  cleanupDuplicateFriends,
  sendNotificationToUser,
  checkUserNotificationStatus,
  setupUserNotifications,
  getNotificationToken,
  saveNotificationToken,
  doc,
  updateDoc,
  db
} from './firebase.js'
import {
  sendFriendRequestNotification,
  sendFriendAddedNotification
} from './utils/notificationUtils.js'
import { initializePWA } from './utils/pwaUtils.js'
import offlineFirebase from './utils/offlineFirebase.js'
import OfflineIndicator from './components/OfflineIndicator.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import { getRandomHindiMessage } from './utils/hindiMessages.js'

function App() {
  const { currentUser: authUser, userProfile, signInWithGoogle, logout: authLogout, updateProfile } = useAuth()

  // State for friend card interactions
  const [friendCardStates, setFriendCardStates] = useState({})
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState({ type: '', title: '', body: '' })

  // Move these here so they're defined before useEffect
  const loadFriends = useCallback(async () => {
    try {
      const friendsList = await offlineFirebase.getFriends(authUser.uid)
      setFriends(friendsList)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }, [authUser])

  const loadFriendRequests = useCallback(async () => {
    try {
      const requests = await offlineFirebase.getFriendRequests(authUser.uid)
      setFriendRequests(requests)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }, [authUser])

  // Automatic notification setup function
  const setupNotificationsAutomatically = useCallback(async () => {
    if (!authUser) return

    try {
      console.log('🔔 Starting automatic notification setup...')
      
      // Always request permission if not granted
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.log('❌ Notification permission denied by user')
          return
        }
      }
      
      // Always generate and save fresh token if permission is granted
      if (Notification.permission === 'granted') {
        try {
          console.log('🔄 Generating fresh FCM token...')
          const currentToken = await getNotificationToken()
          
          console.log('💾 Saving token to database...')
          await saveNotificationToken(authUser.uid, currentToken)
          
          // Update user profile to enable notifications
          const userRef = doc(db, 'users', authUser.uid)
          await updateDoc(userRef, {
            notificationPermission: 'granted',
            notificationEnabled: true,
            lastTokenUpdate: new Date(),
            lastActive: new Date()
          })
          
          console.log('✅ Notification setup completed successfully')
        } catch (tokenError) {
          console.error('❌ Error generating/saving token:', tokenError)
        }
      }
      
    } catch (error) {
      console.error('❌ Error in automatic notification setup:', error)
    }
  }, [authUser])

  const [currentPage, setCurrentPage] = useState('friends')
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', photoURL: '' })
  const [showProfile, setShowProfile] = useState(false)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)

  useEffect(() => {
    initializePWA().catch(error => console.error('PWA initialization error:', error))
    
    // Initialize offline storage
    const initOfflineStorage = async () => {
      try {
        await offlineFirebase.initialize()
        console.log('✅ Offline storage initialized')
      } catch (error) {
        console.error('❌ Failed to initialize offline storage:', error)
      }
    }
    
    initOfflineStorage()
  }, [])

  useEffect(() => {
    if (authUser && userProfile) {
      migrateUserData(authUser.uid)
      cleanupDuplicateFriends(authUser.uid)
      loadFriends()
      loadFriendRequests()
      
      // Automatically setup notifications
      setupNotificationsAutomatically()
      
      // Show notification prompt for iOS devices if permission is default
      if (Notification.permission === 'default') {
        // Delay the prompt to avoid showing it immediately on app load
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [authUser, userProfile, loadFriends, loadFriendRequests, setupNotificationsAutomatically])

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        username: userProfile.username || '',
        photoURL: userProfile.photoURL || '👤'
      })
    }
  }, [userProfile])

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await offlineFirebase.searchUsersByUsername(searchQuery.trim())
      if (!Array.isArray(results)) {
        setSearchResults([])
        return
      }
      const filtered = results.filter(u =>
        u.uid &&
        u.uid !== authUser?.uid &&
        !friends.some(f => f.uid === u.uid)
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendFriendRequest = async toUid => {
    try {
      const result = await offlineFirebase.sendFriendRequest(authUser.uid, toUid)
      
      // Send notification if online
      if (result && !result.offline) {
        await sendFriendRequestNotification(userProfile, { uid: toUid })
      }
      
      setSearchResults([])
      setSearchQuery('')
      setShowAddFriends(false)
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  const handleRespondToRequest = async (requestId, response) => {
    try {
      const result = await offlineFirebase.respondToFriendRequest(requestId, response)
      
      if (response === 'accepted') {
        const req = friendRequests.find(r => r.id === requestId)
        if (req) {
          const addResult = await offlineFirebase.addFriend(authUser.uid, req.fromUid)
          
          // Send notification if online
          if (addResult && !addResult.offline) {
            await sendFriendAddedNotification(userProfile, req.fromUser)
          }
        }
      }
      
      await loadFriendRequests()
      await loadFriends()
    } catch (error) {
      console.error('Error responding to friend request:', error)
    }
  }

  const handleFriendCardClick = async friend => {
    // Set loading state for this specific friend card
    setFriendCardStates(prev => ({
      ...prev,
      [friend.uid]: { state: 'loading' }
    }))

    try {
      const randomMessage = getRandomHindiMessage()
      const result = await offlineFirebase.sendNotificationToUser(friend.uid, {
        title: userProfile.username,
        body: randomMessage,
        data: { type: 'greeting', fromUid: authUser.uid, fromUsername: userProfile.username }
      })
      
      if (result && result.offline) {
        console.log(`📝 Greeting queued for offline sync to ${friend.username}`)
        // Show success state for offline queuing
        setFriendCardStates(prev => ({
          ...prev,
          [friend.uid]: { state: 'success' }
        }))
        
        // Show popup for offline queuing
        setPopupMessage({
          type: 'success',
          title: 'Greeting Queued',
          body: `Greeting sent to ${friend.username} (will be delivered when online): ${randomMessage}`
        })
        setShowPopup(true)
      } else if (result && result.success) {
        console.log(`✅ Notification sent to ${friend.username}`)
        // Show success state
        setFriendCardStates(prev => ({
          ...prev,
          [friend.uid]: { state: 'success' }
        }))
        
        // Show success popup
        setPopupMessage({
          type: 'success',
          title: 'Greeting Sent!',
          body: `Greeting sent to ${friend.username}: ${randomMessage}`
        })
        setShowPopup(true)
      } else {
        console.log(`❌ Notification failed: ${result.message}`)
        // Show error state
        setFriendCardStates(prev => ({
          ...prev,
          [friend.uid]: { state: 'error' }
        }))
        
        // Show error popup
        setPopupMessage({
          type: 'error',
          title: 'Failed to Send',
          body: `Failed to send greeting to ${friend.username}: ${result.message || 'Unknown error'}`
        })
        setShowPopup(true)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      // Show error state
      setFriendCardStates(prev => ({
        ...prev,
        [friend.uid]: { state: 'error' }
      }))
      
      // Show error popup
      setPopupMessage({
        type: 'error',
        title: 'Failed to Send',
        body: `Failed to send greeting to ${friend.username}: ${error.message || 'Unknown error'}`
      })
      setShowPopup(true)
    }

    // Reset the state after 3 seconds
    setTimeout(() => {
      setFriendCardStates(prev => {
        const newState = { ...prev }
        delete newState[friend.uid]
        return newState
      })
    }, 3000)
  }

  // Auto-hide popup after 4 seconds
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showPopup])

  const handleProfileToggle = () => {
    setShowProfile(!showProfile)
  }

  const handleEditProfile = () => setEditingProfile(true)

  const handleSaveProfile = async () => {
    try {
      // Remove spaces from username
      const cleanedUsername = editForm.username.replace(/\s+/g, '')
      
      if (cleanedUsername.length < 3) {
        alert('Username must be at least 3 characters long')
        return
      }
      
      const result = await offlineFirebase.updateUserProfile(authUser.uid, {
        ...editForm,
        username: cleanedUsername
      })
      setEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      username: userProfile.username || '',
      photoURL: userProfile.photoURL || '👤'
    })
    setEditingProfile(false)
  }

  const handleUsernameChange = (e) => {
    // Remove spaces from username input
    const value = e.target.value.replace(/\s+/g, '')
    setEditForm({ ...editForm, username: value })
  }

  const handleLogout = async () => {
    try {
      await authLogout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleAddFriends = () => setShowAddFriends(true)

  if (!authUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/android/android-launchericon-512-512.png" alt="Gaand" className="login-logo" />
            <h1 className="login-title">Gaand</h1>
            <p className="login-subtitle">Connect with Gaandus.</p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="login-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="login-subtitle">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <OfflineBanner />
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo">
            <img src="/android/android-launchericon-192-192.png" alt="Gaand" className="logo-icon" />
            <span className="logo-text">Gaand</span>
          </div>
        </div>
        <div className="top-bar-right">
          {/* Notification Permission Button for iOS */}
          {Notification.permission === 'default' && (
            <button
              onClick={() => setShowNotificationPrompt(true)}
              className="icon-btn notification-permission-btn"
              title="Enable Notifications"
            >
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </button>
          )}
          <button
            onClick={handleProfileToggle}
            className="icon-btn"
          >
            {showProfile ? (
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
              </svg>
            ) : (
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!showProfile ? (
          <div className="friends-page">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="requests-section">
                <h2 className="section-title">
                  Friend Requests ({friendRequests.length})
                </h2>
                <div className="requests-list">
                  {friendRequests.map(request => (
                    <div
                      key={request.id}
                      className="request-item"
                    >
                      <div className="request-avatar">
                        {request.fromUser?.photoURL || '👤'}
                      </div>
                      <div className="request-info">
                        <p className="request-name">
                          {request.fromUser?.username || 'Unknown User'}
                        </p>
                        <p className="request-username">
                          Wants to be your friend
                        </p>
                      </div>
                      <div className="request-actions">
                        <button
                          onClick={() =>
                            handleRespondToRequest(request.id, 'accepted')
                          }
                          className="accept-btn"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() =>
                            handleRespondToRequest(request.id, 'rejected')
                          }
                          className="deny-btn"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends Grid */}
            <div className="friends-grid">
              {friends.length === 0 ? (
                <div className="empty-friends">
                  <div className="empty-icon">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-3.7 3.7V22h6zm-8-2v-6h-2.5l2.54-7.63A1.5 1.5 0 0 1 13.46 8H15c.8 0 1.54.37 2.01 1l3.7 3.7V22h-6z"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">No friends yet</h3>
                  <p className="empty-message">
                    Add some friends to get started and stay connected!
                  </p>
                  <button
                    onClick={handleAddFriends}
                    className="add-friends-main-btn"
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Friends
                  </button>
                </div>
              ) : (
                friends.map(friend => {
                  const cardState = friendCardStates[friend.uid]
                  return (
                    <div
                      key={friend.uid}
                      onClick={() => handleFriendCardClick(friend)}
                      className={`friend-card ${cardState ? cardState.state : ''}`}
                    >
                      <div className="friend-avatar">
                        <div className="avatar-emoji">
                          {friend.photoURL || '👤'}
                        </div>
                        {cardState && (
                          <div className={`card-status ${cardState.state}`}>
                            {cardState.state === 'loading' && (
                              <div className="loading-spinner">
                                <div className="spinner"></div>
                              </div>
                            )}
                            {cardState.state === 'success' && (
                              <div className="success-tick">✓</div>
                            )}
                            {cardState.state === 'error' && (
                              <div className="error-tick">✕</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <h3 className="friend-name">{friend.username}</h3>
                      </div>
                    </div>
                  )
                })
              )}
            </div>


          </div>
        ) : (
          <div className="profile-page">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                <div className="avatar-emoji large">
                  {userProfile.photoURL || '👤'}
                </div>
              </div>
              <div className="profile-info">
                <div className="profile-name-container">
                  <h2 className="profile-name">
                    {editingProfile ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={handleUsernameChange}
                        placeholder="Enter username (no spaces)"
                        className="edit-input"
                        maxLength="20"
                      />
                    ) : (
                      userProfile.username
                    )}
                  </h2>
                </div>
                <p className="profile-email">{userProfile.email}</p>
                {!editingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="edit-profile-btn"
                  >
                    Edit Username
                  </button>
                )}
                {editingProfile && (
                  <div className="edit-actions">
                    <button
                      onClick={handleSaveProfile}
                      className="save-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Logout
              </button>
            </div>

            {/* Friends List */}
            <div className="friends-section">
              <div className="section-header">
                <h2 className="section-title">Friends ({friends.length})</h2>
                <button
                  onClick={handleAddFriends}
                  className="add-friends-btn"
                  title="Add Friends"
                >
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              <div className="friends-list">
                {friends.map(friend => (
                  <div key={friend.uid} className="profile-friend-item">
                    <div className="friend-avatar">
                      <div className="avatar-emoji">
                        {friend.photoURL || '👤'}
                      </div>
                    </div>
                    <div className="friend-info">
                      <h3 className="friend-name">{friend.username}</h3>
                      <p className="friend-status">Online</p>
                    </div>
                    <button 
                      className="remove-friend-btn"
                      title="Remove Friend"
                    >
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Friends Modal */}
        {showAddFriends && (
          <div className="add-friends-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add Friends</h3>
                <button
                  onClick={() => setShowAddFriends(false)}
                  className="modal-close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={isSearching}
                  className="search-btn"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="search-results">
                  <h4>Search Results</h4>
                  {searchResults.map(user => (
                    <div
                      key={user.uid}
                      className="search-result-item"
                    >
                      <div className="result-avatar">
                        {user.photoURL || '👤'}
                      </div>
                      <div className="result-info">
                        <p className="result-name">{user.username}</p>
                        <p className="result-username">@{user.username}</p>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(user.uid)}
                        className="add-friend-btn"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <PWAInstallPrompt />
      <OfflineIndicator />
      
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="notification-prompt-overlay">
          <div className="notification-prompt">
            <div className="notification-prompt-header">
              <svg className="notification-icon" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <h3>Enable Notifications</h3>
            </div>
            <p className="notification-prompt-text">
              Stay connected with your friends! Get notified when they send you messages or friend requests.
            </p>
            <div className="notification-prompt-actions">
              <button
                onClick={async () => {
                  try {
                    const permission = await Notification.requestPermission()
                    if (permission === 'granted') {
                      await setupNotificationsAutomatically()
                    }
                    setShowNotificationPrompt(false)
                  } catch (error) {
                    console.error('Error requesting notification permission:', error)
                    setShowNotificationPrompt(false)
                  }
                }}
                className="notification-allow-btn"
              >
                Allow Notifications
              </button>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                className="notification-dismiss-btn"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup for notifications */}
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup ${popupMessage.type}`}>
            <h3>{popupMessage.title}</h3>
            <p>{popupMessage.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
