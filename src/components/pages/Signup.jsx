import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import API_CONFIG from '../../config/api'

const Signup = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
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
      // For Node.js backend, send JSON with username, email, and password
      const requestBody = API_CONFIG.BACKEND === 'nodejs' 
        ? JSON.stringify({ username, email, password, role })
        : new URLSearchParams({ username, password }).toString();
      
      const headers = API_CONFIG.BACKEND === 'nodejs'
        ? { 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/x-www-form-urlencoded' };

      const url = API_CONFIG.BACKEND === 'nodejs'
        ? API_CONFIG.getApiUrl('/auth/signup')
        : `${API_CONFIG.getApiUrl('/auth/signup')}?${new URLSearchParams({ username, password }).toString()}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: API_CONFIG.BACKEND === 'nodejs' ? requestBody : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(detail => detail.msg).join(', ')
          throw new Error(errorMessages)
        } else {
          throw new Error(data.error || data.message || data.detail || 'Signup failed')
        }
      }
      
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

  const signupWithGoogle = async () => {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/auth/google/url?role=${encodeURIComponent(role)}`))
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage('Failed to get Google OAuth URL')
      }
    } catch (error) {
      console.error('Google OAuth error:', error)
      setMessage('Failed to initiate Google signup')
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        {/* Hexagon Logo and Name */}
        <div className="footer-logo" style={{marginBottom: '20px', justifyContent: 'center'}}>
          <img src="/ChatGPT Image May 28, 2025 at 01_07_26 AM-min.png" alt="Hexagon" />
          <span>Hexagon</span>
        </div>
        
        <h3 className="auth-title" style={{color: 'transparent'}}>Create Account</h3>
        
        <form onSubmit={handleSignup} className="auth-form">
          <div>
            <input 
              className="auth-input" 
              type="text"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Choose a username" 
              required
            />
          </div>
          
          <div>
            <input 
              className="auth-input" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" 
              required
            />
          </div>
          
          <div>
            <input 
              className="auth-input" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Create a strong password" 
              required
            />
            <p style={{
              color: 'transparent',
              fontSize: '12px',
              marginTop: '6px',
              marginBottom: '0px'
            }}>
              Password must be at least 6 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <select
              className="auth-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="hr">HR</option>
            </select>
          </div>
          
          <div className="auth-actions">
            <button 
              className="btn-full" 
              type="submit" 
              disabled={loading}
              style={{
                background: '#000000',
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.22)',
                fontWeight: '500'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            
            <button 
              className="btn-full btn-google" 
              type="button" 
              onClick={signupWithGoogle} 
              disabled={loading}
              style={{
                background: '#ffffff',
                color: '#000000',
                borderColor: 'transparent'
              }}
            >
              Continue with Google
            </button>
          </div>
        </form>
        
        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            color: message.includes('success') ? '#4ade80' : '#ef4444',
            backgroundColor: message.includes('success') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.includes('success') ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {message}
          </div>
        )}
        
        <div style={{marginTop: '24px', textAlign: 'center'}}>
          <p style={{color: '#cfcfcf', fontSize: '14px'}}>
            Already have an account?{' '}
            <a href="/login" style={{color: '#ffffff', textDecoration: 'underline'}}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Signup


