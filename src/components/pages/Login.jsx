import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Login = () => {
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

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    const form = new URLSearchParams()
    form.set('username', username)
    form.set('password', password)
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      
      // Use auth context login method
      login(data.access_token)
      setMessage('Logged in successfully!')
      
      // Redirect to profile after successful login
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:8000/auth/google/url'
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')
    if (token) {
      // Use auth context login method
      login(token)
      setMessage('Logged in with Google!')
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.pathname)
      
      // Redirect to profile after Google login
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    }
  }, [login, navigate])

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h3 className="auth-title">Login</h3>
        <form onSubmit={handleLogin} className="auth-form">
          <input className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Email or Username" />
          <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <div className="auth-actions">
            <button className="btn-full btn-primary-filled" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button className="btn-full btn-google" type="button" onClick={loginWithGoogle} disabled={loading}>
              Continue with Google
            </button>
          </div>
        </form>
        {message && <p style={{marginTop:12, color: message.includes('success') ? '#4ade80' : '#ef4444'}}>{message}</p>}
      </div>
    </section>
  )
}

export default Login


