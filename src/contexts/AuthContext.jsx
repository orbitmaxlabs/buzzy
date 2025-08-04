/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth, createUserProfile, getUserProfile, updateUserProfile, migrateUserData } from '../firebase.js'
import { sendWelcomeNotification } from '../utils/notificationUtils.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  function logout() {
    return signOut(auth)
  }

  async function updateProfile(updates) {
    if (currentUser) {
      await updateUserProfile(currentUser.uid, updates)
      setUserProfile(prev => ({ ...prev, ...updates }))
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          // Check if user profile exists
          let profile = await getUserProfile(user.uid)
          
          if (!profile) {
            // Create new user profile
            profile = await createUserProfile(user)
            await sendWelcomeNotification(user.uid, profile.username)
          } else {
            // Migrate existing user data
            await migrateUserData(user.uid)
            profile = await getUserProfile(user.uid) // Get updated profile
          }
          
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    signInWithGoogle,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 