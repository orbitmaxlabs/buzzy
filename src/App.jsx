import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'
import NotificationTest from './components/NotificationTest.jsx'
import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends, 
  addFriend, 
  migrateUserData,
  cleanupDuplicateFriends,
  sendNotificationToUser
} from './firebase.js'
import {
  sendFriendRequestNotification,
  sendFriendAddedNotification
} from './utils/notificationUtils.js'
import { initializePWA } from './utils/pwaUtils.js'

function App() {
  const { currentUser: authUser, userProfile, signInWithGoogle, logout: authLogout, updateProfile } = useAuth()

  // Move these here so they're defined before useEffect
  const loadFriends = useCallback(async () => {
    try {
      const friendsList = await getFriends(authUser.uid)
      setFriends(friendsList)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }, [authUser])

  const loadFriendRequests = useCallback(async () => {
    try {
      const requests = await getFriendRequests(authUser.uid)
      setFriendRequests(requests)
    } catch (error) {
      console.error('Error loading friend requests:', error)
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

  useEffect(() => {
    initializePWA().catch(error => console.error('PWA initialization error:', error))
  }, [])

  useEffect(() => {
    if (authUser && userProfile) {
      migrateUserData(authUser.uid)
      cleanupDuplicateFriends(authUser.uid)
      loadFriends()
      loadFriendRequests()
    }
  }, [authUser, userProfile, loadFriends, loadFriendRequests])

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
      const results = await searchUsersByUsername(searchQuery.trim())
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
      await sendFriendRequest(authUser.uid, toUid)
      await sendFriendRequestNotification(userProfile, { uid: toUid })
      setSearchResults([])
      setSearchQuery('')
      setShowAddFriends(false)
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  const handleRespondToRequest = async (requestId, response) => {
    try {
      await respondToFriendRequest(requestId, response)
      if (response === 'accepted') {
        const req = friendRequests.find(r => r.id === requestId)
        if (req) {
          await addFriend(authUser.uid, req.fromUid)
          await sendFriendAddedNotification(userProfile, req.fromUser)
        }
      }
      await loadFriendRequests()
      await loadFriends()
    } catch (error) {
      console.error('Error responding to friend request:', error)
    }
  }

  const handleFriendCardClick = async friend => {
    try {
      const result = await sendNotificationToUser(friend.uid, {
        title: 'Friend Activity',
        body: `${userProfile.username} sent you a greeting! 👋`,
        data: { type: 'greeting', fromUid: authUser.uid, fromUsername: userProfile.username }
      })
      console.log(result.success
        ? `✅ Notification sent to ${friend.username}`
        : `❌ Notification failed: ${result.message}`)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  const handleProfileToggle = () => {
    setShowProfile(!showProfile)
  }

  const handleEditProfile = () => setEditingProfile(true)

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm)
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
            <img src="/android/android-launchericon-512-512.png" alt="Buzzy" className="login-logo" />
            <h1 className="login-title">Buzzy</h1>
            <p className="login-subtitle">Connect with friends and stay in touch!</p>
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
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo">
            <img src="/android/android-launchericon-192-192.png" alt="Buzzy" className="logo-icon" />
            <span className="logo-text">Buzzy</span>
          </div>
        </div>
        <div className="top-bar-right">
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
                friends.map(friend => (
                  <div
                    key={friend.uid}
                    onClick={() => handleFriendCardClick(friend)}
                    className="friend-card"
                  >
                    <div className="friend-avatar">
                      <div className="avatar-emoji">
                        {friend.photoURL || '👤'}
                      </div>
                    </div>
                    <div className="friend-info">
                      <h3 className="friend-name">{friend.username}</h3>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="bottom-buttons">
              <button className="test-token-btn">
                Test Token
              </button>
              <button className="full-setup-btn">
                Full Setup
              </button>
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
                {editingProfile && (
                  <button className="edit-avatar-btn">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name-container">
                  <h2 className="profile-name">
                    {editingProfile ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={e =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        className="edit-input"
                      />
                    ) : (
                      userProfile.username
                    )}
                  </h2>
                  {editingProfile && (
                    <button className="edit-name-btn">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="profile-email">{userProfile.email}</p>
                {!editingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="edit-profile-btn"
                  >
                    Edit Profile
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
                    <button className="remove-friend-btn">
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
      <NotificationTest />
    </div>
  )
}

export default App
