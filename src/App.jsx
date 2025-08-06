import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import RefreshTokenButton from './components/RefreshTokenButton.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'
import FCMDiagnostic from './components/FCMDiagnostic.jsx'

import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends, 
  addFriend, 
  migrateUserData,
  cleanupDuplicateFriends,
  sendNotificationToUser // Added sendNotificationToUser
} from './firebase.js'
import {
  sendFriendRequestNotification,
  sendFriendRequestResponseNotification,
  sendFriendAddedNotification
} from './utils/notificationUtils.js'
import { initializePWA } from './utils/pwaUtils.js'

function App() {
  const { currentUser: authUser, userProfile, signInWithGoogle, logout: authLogout, updateProfile } = useAuth()
  const [currentPage, setCurrentPage] = useState('friends') // 'friends' or 'profile'
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    photoURL: ''
  })

  // Initialize PWA features
  useEffect(() => {
    initializePWA().then(result => {
      console.log('PWA initialization result:', result);
    }).catch(error => {
      console.error('PWA initialization error:', error);
    });
  }, []);

  // Load friends and friend requests when user is authenticated
  useEffect(() => {
    if (authUser && userProfile) {
      // Migrate user data and clean up duplicates
      migrateUserData(authUser.uid)
      cleanupDuplicateFriends(authUser.uid)
      
      loadFriends()
      loadFriendRequests()
    }
  }, [authUser, userProfile])

  // Initialize edit form when user profile changes
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        username: userProfile.username || '',
        photoURL: userProfile.photoURL || '👤'
      })
    }
  }, [userProfile])

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends(authUser.uid)
      setFriends(friendsList)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadFriendRequests = async () => {
    try {
      const requests = await getFriendRequests(authUser.uid)
      setFriendRequests(requests)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsersByUsername(searchQuery.trim())
      // Filter out current user and existing friends
      const filteredResults = results.filter(user => 
        user.uid !== authUser.uid && 
        !friends.some(friend => friend.uid === user.uid)
      )
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendFriendRequest = async (toUid) => {
    try {
      await sendFriendRequest(authUser.uid, toUid)
      // Send notification to the recipient
      await sendFriendRequestNotification(userProfile, toUid)
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.uid !== toUid))
      alert('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      if (error.message === 'Friend request already sent') {
        alert('Friend request already sent to this user')
      } else {
        alert('Failed to send friend request')
      }
    }
  }

  const handleRespondToRequest = async (requestId, response) => {
    try {
      await respondToFriendRequest(requestId, response)
      
      if (response === 'accepted') {
        // Get the request details to add as friend
        const request = friendRequests.find(req => req.id === requestId)
        if (request) {
          await addFriend(authUser.uid, request.fromUid)
          // Send notification to the person who sent the request
          await sendFriendRequestResponseNotification(userProfile, request.fromUid, true)
          // Send friend added notification to both users
          await sendFriendAddedNotification(request.fromUid, request.fromUser?.username || 'Unknown', userProfile.username)
          await loadFriends() // Reload friends list
        }
      } else {
        // Send notification for declined request
        const request = friendRequests.find(req => req.id === requestId)
        if (request) {
          await sendFriendRequestResponseNotification(userProfile, request.fromUid, false)
        }
      }
      
      // Remove from friend requests
      setFriendRequests(prev => prev.filter(req => req.id !== requestId))
      
      alert(response === 'accepted' ? 'Friend request accepted!' : 'Friend request declined')
    } catch (error) {
      console.error('Error responding to friend request:', error)
      if (error.message === 'Friendship already exists') {
        alert('You are already friends with this user')
      } else {
        alert('Failed to respond to friend request')
      }
    }
  }

  const handleFriendCardClick = async (friend) => {
    // Get the friend card element
    const friendCard = document.querySelector(`[data-friend-id="${friend.id}"]`);
    if (!friendCard) return;

    // Show loading state with more obvious visual feedback
    friendCard.style.backgroundColor = '#4a5568';
    friendCard.style.cursor = 'wait';
    friendCard.style.transform = 'scale(0.95)';
    friendCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    
    // Add loading spinner with better visibility
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = `
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 4v6h6" />
        <path d="M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    `;
    loadingSpinner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 32px;
      height: 32px;
      color: #60a5fa;
      z-index: 10;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 50%;
      padding: 8px;
    `;
    
    friendCard.style.position = 'relative';
    friendCard.appendChild(loadingSpinner);

      let successMessage = null;
      let warningMessage = null;
      let errorMessage = null;

      try {
        // Send a notification to the friend
        const notification = {
        title: 'Friend Activity',
        body: `${userProfile?.username || 'Someone'} clicked on your profile!`,
        data: {
          type: 'friend_click',
          fromUser: authUser?.uid,
          friendId: friend.id
        }
      };

      console.log('📱 Sending notification to friend:', friend.username);
      const result = await sendNotificationToUser(friend.id, notification);
      console.log('📱 Notification result:', result);

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Determine success state based on notification result
      const isSuccess = result?.success !== false;
      
        if (isSuccess) {
        // Show success state
        friendCard.style.backgroundColor = '#065f46';
        friendCard.style.transform = 'scale(0.98)';
        friendCard.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        loadingSpinner.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #10b981;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        `;
        loadingSpinner.style.background = 'rgba(34, 197, 94, 0.9)';
        
        // Show a brief success message
        successMessage = document.createElement('div');
        successMessage.textContent = 'Friend clicked!';
        successMessage.style.cssText = `
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          z-index: 20;
          animation: fadeInOut 2s ease-in-out;
        `;
        friendCard.appendChild(successMessage);
      } else {
        // Show error state
        friendCard.style.backgroundColor = '#92400e';
        friendCard.style.transform = 'scale(0.98)';
        friendCard.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
        loadingSpinner.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #f59e0b;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `;
        loadingSpinner.style.background = 'rgba(245, 158, 11, 0.9)';
        
        // Show error message
        warningMessage = document.createElement('div');
        warningMessage.textContent = 'Notification failed';
        warningMessage.style.cssText = `
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: #f59e0b;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          z-index: 20;
          animation: fadeInOut 2s ease-in-out;
        `;
        friendCard.appendChild(warningMessage);
      }
      
      // Remove indicator after 3 seconds
      setTimeout(() => {
        friendCard.style.backgroundColor = '';
        friendCard.style.cursor = 'pointer';
        friendCard.style.transform = '';
        friendCard.style.boxShadow = '';
        friendCard.style.position = '';
        if (friendCard.contains(loadingSpinner)) {
          friendCard.removeChild(loadingSpinner);
        }
        if (successMessage && friendCard.contains(successMessage)) {
          friendCard.removeChild(successMessage);
        }
        if (warningMessage && friendCard.contains(warningMessage)) {
          friendCard.removeChild(warningMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error processing friend card click:', error);
      
      // Show error state with more obvious feedback
      friendCard.style.backgroundColor = '#7f1d1d';
      friendCard.style.transform = 'scale(0.98)';
      friendCard.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
      loadingSpinner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      `;
      loadingSpinner.style.background = 'rgba(239, 68, 68, 0.9)';
      
      // Show error message
      errorMessage = document.createElement('div');
      errorMessage.textContent = 'Error occurred';
      errorMessage.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        z-index: 20;
        animation: fadeInOut 2s ease-in-out;
      `;
      friendCard.appendChild(errorMessage);
      
      // Remove error indicator after 3 seconds
      setTimeout(() => {
        friendCard.style.backgroundColor = '';
        friendCard.style.cursor = 'pointer';
        friendCard.style.transform = '';
        friendCard.style.boxShadow = '';
        friendCard.style.position = '';
        if (friendCard.contains(loadingSpinner)) {
          friendCard.removeChild(loadingSpinner);
        }
        if (errorMessage && friendCard.contains(errorMessage)) {
          friendCard.removeChild(errorMessage);
        }
      }, 3000);
    }
  };



  const handleProfileClick = () => {
    setCurrentPage('profile')
  }

  const handleBackToFriends = () => {
    setCurrentPage('friends')
  }

  const handleEditProfile = () => {
    setEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    try {
      // Validate username
      if (!editForm.username.trim()) {
        alert('Username cannot be empty')
        return
      }
      
      await updateProfile(editForm)
      setEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      if (error.message === 'Username already taken') {
        alert('Username already taken. Please choose a different username.')
      } else {
        alert('Failed to update profile')
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingProfile(false)
    setEditForm({
      username: userProfile?.username || '',
      photoURL: userProfile?.photoURL || '👤'
    })
  }

  const handleLogout = async () => {
    try {
      await authLogout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleAddFriends = () => {
    setShowAddFriends(!showAddFriends)
    setSearchQuery('')
    setSearchResults([])
  }



  // Show login screen if user is not authenticated
  if (!authUser || !userProfile) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <img src="/windows11/Square44x44Logo.scale-100.png" alt="Buzzy Logo" className="login-logo" />
              <h1 className="login-title">Welcome to Buzzy</h1>
              <p className="login-subtitle">Connect with friends and stay in the loop!</p>
            </div>
            <button className="login-btn" onClick={signInWithGoogle}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo">
            <img src="/windows11/Square44x44Logo.scale-100.png" alt="Buzzy Logo" className="logo-icon" />
            <span className="logo-text">Buzzy</span>
          </div>
        </div>
        
        <div className="top-bar-right">
          {currentPage === 'friends' ? (
            <button className="icon-btn profile-btn" onClick={handleProfileClick}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          ) : (
            <button className="icon-btn back-btn" onClick={handleBackToFriends}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <NotificationBell />
          <RefreshTokenButton />
        </div>
      </header>

      {/* Main Content */}
      {currentPage === 'friends' ? (
        <main className="friends-page">
          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <div className="requests-section">
              <h2 className="section-title">Friend Requests ({friendRequests.length})</h2>
              <div className="requests-list">
                {friendRequests.map(request => (
                  <div key={request.id} className="request-item">
                    <div className="request-avatar">
                      <span className="avatar-emoji">{request.fromUser?.photoURL || '👤'}</span>
                    </div>
                    <div className="request-info">
                      <h3 className="request-name">{request.fromUser?.username || 'Unknown User'}</h3>
                      <p className="request-username">@{request.fromUser?.username}</p>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleRespondToRequest(request.id, 'accepted')}
                        title="Accept friend request"
                      >
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </button>
                      <button 
                        className="deny-btn"
                        onClick={() => handleRespondToRequest(request.id, 'declined')}
                        title="Decline friend request"
                      >
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends Grid - Homepage */}
          {friends.length === 0 ? (
            <div className="empty-friends">
              <div className="empty-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="empty-title">No Friends Yet</h3>
              <p className="empty-message">Start connecting with friends by adding them to your network!</p>
              <button className="add-friends-main-btn" onClick={handleAddFriends}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Friends
              </button>
            </div>
          ) : (
            <div className="friends-grid">
              {friends.map(friend => (
                <div 
                  key={friend.id} 
                  className="friend-card"
                  onClick={() => handleFriendCardClick(friend)}
                  data-friend-id={friend.id}
                >
                  <div className="friend-avatar">
                    <span className="avatar-emoji">{friend.photoURL || '👤'}</span>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-name">{friend.username.toLowerCase().replace(/\s+/g, '')}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Friends Modal */}
          {showAddFriends && (
            <div className="add-friends-modal">
              <div className="modal-content">
                <h3>Add New Friends</h3>
                <div className="search-container">
                  <input 
                    type="text" 
                    placeholder="Search by username..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                  <button 
                    className="search-btn"
                    onClick={handleSearchUsers}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="search-results">
                    <h4>Search Results:</h4>
                    {searchResults.map(user => (
                      <div key={user.uid} className="search-result-item">
                        <div className="result-avatar">
                          <span className="avatar-emoji">{user.photoURL || '👤'}</span>
                        </div>
                        <div className="result-info">
                          <h4 className="result-name">{user.username}</h4>
                          <p className="result-username">@{user.username}</p>
                        </div>
                        <button 
                          className="add-friend-btn"
                          onClick={() => handleSendFriendRequest(user.uid)}
                        >
                          Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={handleAddFriends}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <main className="profile-page">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-emoji large">{userProfile.photoURL || '👤'}</span>
              {!editingProfile && (
              <button className="edit-avatar-btn" onClick={handleEditProfile}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              )}
            </div>
            <div className="profile-info">
              {editingProfile ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Username:</label>
                    <input 
                      type="text" 
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="edit-input"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Avatar (emoji):</label>
                    <input 
                      type="text" 
                      value={editForm.photoURL}
                      onChange={(e) => setEditForm(prev => ({ ...prev, photoURL: e.target.value }))}
                      className="edit-input"
                      placeholder="👤"
                    />
                  </div>
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
              <div className="profile-name-container">
                    <h1 className="profile-name">{userProfile.username}</h1>
                <button className="edit-name-btn" onClick={handleEditProfile}>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
                  <p className="profile-email">{userProfile.email}</p>
                </>
              )}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>

          <div className="friends-section">
            <div className="section-header">
              <h2 className="section-title">Friends ({friends.length})</h2>
              <button className="add-friends-btn" onClick={handleAddFriends}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            <div className="friends-list">
              {friends.map(friend => (
                <div 
                  key={friend.id} 
                  className="profile-friend-item"
                  data-friend-id={friend.id}
                  onClick={() => handleFriendCardClick(friend)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="friend-avatar">
                    <span className="avatar-emoji">{friend.photoURL || '👤'}</span>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-name">{friend.username.toLowerCase().replace(/\s+/g, '')}</h3>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Test Notification Button */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <button
          onClick={async () => {
            if (authUser && userProfile) {
              try {
                const notification = {
                  title: 'Test Notification',
                  body: 'This is a test notification from Buzzy!',
                  data: {
                    type: 'test',
                    timestamp: Date.now()
                  }
                };
                
                const result = await sendNotificationToUser(authUser.uid, notification);
                if (result.success) {
                  alert('✅ Test notification sent successfully!');
                } else {
                  alert(`❌ Test notification failed: ${result.message}`);
                }
              } catch (error) {
                alert(`❌ Error sending test notification: ${error.message}`);
              }
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Test Notification
        </button>
      </div>

      {/* FCM Diagnostic Tool */}
      <FCMDiagnostic />
      
    </div>
  )
}

export default App
