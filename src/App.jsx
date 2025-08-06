import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext.jsx'
import { useNotifications } from './contexts/NotificationContext.jsx'
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
  sendFriendRequestResponseNotification,
  sendFriendAddedNotification
} from './utils/notificationUtils.js'
import { initializePWA } from './utils/pwaUtils.js'

function App() {
  const { currentUser: authUser, userProfile, signInWithGoogle, logout: authLogout, updateProfile } = useAuth()
  const { notificationStatus } = useNotifications()
  const [currentPage, setCurrentPage] = useState('friends')
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', photoURL: '' })

  useEffect(() => {
    initializePWA().catch(error => console.error('PWA initialization error:', error));
  }, []);

  useEffect(() => {
    if (authUser && userProfile) {
      migrateUserData(authUser.uid)
      cleanupDuplicateFriends(authUser.uid)
      loadFriends()
      loadFriendRequests()
    }
  }, [authUser, userProfile])

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
      const filteredResults = results.filter(user => 
        user.uid !== authUser.uid && 
        !friends.some(friend => friend.uid === user.uid)
      )
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendFriendRequest = async (toUid) => {
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
        const request = friendRequests.find(req => req.id === requestId)
        if (request) {
          await addFriend(authUser.uid, request.fromUid)
          await sendFriendAddedNotification(userProfile, request.fromUser)
        }
      }
      await loadFriendRequests()
      await loadFriends()
    } catch (error) {
      console.error('Error responding to friend request:', error)
    }
  }

  const handleFriendCardClick = async (friend) => {
    try {
      const result = await sendNotificationToUser(friend.uid, {
        title: 'Friend Activity',
        body: `${userProfile.username} sent you a greeting! 👋`,
        data: { type: 'greeting', fromUid: authUser.uid, fromUsername: userProfile.username }
      })
      
      if (result.success) {
        console.log('✅ Notification sent successfully to', friend.username)
      } else {
        console.log('❌ Failed to send notification:', result.message)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  const handleProfileClick = () => setCurrentPage('profile')
  const handleBackToFriends = () => setCurrentPage('friends')
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Buzzy</h1>
            <p className="text-gray-600">Connect with friends and stay in touch!</p>
          </div>
          
          <button
            onClick={signInWithGoogle}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">Buzzy</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage('friends')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'friends' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={handleProfileClick}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'profile' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Profile
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentPage === 'friends' ? (
          <div className="space-y-6">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Friend Requests ({friendRequests.length})</h2>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{request.fromUser?.photoURL || '👤'}</div>
                        <div>
                          <p className="font-medium">{request.fromUser?.username || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">Wants to be your friend</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRespondToRequest(request.id, 'accepted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Friends ({friends.length})</h2>
                <button
                  onClick={handleAddFriends}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Friends
                </button>
              </div>
              
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No friends yet. Add some friends to get started!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.uid}
                      onClick={() => handleFriendCardClick(friend)}
                      className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{friend.photoURL || '👤'}</div>
                        <p className="font-medium">{friend.username}</p>
                        <p className="text-sm text-gray-500">Click to send greeting</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Friends Modal */}
            {showAddFriends && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Friends</h3>
                    <button
                      onClick={() => setShowAddFriends(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleSearchUsers}
                    disabled={isSearching}
                    className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{user.photoURL || '👤'}</div>
                            <span className="font-medium">{user.username}</span>
                          </div>
                          <button
                            onClick={() => handleSendFriendRequest(user.uid)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Profile</h2>
              <button
                onClick={handleBackToFriends}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Friends
              </button>
            </div>
            
            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <input
                    type="text"
                    value={editForm.photoURL}
                    onChange={(e) => setEditForm({ ...editForm, photoURL: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter emoji"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">{userProfile.photoURL || '👤'}</div>
                  <h3 className="text-2xl font-semibold">{userProfile.username}</h3>
                  <p className="text-gray-500">{userProfile.email}</p>
                </div>
                
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <PWAInstallPrompt />
      <NotificationTest />
    </div>
  )
}

export default App
