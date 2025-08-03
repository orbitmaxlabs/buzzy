import { useState } from 'react'
import './App.css'

function App() {
  const [notifications, setNotifications] = useState(3)
  const [currentPage, setCurrentPage] = useState('friends') // 'friends' or 'profile'
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [showMessagePopup, setShowMessagePopup] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friends, setFriends] = useState([
    {
      id: 1,
      name: "Alex Johnson",
      avatar: "👨‍💻",
      status: "online",
      lastActive: "2 min ago",
      mutualFriends: 12
    },
    {
      id: 2,
      name: "Sarah Chen",
      avatar: "👩‍🎨",
      status: "online",
      lastActive: "5 min ago",
      mutualFriends: 8
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      avatar: "👨‍🍳",
      status: "away",
      lastActive: "1 hour ago",
      mutualFriends: 15
    },
    {
      id: 4,
      name: "Emma Wilson",
      avatar: "👩‍⚕️",
      status: "online",
      lastActive: "Just now",
      mutualFriends: 6
    },
    {
      id: 5,
      name: "David Kim",
      avatar: "👨‍🎤",
      status: "offline",
      lastActive: "3 hours ago",
      mutualFriends: 20
    },
    {
      id: 6,
      name: "Lisa Thompson",
      avatar: "👩‍🏫",
      status: "online",
      lastActive: "10 min ago",
      mutualFriends: 9
    },
    {
      id: 7,
      name: "James Brown",
      avatar: "👨‍💼",
      status: "away",
      lastActive: "30 min ago",
      mutualFriends: 14
    },
    {
      id: 8,
      name: "Maria Garcia",
      avatar: "👩‍🔬",
      status: "online",
      lastActive: "1 min ago",
      mutualFriends: 11
    },
    {
      id: 9,
      name: "Tom Anderson",
      avatar: "👨‍🎮",
      status: "online",
      lastActive: "Just now",
      mutualFriends: 7
    },
    {
      id: 10,
      name: "Anna Lee",
      avatar: "👩‍🎭",
      status: "offline",
      lastActive: "2 hours ago",
      mutualFriends: 13
    },
    {
      id: 11,
      name: "Chris Taylor",
      avatar: "👨‍🚀",
      status: "online",
      lastActive: "5 min ago",
      mutualFriends: 16
    },
    {
      id: 12,
      name: "Rachel Green",
      avatar: "👩‍🌾",
      status: "away",
      lastActive: "45 min ago",
      mutualFriends: 10
    }
  ])

  // Mock user data
  const currentUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "👨‍💼",
    friends: []
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'away': return '#F59E0B'
      case 'offline': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const handleFriendCardClick = (friend) => {
    setSelectedFriend(friend)
    setShowMessagePopup(true)
    
    // Send notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Message Sent to ${friend.name}`, {
        body: `Your message has been sent successfully to ${friend.name}`,
        icon: '/windows11/Square44x44Logo.scale-100.png'
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`Message Sent to ${friend.name}`, {
            body: `Your message has been sent successfully to ${friend.name}`,
            icon: '/windows11/Square44x44Logo.scale-100.png'
          })
        }
      })
    }
  }

  const handleCloseMessagePopup = () => {
    setShowMessagePopup(false)
    setSelectedFriend(null)
  }

  const handleProfileClick = () => {
    setCurrentPage('profile')
  }

  const handleBackToFriends = () => {
    setCurrentPage('friends')
  }

  const handleEditProfile = () => {
    console.log('Edit profile clicked')
    // Add edit profile functionality here
  }

  const handleAddFriends = () => {
    setShowAddFriends(!showAddFriends)
  }

  const handleRemoveFriend = (friendId) => {
    setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId))
    
    // Send notification
    const removedFriend = friends.find(friend => friend.id === friendId)
    if (removedFriend && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Friend Removed`, {
        body: `${removedFriend.name} has been removed from your friends list`,
        icon: '/windows11/Square44x44Logo.scale-100.png'
      })
    }
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
          <button className="icon-btn notification-btn">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {notifications > 0 && (
              <span className="notification-badge">{notifications}</span>
            )}
          </button>
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      {currentPage === 'friends' ? (
        <main className="friends-grid">
          {friends.map(friend => (
            <div 
              key={friend.id} 
              className="friend-card"
              onClick={() => handleFriendCardClick(friend)}
            >
              <div className="friend-avatar">
                <span className="avatar-emoji">{friend.avatar}</span>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(friend.status) }}
                ></div>
              </div>
              <div className="friend-info">
                <h3 className="friend-name">{friend.name}</h3>
              </div>
            </div>
          ))}
        </main>
      ) : (
        <main className="profile-page">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-emoji large">{currentUser.avatar}</span>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{currentUser.name}</h1>
              <p className="profile-email">{currentUser.email}</p>
            </div>
            <button className="edit-profile-btn" onClick={handleEditProfile}>
              Edit Profile
            </button>
          </div>

          <div className="friends-section">
            <div className="section-header">
              <h2 className="section-title">Friends ({friends.length})</h2>
              <button className="add-friends-btn" onClick={handleAddFriends}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            
            {showAddFriends && (
              <div className="add-friends-modal">
                <div className="modal-content">
                  <h3>Add New Friends</h3>
                  <input 
                    type="text" 
                    placeholder="Search for friends..." 
                    className="search-input"
                  />
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={handleAddFriends}>
                      Cancel
                    </button>
                    <button className="search-btn">
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="friends-list">
              {friends.map(friend => (
                <div key={friend.id} className="profile-friend-item">
                  <div className="friend-avatar">
                    <span className="avatar-emoji">{friend.avatar}</span>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(friend.status) }}
                    ></div>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-name">{friend.name}</h3>
                    <p className="friend-status">{friend.status}</p>
                  </div>
                  <button 
                    className="remove-friend-btn"
                    onClick={() => handleRemoveFriend(friend.id)}
                    title={`Remove ${friend.name} from friends list`}
                  >
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Message Sent Popup */}
      {showMessagePopup && selectedFriend && (
        <div className="message-popup-overlay" onClick={handleCloseMessagePopup}>
          <div className="message-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="popup-avatar">
                <span className="avatar-emoji">{selectedFriend.avatar}</span>
              </div>
              <button className="popup-close-btn" onClick={handleCloseMessagePopup}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              <div className="success-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              </div>
              <h3 className="popup-title">Message Sent!</h3>
              <p className="popup-message">
                Your message has been sent successfully to <strong>{selectedFriend.name}</strong>
              </p>
              <p className="popup-subtitle">
                They'll receive your message and can respond when they're available.
              </p>
            </div>
            <div className="popup-actions">
              <button className="popup-ok-btn" onClick={handleCloseMessagePopup}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
