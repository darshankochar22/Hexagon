import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import API_CONFIG from '../../config/api'
import { IconUpload, IconDownload, IconTrash, IconFileText, IconCalendar, IconBuilding, IconEye } from '@tabler/icons-react'
import { GlowingEffect } from '../ui/glowing-effect'

const Profile = () => {
  const { user, role, logout, refreshUser } = useAuth()
  const [editedProfile, setEditedProfile] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [saveError, setSaveError] = useState('')
  const initializedRef = useRef(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Interview reports state
  const [interviewReports, setInterviewReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    if (!initializedRef.current && user?.profile) {
      setEditedProfile(user.profile)
      initializedRef.current = true
    }
  }, [user])

  // Fetch interview reports
  const fetchInterviewReports = async () => {
    if (!user?.id) return
    
    setLoadingReports(true)
    try {
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      const response = await fetch(`http://localhost:8000/media/interview-summaries/${user.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        setInterviewReports(data.summaries || [])
      }
    } catch (error) {
      console.error('Error fetching interview reports:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  // Load reports when component mounts
  useEffect(() => {
    fetchInterviewReports()
  }, [user?.id])

  // Download report as PDF
  const downloadReport = (report) => {
    const element = document.createElement('a')
    const file = new Blob([report.detailed_summary], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `interview-report-${report.job_title}-${new Date(report.created_at).toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const formatDate = (value) => {
    try {
      if (!value) return 'Unknown';
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return 'Unknown'
      return d.toLocaleDateString()
    } catch { return 'Unknown' }
  }

  const formatSizeMB = (value) => {
    if (!value || typeof value !== 'number') return 'Unknown'
    return (value / 1024 / 1024).toFixed(2) + ' MB'
  }

  const viewResumeInline = async () => {
    try {
      setResumeError('')
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      const response = await fetch(API_CONFIG.getApiUrl('/users/download-resume'), { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      if (!response.ok) {
        const text = await response.text().catch(()=>'')
        throw new Error(text || 'Failed to open resume')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(()=>window.URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      setResumeError(e.message || 'Failed to open resume')
    }
  }

  const saveProfileNow = async (nextProfile) => {
    setSaving(true)
    setSaveError('')
    try {
      const token =
        localStorage.getItem('hexagon_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt')
      if (!token) throw new Error('No authentication token found')

      // Only send fields accepted by backend schema; exclude nested objects like resume
      const allowedFields = ['email', 'full_name', 'avatar', 'bio', 'location', 'website', 'phone']
      const payload = allowedFields.reduce((acc, key) => {
        if (nextProfile[key] !== undefined) acc[key] = nextProfile[key]
        return acc
      }, {})

      const response = await fetch(API_CONFIG.getApiUrl('/users/me'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let serverMessage = 'Failed to update profile'
        try {
          const errorData = await response.json()
          serverMessage = errorData.detail || serverMessage
        } catch {
          const text = await response.text()
          serverMessage = text || serverMessage
        }
        throw new Error(`${response.status} ${response.statusText} - ${serverMessage}`)
      }

      await refreshUser()
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    const next = { ...editedProfile, [field]: value }
    setEditedProfile(next)
  }

  const handleCancel = () => {
    setEditedProfile(user?.profile || {})
    setIsEditing(false)
    setSaveError('')
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
    <div className="bg-black text-white min-h-screen pt-40 pb-10 px-4 flex justify-center">
      <div className="max-w-4xl w-full">
        {/* Outer Glowing Box wrapping entire profile content */}
        <div className="relative rounded-2xl md:rounded-3xl p-3 md:p-4 overflow-hidden shadow-[0_0_35px_0_rgba(255,255,255,0.08)]">
          <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
          <div className="relative bg-black rounded-xl md:rounded-2xl p-6 md:p-8 ring-1 ring-white/10">
            {/* Header Card */}
            <div className="bg-black rounded-2xl p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="profile-avatar">
                  {user.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center text-3xl font-bold">
                      {user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="profile-info flex-1 text-center md:text-left">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none mb-2"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-white mb-2">{user.profile?.full_name || user.username}</h1>
                  )}
                  <p className="text-xl text-white mb-4">@{user.username}</p>
                  <div className="profile-provider flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <span className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium">
                      {user.provider === 'google' ? 'Google Account' : 'Local Account'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                      {(user.role || role || 'guest').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="profile-actions flex flex-col gap-2 items-center md:items-end min-w-[180px]">
                  {saving ? (
                    <span className="text-sm text-gray-300">Saving...</span>
                  ) : saveError ? (
                    <span className="text-sm text-red-400" title={saveError}>Save error</span>
                  ) : (
                    <span className="text-sm text-green-400">Ready</span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full px-6 py-2 bg.white bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      title="Edit profile"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveProfileNow(editedProfile)}
                        className="px-5 py-2 bg-white text.black text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <button 
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Resume Section - hidden for HR accounts */}
            {(user.role || role) === 'hr' ? null : (
              <div className="bg-black rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Resume</h2>
                {user.profile?.resume ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-black rounded-lg">
                      <IconFileText size={24} className="text-white" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.profile.resume.filename || 'Resume'}</p>
                        <p className="text-gray-400 text-sm">Uploaded: {formatDate(user.profile.resume.uploaded_at)}</p>
                        <p className="text-gray-400 text-sm">Size: {formatSizeMB(user.profile.resume.file_size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={viewResumeInline} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium">View</button>
                      <button onClick={async () => {
                        if (!confirm('Delete resume?')) return
                        const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
                        await fetch(API_CONFIG.getApiUrl('/users/delete-resume'), { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
                        await refreshUser()
                      }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Delete</button>
                    </div>
                    {resumeError && (<p className="text-red-400 text-sm">{resumeError}</p>)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconFileText size={48} className="text-white mx-auto mb-4" />
                    <p className="text-white text-lg mb-4">No resume uploaded</p>
                    <label className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer">
                      <IconUpload size={18} />
                      Upload Resume
                      <input type="file" accept=".pdf,.doc,.docx" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return; setUploadingResume(true); setResumeError('');
                        if (file.size > 10 * 1024 * 1024) { setResumeError('Maximum size is 10MB'); setUploadingResume(false); return; }
                        const formData = new FormData(); formData.append('resume', file);
                        const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
                        try {
                          const res = await fetch(API_CONFIG.getApiUrl('/users/upload-resume'), { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: formData })
                          if (!res.ok) {
                            const text = await res.text().catch(()=> 'Upload failed')
                            throw new Error(text)
                          }
                          await refreshUser();
                        } catch (err) {
                          setResumeError(err.message || 'Upload failed')
                        } finally {
                          setUploadingResume(false); e.target.value = '';
                        }
                      }} className="hidden" />
                    </label>
                    {uploadingResume && (<p className="text-white mt-2">Uploading...</p>)}
                    {resumeError && (<p className="text-red-400 text-sm mt-2">{resumeError}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* HR Quick Actions and Profile Section */}
            {(user.role || role) === 'hr' && (
              <div className="bg-black rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">HR Dashboard</h2>
                <p className="text-white/80 mb-6">Manage postings and review applicants. Your Jobs page lists only jobs you posted; each card has an Applicants button with candidate details and resume downloads.</p>
                <div className="flex gap-3">
                  <a href="/jobs" className="px-5 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium">Go to Jobs</a>
                </div>
              </div>
            )}

            {/* Interview Reports Section */}
            <div className="profile-section bg-black rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Interview Reports</h3>
                <button 
                  onClick={fetchInterviewReports}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {loadingReports ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Loading reports...</p>
                </div>
              ) : interviewReports.length > 0 ? (
                <div className="space-y-4">
                  {interviewReports.map((report, index) => (
                    <div key={report._id || index} className="bg-gray-900 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <IconBuilding size={20} className="text-blue-400" />
                            <h4 className="text-white font-semibold text-lg">{report.job_title}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-gray-400 text-sm">
                            <div className="flex items-center gap-1">
                              <IconCalendar size={16} />
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                            <span>•</span>
                            <span>{report.job_company}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report)
                              setShowReportModal(true)
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <IconEye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => downloadReport(report)}
                            className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            <IconDownload size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm">
                        <p className="line-clamp-3">
                          {report.detailed_summary?.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconFileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No interview reports yet</p>
                  <p className="text-gray-500 text-sm">Complete an interview to see your detailed reports here</p>
                </div>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-section bg-black rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Email</label>
                    {isEditing ? (
                      <input type="email" value={editedProfile.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none" placeholder="Enter email" />
                    ) : (
                      <p className="text-white">{user.profile?.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text.white text-white font-medium">Phone</label>
                    {isEditing ? (
                      <input type="tel" value={editedProfile.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none" placeholder="Enter phone" />
                    ) : (
                      <p className="text-white">{user.profile?.phone || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Website</label>
                    {isEditing ? (
                      <input type="url" value={editedProfile.website || ''} onChange={(e) => handleInputChange('website', e.target.value)} className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none" placeholder="Enter website" />
                    ) : (
                      <p className="text-white">{user.profile?.website || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Location</label>
                    {isEditing ? (
                      <input type="text" value={editedProfile.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none" placeholder="Enter location" />
                    ) : (
                      <p className="text-white">{user.profile?.location || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section bg-black rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">About</h3>
                <div className="space-y-2">
                  {isEditing ? (
                    <textarea value={editedProfile.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none" placeholder="Tell us about yourself..." rows={4} />
                  ) : (
                    <p className="text-white leading-relaxed">{user.profile?.bio || 'No bio provided'}</p>
                  )}
                </div>
              </div>

              <div className="profile-section bg-black rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Username</label>
                    <p className="text-white">{user.username}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Account Type</label>
                    <p className="text-white">{user.provider === 'google' ? 'Google OAuth' : 'Email/Password'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white font-medium">Member Since</label>
                    <p className="text-white">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report View Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedReport.job_title}</h3>
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="flex items-center gap-1">
                    <IconBuilding size={16} />
                    <span>{selectedReport.job_company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconCalendar size={16} />
                    <span>{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport(selectedReport)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <IconDownload size={16} />
                  Download
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh] pr-2">
              <div className="text-white whitespace-pre-wrap leading-relaxed">
                {selectedReport.detailed_summary}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
