import { useState } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('friends') // 'friends' or 'profile'
  const [showAddFriends, setShowAddFriends] = useState(false)
  const [showMessagePopup, setShowMessagePopup] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friends, setFriends] = useState([
    {
      id: 1,
      name: "Arjun Bishnoi",
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



  const handleFriendCardClick = (friend) => {
    setSelectedFriend(friend)
    setShowMessagePopup(true)
    
    // Send notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${friend.name}`, {
        body: `Bhen ke lund thigge madarchod!`,
        icon: '/windows11/Square44x44Logo.scale-100.png'
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`${friend.name}`, {
            body: `Bhen ke lund thigge madarchod!`,
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

  const handleLogout = () => {
    console.log('Logout clicked')
    // Add logout functionality here
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
              <button className="edit-avatar-btn" onClick={handleEditProfile}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
            <div className="profile-info">
              <div className="profile-name-container">
                <h1 className="profile-name">{currentUser.name}</h1>
                <button className="edit-name-btn" onClick={handleEditProfile}>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
              <p className="profile-email">{currentUser.email}</p>
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
                  <path d="M18 6L6 18M6 6l12 12"/>
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
