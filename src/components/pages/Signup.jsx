import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Signup = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect to profile if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/profile')
    }
  }, [isAuthenticated, navigate])

  const handleSignup = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const params = new URLSearchParams({ username, password })
      const res = await fetch(`http://localhost:8000/auth/signup?${params.toString()}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      
      // Use auth context login method
      login(data.access_token)
      setMessage('Signed up successfully!')
      
      // Redirect to profile after successful signup
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const signupWithGoogle = () => {
    window.location.href = 'http://localhost:8000/auth/google/url'
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h3 className="auth-title">Create account</h3>
        <form onSubmit={handleSignup} className="auth-form">
          <input className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Email or Username" />
          <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <div className="auth-actions">
            <button className="btn-full btn-primary-filled" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            <button className="btn-full btn-google" type="button" onClick={signupWithGoogle} disabled={loading}>
              Continue with Google
            </button>
          </div>
        </form>
        {message && <p style={{marginTop:12, color: message.includes('success') ? '#4ade80' : '#ef4444'}}>{message}</p>}
      </div>
    </section>
  )
}

export default Signup


