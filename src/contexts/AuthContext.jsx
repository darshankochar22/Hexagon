import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Check for existing token on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('hexagon_token')
    if (storedToken) {
      setToken(storedToken)
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('hexagon_token')
        setToken(null)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      localStorage.removeItem('hexagon_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (authToken) => {
    setToken(authToken)
    localStorage.setItem('hexagon_token', authToken)
    fetchUserProfile(authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('hexagon_token')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('hexagon_token')
    if (storedToken) {
      await fetchUserProfile(storedToken)
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    fetchUserProfile,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
