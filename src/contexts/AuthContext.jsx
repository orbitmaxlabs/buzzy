// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  auth,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  migrateUserData
} from '../firebase.js'
import { sendWelcomeNotification } from '../utils/notificationUtils.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  const logout = () => {
    return firebaseSignOut(auth)
  }

  const updateProfile = async (updates) => {
    if (!currentUser) return
    try {
      await updateUserProfile(currentUser.uid, updates)
      setUserProfile(prev => ({ ...prev, ...updates }))
    } catch (err) {
      console.error('Error updating user profile:', err)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          // Fetch or create user profile
          let profile = await getUserProfile(user.uid)
          if (!profile) {
            profile = await createUserProfile(user)
            // send welcome notification if profile creation succeeded
            try {
              await sendWelcomeNotification(user.uid, profile.username)
            } catch (notifErr) {
              console.warn('Failed to send welcome notification:', notifErr)
            }
          } else {
            // migrate any legacy data, then re-fetch
            await migrateUserData(user.uid)
            profile = await getUserProfile(user.uid)
          }
          setUserProfile(profile)
        } catch (err) {
          console.error('Error loading user profile:', err)
        }
      } else {
        setUserProfile(null)
        // If unauthenticated, ensure splash is removed (login screen will render)
        if (window.__removeSplash) {
          try { window.__removeSplash() } catch (_) {}
        }
      }
      setLoading(false)
      // Remove splash when auth state resolved; UI is ready to render a screen
      if (window.__removeSplash) {
        try { window.__removeSplash() } catch (_) {}
      }
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
