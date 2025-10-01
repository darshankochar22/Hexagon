import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  IconFileText, 
  IconTrash, 
  IconEye,
  IconSearch,
  IconBriefcase,
  IconBuilding,
  IconMapPin,
  IconCode,
  IconUsers,
  IconPlus,
  IconX,
  IconUser
} from '@tabler/icons-react'
import { GlowingEffect } from '../ui/glowing-effect'

const JobCard = ({ job, role, hasApplied, onApply, onDelete, onViewDescription, onViewApplicants }) => {
  const getJobIcon = () => {
    if (job.title.toLowerCase().includes('engineer') || job.title.toLowerCase().includes('developer')) {
      return <IconCode className="h-4 w-4 text-white" />
    } else if (job.title.toLowerCase().includes('manager') || job.title.toLowerCase().includes('lead')) {
      return <IconUsers className="h-4 w-4 text-white" />
    } else if (job.title.toLowerCase().includes('data') || job.title.toLowerCase().includes('analyst')) {
      return <IconBriefcase className="h-4 w-4 text-white" />
    } else {
      return <IconBuilding className="h-4 w-4 text-white" />
    }
  }

  return (
    <li className="min-h-[24rem] list-none">
      <div className="relative h-full rounded-2xl p-3 md:rounded-3xl md:p-4">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-xl p-8 md:p-8 bg-black dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="flex justify-between items-start">
              <div className="w-fit rounded-lg p-2 bg-black">
                {getJobIcon()}
              </div>
              {role === 'hr' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewApplicants(job)}
                    className="px-3 py-2 text-black bg-white rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold"
                    title="View applicants"
                  >
                    Applicants
                  </button>
                  <button
                    onClick={() => onDelete(job.id)}
                    className="p-2 text-white hover:text-red-500 transition-colors bg-black rounded-lg"
                    title="Delete job"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                {job.title}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white text-base">
                  <IconBuilding size={18} />
                  {job.company}
                </div>
                <div className="flex items-center gap-3 text-white text-base">
                  <IconMapPin size={18} />
                  {job.location}
                </div>
              </div>

                      {/* Experience Level */}
                      <div>
                        <span className="px-4 py-2 bg-black text-white rounded-full text-base font-bold">
                          {job.experience} Level
                        </span>
                      </div>
                      
                      {/* Skills Section */}
                      <div>
                        <div className="flex flex-wrap gap-3">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-3 py-2 bg-black text-white text-sm rounded-full">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="px-3 py-2 bg-black text-white text-sm rounded-full">
                              +{job.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
            </div>
          </div>
          
                  <div className="flex items-center justify-between gap-3">
                    <button 
                      onClick={() => onViewDescription(job)}
                      className="flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-white hover:text-black transition-all font-bold text-base"
                    >
                      <IconEye size={18} />
                      View Details
                    </button>
                    {role === 'student' && (
                      hasApplied(job.id) ? (
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white border border-white/30" title="Already applied">
                          <IconFileText size={16} /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => onApply(job.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 font-bold"
                          title="Apply to this job"
                        >
                          <IconFileText size={16} /> Apply
                        </button>
                      )
                    )}
                  </div>
        </div>
      </div>
    </li>
  )
}

const JobDescriptionModal = ({ job, onClose }) => {
  if (!job) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-16">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">{job.title}</h2>
            <p className="text-xl text-white mb-8">{job.company} - {job.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-red-500 transition-colors bg-black rounded-lg"
          >
            <IconX size={24} />
          </button>
        </div>
        
        <div className="mb-16">
          <span className="px-4 py-2 bg-black text-white rounded-full text-lg font-bold">
            {job.experience} Level
          </span>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Required Skills:</h3>
          <div className="flex flex-wrap gap-3">
            {job.skills.map((skill, index) => (
              <span key={index} className="px-4 py-2 bg-black text-white text-base rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-8">Job Description:</h3>
          <div className="bg-black rounded-lg p-8">
            <p className="text-white text-lg leading-loose whitespace-pre-wrap">
              {job.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const AddJobModal = ({ isOpen, onClose, onJobAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    experience: 'Mid',
    skills: [],
    description: ''
  })
  const [skillInput, setSkillInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('hexagon_token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('https://backend-ezis.vercel.app/jobs/', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newJob = await response.json()
        console.log('Job added successfully:', newJob)
        onJobAdded(newJob)
        onClose()
        setFormData({
          title: '',
          company: '',
          location: '',
          experience: 'Mid',
          skills: [],
          description: ''
        })
        alert('Job added successfully!')
      } else {
        console.error('Failed to add job:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        alert('Failed to add job')
      }
    } catch (error) {
      console.error('Error adding job:', error)
      alert('Error adding job')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Job</h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-red-500 transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none"
                placeholder="e.g., Tech Corp"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none"
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Experience Level *
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black rounded-lg text-white focus:outline-none"
              >
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Skills *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className="flex-1 px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none"
                placeholder="Add a skill and press Enter"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white text-black text-sm rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-black hover:text-red-500"
                  >
                    <IconX size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={8}
              className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none"
              placeholder="Enter the job description..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ApplicantsModal = ({ job, applicants, isOpen, onClose, onDownloadResume }) => {
  if (!isOpen || !job) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-white/15">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Applicants</h2>
            <p className="text-white/80 text-sm mt-1">{job.title} — {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-red-500 transition-colors bg-black rounded-lg"
            title="Close"
          >
            <IconX size={22} />
          </button>
        </div>

        {(!applicants || applicants.length === 0) ? (
          <div className="text-center py-16">
            <IconUser size={42} className="mx-auto text-white mb-4" />
            <p className="text-white">No applications yet</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {applicants.map((app) => (
              <li key={app.id} className="border border-white/10 rounded-lg p-4 bg-black">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <IconUser size={16} />
                      <span>{app.user?.profile?.full_name || app.user?.username || 'Candidate'}</span>
                    </div>
                    <div className="text-white/80 text-sm">
                      {app.user?.email}
                    </div>
                    <div className="text-white/60 text-sm">Applied: {new Date(app.appliedAt).toLocaleString()}</div>
                    {app.coverLetter && (
                      <div className="text-white/80 text-sm mt-2 whitespace-pre-wrap">{app.coverLetter}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {app.resume?.has_file ? (
                      <button
                        onClick={() => onDownloadResume(app.id)}
                        className="px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-200 text-sm font-bold"
                      >
                        Download Resume
                      </button>
                    ) : (
                      <span className="px-3 py-2 border border-white/20 rounded-lg text-white/70 text-sm">No Resume</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const Jobs = () => {
  const { role, isAuthenticated } = useAuth()
  const [jobs, setJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [showApplicantsModal, setShowApplicantsModal] = useState(false)
  const [applicantsJob, setApplicantsJob] = useState(null)
  const [applicants, setApplicants] = useState([])

  // Fetch jobs from backend
  useEffect(() => {
    fetchJobs()
    if (role === 'student' && isAuthenticated()) {
      fetchAppliedJobs()
    }
  }, [role, isAuthenticated])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('https://backend-ezis.vercel.app/jobs/', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Jobs fetched successfully:', data)
        // Use the jobs array from the response
        setJobs(data.jobs || [])
      } else {
        console.error('Failed to fetch jobs:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token) return
      const response = await fetch('https://backend-ezis.vercel.app/jobs/my/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const ids = new Set((data.applications || []).map(a => a.job?.id || a.job))
        setAppliedJobIds(ids)
      }
    } catch (e) {
      console.error('Error fetching applied jobs', e)
    }
  }

  const hasApplied = (jobId) => appliedJobIds.has(jobId)

  const applyToJob = async (jobId) => {
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token) return alert('Please login to apply')
      const res = await fetch(`https://backend-ezis.vercel.app/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (res.ok) {
        setAppliedJobIds(prev => new Set(prev).add(jobId))
        alert('Application submitted')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to apply')
      }
    } catch (e) {
      console.error('Apply error', e)
      alert('Error applying')
    }
  }

  const openApplicants = async (job) => {
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token) return
      const res = await fetch(`https://backend-ezis.vercel.app/jobs/${job.id}/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setApplicants(data.applicants || [])
        setApplicantsJob(job)
        setShowApplicantsModal(true)
      } else {
        alert('Failed to load applicants')
      }
    } catch (e) {
      console.error('Applicants load error', e)
      alert('Error loading applicants')
    }
  }

  const downloadApplicantResume = async (applicationId) => {
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token || !applicantsJob) return
      const res = await fetch(`https://backend-ezis.vercel.app/jobs/${applicantsJob.id}/applicants/${applicationId}/resume`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const t = await res.text()
        return alert(t || 'Failed to download')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error('Download resume error', e)
      alert('Error downloading resume')
    }
  }


  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const token = localStorage.getItem('hexagon_token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`https://backend-ezis.vercel.app/jobs/${jobId}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        setJobs(prev => prev.filter(job => job.id !== jobId))
        alert('Job deleted successfully')
      } else {
        alert('Failed to delete job')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting job')
    }
  }

  const handleJobAdded = (newJob) => {
    // Backend already returns a formatted job with `uploadedAt`
    // Use it directly and avoid reformatting non-existent `created_at`
    const safeJob = {
      ...newJob,
      uploadedAt: newJob.uploadedAt || new Date().toISOString().split('T')[0],
    }
    setJobs(prev => [safeJob, ...prev])
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterLevel === 'all' || job.experience.toLowerCase() === filterLevel.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="w-full pt-40 pb-10 px-4">
        <div className="w-full">
                  {/* Header */}
                  <div className="text-center mb-32">
                    <h1 className="text-5xl font-bold mb-4 text-white">Jobs</h1>
                    <p className="text-xl text-white mb-16">Manage and organize your job postings</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row justify-center items-center mb-16 gap-4">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={20} />
                        <input
                          type="text"
                          placeholder="Search jobs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-3 bg-black rounded-lg text-white placeholder-white focus:outline-none w-64"
                        />
                      </div>
                      
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="px-4 py-3 bg-black rounded-lg text-white focus:outline-none"
                      >
                        <option value="all">All Levels</option>
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                      </select>
                    </div>

                    {/* Add Job Button - HR only */}
                    {role === 'hr' && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-bold"
                      >
                        <IconPlus size={20} />
                        Add Job
                      </button>
                    )}
                  </div>

          {/* Jobs Grid with Uniform Layout */}
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredJobs.map((job) => {
              return (
                <JobCard 
                  key={job.id}
                  job={job} 
                  role={role}
                  hasApplied={hasApplied}
                  onApply={applyToJob}
                  onDelete={deleteJob}
                  onViewDescription={(job) => setSelectedJob(job)}
                  onViewApplicants={openApplicants}
                />
              )
            })}
          </ul>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-20">
              <IconFileText size={80} className="mx-auto text-white mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">No jobs found</h3>
              <p className="text-xl text-white mb-8">
                {searchTerm || filterLevel !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No Jobs available'
                }
              </p>
            </div>
          )}
        </div>
      </div>


                {/* Job Description Modal */}
                {selectedJob && (
                  <JobDescriptionModal 
                    job={selectedJob} 
                    onClose={() => setSelectedJob(null)}
                  />
                )}

                {/* Add Job Modal */}
                <AddJobModal
                  isOpen={showAddModal}
                  onClose={() => setShowAddModal(false)}
                  onJobAdded={handleJobAdded}
                />

                {/* HR Applicants Modal */}
                <ApplicantsModal
                  job={applicantsJob}
                  applicants={applicants}
                  isOpen={showApplicantsModal}
                  onClose={() => setShowApplicantsModal(false)}
                  onDownloadResume={downloadApplicantResume}
                />
              </div>
  )
}

export default Jobs