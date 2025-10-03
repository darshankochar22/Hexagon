import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_CONFIG from '../../config/api'
import { useAuth } from '../../contexts/AuthContext'
import { 
  IconCalendar,
  IconClock,
  IconVideo,
  IconUser,
  IconBuilding,
  IconMapPin,
  IconCode,
  IconUsers,
  IconBriefcase,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconX,
  IconTrash,
  IconPlayerPlay
} from '@tabler/icons-react'
import { GlowingEffect } from '../ui/glowing-effect'

const AppliedJobCard = ({ job, onScheduleInterview }) => {
  // Early return if job is null/undefined
  if (!job) {
    return null
  }

  const getJobIcon = () => {
    const title = (job.title || '').toLowerCase()
    if (title.includes('engineer') || title.includes('developer')) {
      return <IconCode className="h-4 w-4 text-white" />
    } else if (title.includes('manager') || title.includes('lead')) {
      return <IconUsers className="h-4 w-4 text-white" />
    } else if (title.includes('data') || title.includes('analyst')) {
      return <IconBriefcase className="h-4 w-4 text-white" />
    } else {
      return <IconBuilding className="h-4 w-4 text-white" />
    }
  }

  return (
    <li className="min-h-[20rem] list-none">
      <div className="relative h-full rounded-2xl p-3 md:rounded-3xl md:p-4">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 bg-black dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          {/* Job Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                {getJobIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {job.title || 'Job Title'}
                </h3>
                <p className="text-sm text-white/70">
                  {job.company || 'Company Name'}
                </p>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <IconMapPin size={16} />
              <span>{job.location || 'Location'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/70">
              <IconBriefcase size={16} />
              <span>{job.experience || 'Experience Level'}</span>
            </div>
            
            {(job.skills || []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(job.skills || []).slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/10 text-white text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {(job.skills || []).length > 3 && (
                  <span className="px-2 py-1 bg-white/10 text-white text-xs rounded-full">
                    +{(job.skills || []).length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Schedule Button */}
          <button
            onClick={() => onScheduleInterview(job)}
            className="w-full bg-white text-black hover:bg-gray-200 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <IconCalendar size={16} />
            Schedule AI Interview
          </button>
        </div>
      </div>
    </li>
  )
}

const ScheduledInterviewCard = ({ interview, onDelete, onStartInterview }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [canStart, setCanStart] = useState(false)

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date()
      const scheduledTime = new Date(interview.scheduledAt)
      const timeDiff = scheduledTime.getTime() - now.getTime()

      if (timeDiff <= 0) {
        // Interview time has started
        const endTime = new Date(scheduledTime.getTime() + (interview.duration * 60 * 1000))
        const timeUntilEnd = endTime.getTime() - now.getTime()
        
        if (timeUntilEnd <= 0) {
          setTimeLeft('Interview time has ended')
          setCanStart(false)
        } else {
          const minutes = Math.floor(timeUntilEnd / (1000 * 60))
          const seconds = Math.floor((timeUntilEnd % (1000 * 60)) / 1000)
          setTimeLeft(`Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`)
          setCanStart(true)
        }
      } else {
        // Interview hasn't started yet
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m`)
        } else if (hours > 0) {
          setTimeLeft(`Starts in ${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`Starts in ${minutes}m`)
        }
        setCanStart(false)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [interview.scheduledAt, interview.duration])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const { date, time } = formatDateTime(interview.scheduledAt)

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-black">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{interview.job.title}</h3>
          <p className="text-white/80">{interview.job.company}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
            <span className="flex items-center gap-1">
              <IconCalendar size={16} />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <IconClock size={16} />
              {time}
            </span>
            <span className="px-2 py-1 bg-white text-black rounded-full text-xs">
              {interview.status}
            </span>
          </div>
          <div className="mt-2 text-sm text-white/70">
            {timeLeft}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartInterview(interview)}
            className="bg-white text-black hover:bg-gray-200 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <IconPlayerPlay size={16} />
            Go to Interview
          </button>
          
          <button
            onClick={() => onDelete(interview.id)}
            className="bg-red-600 text-white hover:bg-red-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <IconTrash size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const CalendarModal = ({ job, isOpen, onClose, onConfirmSchedule }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ]

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date)
    }
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleConfirm = () => {
    if (!selectedTime) {
      alert('Please select a time slot')
      return
    }

    const [hours, minutes] = selectedTime.split(':')
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    onConfirmSchedule({
      job,
      scheduledAt: scheduledDateTime,
      duration: 10
    })
  }

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + direction)
      return newMonth
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <IconX size={24} />
          </button>
        </div>

        {job && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-lg font-semibold text-white">{job.title}</h3>
            <p className="text-white/70">{job.company}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="text-white/70 hover:text-white"
              >
                <IconChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="text-white/70 hover:text-white"
              >
                <IconChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm text-white/70 p-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateSelect(date)}
                  disabled={!date || isDateDisabled(date)}
                  className={`p-2 text-sm rounded ${
                    !date
                      ? ''
                      : isDateDisabled(date)
                      ? 'text-white/30 cursor-not-allowed'
                      : selectedDate && date.toDateString() === selectedDate.toDateString()
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Select Time</h3>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`p-2 text-sm rounded ${
                    selectedTime === time
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-white text-black hover:bg-gray-200 font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  )
}

const Schedule = () => {
  const { role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [appliedJobs, setAppliedJobs] = useState([])
  const [scheduledInterviews, setScheduledInterviews] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch applied jobs
  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      console.log('Fetching applied jobs with token:', token ? 'exists' : 'missing')
      const response = await fetch(API_CONFIG.getApiUrl('/jobs/my/applications'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Applied jobs response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Applied jobs data:', data)
        setAppliedJobs(data.applications || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch applied jobs:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }

  // Fetch scheduled interviews
  const fetchScheduledInterviews = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      console.log('Fetching scheduled interviews with token:', token ? 'exists' : 'missing')
      const response = await fetch(API_CONFIG.getApiUrl('/interviews/my-interviews'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Scheduled interviews response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Scheduled interviews data:', data)
        setScheduledInterviews(data.interviews || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch scheduled interviews:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching scheduled interviews:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      await Promise.all([
        fetchAppliedJobs(),
        fetchScheduledInterviews()
      ])
      setLoading(false)
    }

    loadData()
  }, [isAuthenticated])

  const handleScheduleInterview = (job) => {
    setSelectedJob(job)
    setShowCalendarModal(true)
  }

  const handleConfirmSchedule = async (scheduleData) => {
    try {
      const token = localStorage.getItem('hexagon_token')
      const response = await fetch(API_CONFIG.getApiUrl('/interviews/schedule'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: scheduleData.job.id,
          scheduledAt: scheduleData.scheduledAt.toISOString(),
          duration: scheduleData.duration
        })
      })

      if (response.ok) {
        await response.json()
        alert('Interview scheduled successfully!')
        setShowCalendarModal(false)
        setSelectedJob(null)
        fetchScheduledInterviews() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to schedule interview')
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      alert('Failed to schedule interview')
    }
  }

  const handleDeleteInterview = async (interviewId) => {
    if (!confirm('Are you sure you want to delete this interview?')) {
      return
    }

    try {
      const token = localStorage.getItem('hexagon_token')
      const response = await fetch(API_CONFIG.getApiUrl(`/interviews/${interviewId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('Interview deleted successfully!')
        fetchScheduledInterviews() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete interview')
      }
    } catch (error) {
      console.error('Error deleting interview:', error)
      alert('Failed to delete interview')
    }
  }

  const handleStartInterview = (interview) => {
    // Navigate to interview with countdown
    navigate(`/interview?interviewId=${interview.id}`)
  }

  const handleCloseCalendar = () => {
    setShowCalendarModal(false)
    setSelectedJob(null)
  }

  if (!isAuthenticated()) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-white/70">You need to be logged in to access the schedule.</p>
        </div>
      </div>
    )
  }

  if (role !== 'student') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/70">This section is only available for students.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="w-full pt-40 pb-10 px-4">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-white">Schedule Interviews</h1>
            <p className="text-xl text-white mb-8">Schedule AI-powered interviews for your applied jobs</p>
          </div>

          {/* Scheduled Interviews */}
          {scheduledInterviews.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-8">Your Scheduled Interviews</h2>
              <div className="space-y-4">
                {scheduledInterviews.map((interview) => (
                  <ScheduledInterviewCard
                    key={interview.id}
                    interview={interview}
                    onDelete={handleDeleteInterview}
                    onStartInterview={handleStartInterview}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Applied Jobs Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">Your Applied Jobs</h2>
            
            {appliedJobs.length === 0 ? (
              <div className="text-center py-20">
                <IconCalendar size={80} className="mx-auto text-white mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">No Applied Jobs</h3>
                <p className="text-xl text-white mb-8">
                  Apply to jobs first to schedule interviews
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {appliedJobs
                  .filter(application => application.job) // Filter out applications without job data
                  .map((application) => (
                    <AppliedJobCard 
                      key={application.job?.id || application.job}
                      job={application.job}
                      onScheduleInterview={handleScheduleInterview}
                    />
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal
        job={selectedJob}
        isOpen={showCalendarModal}
        onClose={handleCloseCalendar}
        onConfirmSchedule={handleConfirmSchedule}
      />
    </div>
  )
}

export default Schedule