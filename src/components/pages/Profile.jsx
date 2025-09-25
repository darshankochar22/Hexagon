import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const Profile = () => {
  const { user, logout, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.profile) {
      setEditedProfile(user.profile)
    }
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedProfile)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update profile')
      }
      
      await refreshUser()
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(user.profile)
    setIsEditing(false)
  }

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.profile?.avatar ? (
              <img src={user.profile.avatar} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">
              {user.profile?.full_name || user.username}
            </h1>
            <p className="profile-username">@{user.username}</p>
            <div className="profile-provider">
              <span className="provider-badge">
                {user.provider === 'google' ? 'Google Account' : 'Local Account'}
              </span>
            </div>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn btn-secondary" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
            )}
            <button className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-section">
            <h3>Contact Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="profile-input"
                  />
                ) : (
                  <span>{user.profile?.email || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="profile-input"
                  />
                ) : (
                  <span>{user.profile?.phone || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editedProfile.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="profile-input"
                  />
                ) : (
                  <span>{user.profile?.website || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="profile-input"
                  />
                ) : (
                  <span>{user.profile?.location || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>About</h3>
            <div className="detail-item">
              {isEditing ? (
                <textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="profile-textarea"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <p className="profile-bio">
                  {user.profile?.bio || 'No bio provided'}
                </p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3>Account Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Username</label>
                <span>{user.username}</span>
              </div>
              <div className="detail-item">
                <label>Account Type</label>
                <span>{user.provider === 'google' ? 'Google OAuth' : 'Email/Password'}</span>
              </div>
              <div className="detail-item">
                <label>Member Since</label>
                <span>
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
