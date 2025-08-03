import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import MessageModal from './components/MessageModal.jsx'
import NotificationTest from './components/NotificationTest.jsx'
import { 
  searchUsersByUsername, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends, 
  addFriend, 
  removeFriend,
  migrateUserData,
  cleanupDuplicateFriends
} from './firebase.js'
import {
  sendFriendRequestNotification,
  sendFriendRequestResponseNotification,
  sendFriendAddedNotification,
  sendWelcomeNotification
} from './utils/notificationUtils.js'

function App() {
  const { currentUser: authUser, userProfile, signInWithGoogle, logout: authLogout, updateProfile } = useAuth()
  const [currentPage, setCurrentPage] = useState('friends') // 'friends' or 'profile'
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
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

  // Load friends and friend requests when user is authenticated
  useEffect(() => {
    if (authUser && userProfile) {
      // Migrate user data and clean up duplicates
      migrateUserData(authUser.uid)
      cleanupDuplicateFriends(authUser.uid)
      
      loadFriends()
      loadFriendRequests()
      
      // Initialize notifications for the user
      initializeNotifications()
    }
  }, [authUser, userProfile])

  const initializeNotifications = async () => {
    try {
      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error)
    }
  }

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

  const handleFriendCardClick = (friend) => {
    setSelectedFriend(friend)
    setShowMessageModal(true)
  }

  const handleCloseMessageModal = () => {
    setShowMessageModal(false)
    setSelectedFriend(null)
  }

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

  const handleRemoveFriend = async (friendId) => {
    try {
      const friend = friends.find(f => f.id === friendId)
      if (friend) {
        await removeFriend(authUser.uid, friend.uid)
        await loadFriends() // Reload friends list
        alert(`${friend.username} has been removed from your friends list`)
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend')
    }
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
                <div key={friend.id} className="profile-friend-item">
                  <div className="friend-avatar">
                    <span className="avatar-emoji">{friend.photoURL || '👤'}</span>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-name">{friend.username.toLowerCase().replace(/\s+/g, '')}</h3>
                  </div>
                  <button 
                    className="remove-friend-btn"
                    onClick={() => handleRemoveFriend(friend.id)}
                    title={`Remove ${friend.username} from friends list`}
                  >
                                         <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                       <line x1="18" y1="6" x2="6" y2="18"></line>
                       <line x1="6" y1="6" x2="18" y2="18"></line>
                     </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Message Modal */}
      <MessageModal
        friend={selectedFriend}
        isOpen={showMessageModal}
        onClose={handleCloseMessageModal}
      />
      
      {/* Notification Test Component (for debugging) */}
      {authUser && <NotificationTest />}
    </div>
  )
}

export default App
