import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import API_CONFIG from '../../config/api'

const PreInterview = ({ onStartInterview }) => {
  const [searchParams] = useSearchParams()
  const interviewId = searchParams.get('interviewId')
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [interviewData, setInterviewData] = useState(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [canStart, setCanStart] = useState(false)
  
  const videoRef = useRef(null)
  const localStreamRef = useRef(null)

  const fetchInterviewData = async () => {
    try {
      const token = localStorage.getItem('hexagon_token')
      const response = await fetch(API_CONFIG.getApiUrl(`/interviews/${interviewId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInterviewData(data.interview)
      } else {
        console.error('Failed to fetch interview data')
      }
    } catch (error) {
      console.error('Error fetching interview data:', error)
    }
  }

  // Fetch interview data if interviewId is provided
  useEffect(() => {
    if (interviewId) {
      fetchInterviewData()
    }
  }, [interviewId])

  // Update countdown timer
  useEffect(() => {
    if (!interviewData) return

    const updateCountdown = () => {
      const now = new Date()
      const scheduledTime = new Date(interviewData.scheduledAt)
      const timeDiff = scheduledTime.getTime() - now.getTime()

      if (timeDiff <= 0) {
        // Interview time has started
        const endTime = new Date(scheduledTime.getTime() + (interviewData.duration * 60 * 1000))
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

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [interviewData])

  useEffect(() => {
    startCamera()
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      })
      
      localStreamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera/microphone:', error)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const startInterview = async () => {
    if (interviewId) {
      // Start scheduled interview
      try {
        const token = localStorage.getItem('hexagon_token')
        const response = await fetch(API_CONFIG.getApiUrl(`/interviews/${interviewId}/start`), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          if (onStartInterview) {
            onStartInterview()
          }
        } else {
          const error = await response.json()
          alert(error.message || 'Cannot start interview at this time')
        }
      } catch (error) {
        console.error('Error starting interview:', error)
        alert('Failed to start interview')
      }
    } else {
      // Regular interview start
      if (onStartInterview) {
        onStartInterview()
      }
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-center">
        {/* Video Preview Section */}
        <div className="w-full lg:flex-1 lg:max-w-4xl order-1 lg:order-1">
          <div className="relative rounded-lg overflow-hidden bg-gray-900 shadow-2xl">
            <div className="aspect-video relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => setVideoLoaded(true)}
              />
              {!videoLoaded && isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-sm sm:text-lg">Loading camera...</div>
                </div>
              )}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-black border-2 border-white flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-medium">
                    U
                  </div>
                </div>
              )}
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-black bg-opacity-80 px-2 sm:px-4 py-2 sm:py-3 rounded-full">
              <button
                onClick={toggleAudio}
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
                  !isMuted 
                    ? 'bg-white hover:bg-gray-200' 
                    : 'bg-black hover:bg-gray-800'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {!isMuted ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
                  isVideoEnabled 
                    ? 'bg-white hover:bg-gray-200' 
                    : 'bg-black hover:bg-gray-800'
                }`}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>

              <button
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-all"
                title="More options"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Join Options Section */}
        <div className="w-full sm:w-80 lg:w-80 order-2 lg:order-2 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6 text-center">
            {interviewData ? (
              <>
                <h1 className="text-xl sm:text-2xl font-normal text-white mb-2">
                  {interviewData.job.title}
                </h1>
                <p className="text-white/70 text-sm mb-2">
                  {interviewData.job.company}
                </p>
                <div className="text-white/70 text-sm mb-4">
                  {timeLeft}
                </div>
              </>
            ) : (
              <h1 className="text-xl sm:text-2xl font-normal text-white mb-2">
                Ready to join?
              </h1>
            )}
          </div>

          <button
            onClick={startInterview}
            disabled={interviewData && !canStart}
            className={`w-full font-medium py-2 sm:py-2.5 px-4 sm:px-5 rounded-full transition-colors text-sm sm:text-base shadow-sm ${
              interviewData && !canStart
                ? 'bg-white text-black cursor-not-allowed'
                : 'bg-white hover:bg-gray-200 text-black'
            }`}
          >
            {interviewData ? (canStart ? 'Start Interview' : timeLeft) : 'Ask to join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreInterview