import React, { useState, useEffect } from 'react'
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
  IconX
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
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="flex justify-between items-start">
              <div className="w-fit rounded-lg p-2 bg-black">
                {getJobIcon()}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                {job.title || 'Untitled Job'}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-white text-sm">
                  <IconBuilding size={16} />
                  {job.company || 'Unknown Company'}
                </div>
                <div className="flex items-center gap-3 text-white text-sm">
                  <IconMapPin size={16} />
                  {job.location || 'Location not specified'}
                </div>
              </div>

              <div>
                <span className="px-3 py-1 bg-black text-white rounded-full text-sm font-bold">
                  {job.experience || 'Mid'} Level
                </span>
              </div>
              
              <div>
                <div className="flex flex-wrap gap-2">
                  {(job.skills || []).slice(0, 3).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-black text-white text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                  {(job.skills || []).length > 3 && (
                    <span className="px-2 py-1 bg-black text-white text-xs rounded-full">
                      +{(job.skills || []).length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => onScheduleInterview(job)}
              className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-all font-bold text-sm"
            >
              <IconCalendar size={16} />
              Schedule AI Interview
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

const CalendarModal = ({ job, isOpen, onClose, onConfirmSchedule }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
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
      const currentDate = new Date(year, month, day)
      const today = new Date()
      const isPast = currentDate < today
      const isToday = currentDate.toDateString() === today.toDateString()
      
      days.push({
        day,
        date: currentDate,
        isPast,
        isToday
      })
    }
    
    return days
  }

  const handleDateSelect = (dayData) => {
    if (dayData && !dayData.isPast) {
      setSelectedDate(dayData.date)
      setSelectedTime(null) // Reset time when date changes
    }
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirmSchedule({
        job,
        date: selectedDate,
        time: selectedTime
      })
      onClose()
    }
  }

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + direction)
      return newMonth
    })
  }

  if (!isOpen || !job) return null

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/15">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Schedule AI Interview</h2>
            <p className="text-white/80 text-sm mt-1">{job.title} — {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-red-500 transition-colors bg-black rounded-lg"
            title="Close"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Select Date</h3>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-white hover:text-gray-300 transition-colors"
              >
                <IconChevronLeft size={20} />
              </button>
              <h4 className="text-white font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-white hover:text-gray-300 transition-colors"
              >
                <IconChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-black rounded-lg p-4 border border-white/10">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-white/70 text-sm font-semibold p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((dayData, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(dayData)}
                    disabled={!dayData || dayData.isPast}
                    className={`
                      p-2 text-sm rounded-lg transition-colors
                      ${!dayData 
                        ? 'invisible' 
                        : dayData.isPast 
                          ? 'text-white/30 cursor-not-allowed' 
                          : selectedDate && selectedDate.toDateString() === dayData.date.toDateString()
                            ? 'bg-white text-black'
                            : dayData.isToday
                              ? 'bg-white/20 text-white border border-white'
                              : 'text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {dayData?.day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Selection Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Select Time (10 min slots)</h3>
            
            {selectedDate ? (
              <div className="bg-black rounded-lg p-4 border border-white/10">
                <div className="text-white/80 text-sm mb-4">
                  Selected: {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`
                        p-2 text-sm rounded-lg transition-colors
                        ${selectedTime === time
                          ? 'bg-white text-black'
                          : 'text-white hover:bg-white/10 border border-white/20'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-black rounded-lg p-8 border border-white/10 text-center">
                <IconCalendar size={48} className="mx-auto text-white/50 mb-4" />
                <p className="text-white/70">Please select a date first</p>
              </div>
            )}
          </div>
        </div>

        {/* Interview Details */}
        <div className="mt-8 p-4 bg-black border border-white/20 rounded-lg">
          <h4 className="text-white font-semibold mb-2">🎯 AI Interview Details</h4>
          <div className="text-white/90 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <IconClock size={16} />
              <span>Duration: 10 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <IconVideo size={16} />
              <span>Format: AI-powered video interview</span>
            </div>
            <div className="flex items-center gap-2">
              <IconUser size={16} />
              <span>Questions: Tailored based on your resume analysis</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [appliedJobs, setAppliedJobs] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [scheduledInterviews, setScheduledInterviews] = useState([])

  useEffect(() => {
    if (role === 'student' && isAuthenticated()) {
      fetchAppliedJobs()
    }
  }, [role, isAuthenticated])

  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      if (!token) return
      
      const response = await fetch(API_CONFIG.getApiUrl('/jobs/my/applications'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppliedJobs(data.applications || [])
      } else {
        console.error('Failed to fetch applied jobs:', response.status)
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }

  const handleScheduleInterview = (job) => {
    setSelectedJob(job)
    setShowCalendarModal(true)
  }

  const handleConfirmSchedule = (scheduleData) => {
    const interview = {
      id: Date.now(),
      job: scheduleData.job,
      date: scheduleData.date,
      time: scheduleData.time,
      status: 'scheduled',
      createdAt: new Date()
    }
    
    setScheduledInterviews(prev => [...prev, interview])
    alert(`Interview scheduled for ${scheduleData.date.toLocaleDateString()} at ${scheduleData.time}`)
  }

  const handleCloseCalendar = () => {
    setShowCalendarModal(false)
    setSelectedJob(null)
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

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="w-full pt-40 pb-10 px-4">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-white">Schedule Interviews</h1>
            <p className="text-xl text-white mb-8">Schedule AI-powered interviews for your applied jobs</p>
          </div>

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

          {/* Scheduled Interviews */}
          {scheduledInterviews.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-8">Scheduled Interviews</h2>
              <div className="space-y-4">
                {scheduledInterviews.map((interview) => (
                  <div key={interview.id} className="border border-white/10 rounded-lg p-6 bg-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{interview.job.title}</h3>
                        <p className="text-white/80">{interview.job.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <IconCalendar size={16} />
                            {interview.date.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconClock size={16} />
                            {interview.time}
                          </span>
                          <span className="px-2 py-1 bg-white text-black rounded-full text-xs">
                            {interview.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/70 text-sm">10 min AI Interview</div>
                        <div className="text-white/70 text-sm">Video Call</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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