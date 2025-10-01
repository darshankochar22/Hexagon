import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  IconVideo, 
  IconVideoOff, 
  IconMicrophone, 
  IconMicrophoneOff,
  IconScreenShare,
  IconScreenShareOff,
  IconChartBar,
  IconFileText,
  IconAlertCircle,
  IconClock,
  IconArrowRight
} from '@tabler/icons-react'
import Chat from '../Chat'
import LLMStreamer from '../../utils/llmStreamer'

const Interview = () => {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const [showChat, setShowChat] = useState(true)
  
  // Job selection & context
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [resumeMeta, setResumeMeta] = useState(null)
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [showJobMenu, setShowJobMenu] = useState(false)

  // LLM streaming states
  const [isLLMStreaming, setIsLLMStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [llmInsights, setLlmInsights] = useState([])
  const [streamingStatus, setStreamingStatus] = useState('')
  
  // Interview flow states
  const [interviewPhase, setInterviewPhase] = useState('setup') // 'setup', 'interviewing', 'completed'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [interviewQuestions, setInterviewQuestions] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  
  const videoRef = useRef(null)
  const screenRef = useRef(null)
  const llmStreamerRef = useRef(null)
  const streamingIntervalRef = useRef(null)
  const timerRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)

  // Fetch jobs and resume meta
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingJobs(true)
        const jobsResp = await fetch('https://backend-ezis.vercel.app/jobs/')
        if (jobsResp.ok) {
          const data = await jobsResp.json()
          setJobs(data.jobs || [])
        }
      } catch (e) {
        console.error('Failed to load jobs', e)
      } finally {
        setLoadingJobs(false)
      }

      // Pull resume meta from user context if present
      if (user?.profile?.resume) {
        setResumeMeta({
          filename: user.profile.resume.filename,
          content_type: user.profile.resume.content_type,
          uploaded_at: user.profile.resume.uploaded_at,
          file_size: user.profile.resume.file_size
        })
      }
    }
    load()
  }, [user])

  // Get user media (camera and microphone)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      localStreamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera/microphone:', error)
      alert('Failed to access camera/microphone. Please check permissions.')
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      setScreenStream(screenStream)
      screenStreamRef.current = screenStream
      setIsScreenSharing(true)
      
      setTimeout(() => {
        if (screenRef.current) {
          screenRef.current.srcObject = screenStream
          screenRef.current.play().catch(e => console.log('Play failed:', e))
        }
      }, 100)
      
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })
      
    } catch (error) {
      console.error('Error starting screen share:', error)
      alert('Failed to start screen sharing. Please check permissions.')
    }
  }

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      setScreenStream(null)
      screenStreamRef.current = null
      setIsScreenSharing(false)
    }
  }

  // Toggle chat
  const toggleChat = () => {
    setShowChat(!showChat)
  }

  // Helper: fetch resume file as base64 for LLM parsing
  const fetchResumeBase64 = async () => {
    try {
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      const resp = await fetch('http://localhost:8000/users/download-resume', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!resp.ok) return null
      const blob = await resp.blob()
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (e) {
      console.error('Failed to fetch resume base64', e)
      return null
    }
  }

  // Initialize LLM streaming session
  const initializeLLMSession = async () => {
    try {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      
      llmStreamerRef.current = new LLMStreamer()
      await llmStreamerRef.current.connectVideoAnalysis(newSessionId, user?.id || 'anonymous')
      
      llmStreamerRef.current.onAnalysis((analysis) => {
        setLlmInsights(prev => [...prev, analysis])
      })

      // Build rich interview context for testing
      let resumeBase64 = null
      if (user?.profile?.resume) {
        resumeBase64 = await fetchResumeBase64()
      }

      const jobContextList = jobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        experience: j.experience,
        skills: j.skills,
        description: j.description
      }))

      const directives = {
        objective: 'Parse and analyze candidate against selected job and full job list',
        tasks: [
          'Parse resume (if provided). Extract ALL links (GitHub, LinkedIn, portfolio, live demos, papers).',
          'Identify all projects with tech stack, role, outcomes, dates.',
          'Summarize strengths, gaps, red flags, and seniority signals.',
          'Cross-check candidate fit against selected job and suggest 5 tailored questions.',
          'Generate short feedback: what to probe more and recommended coding/architecture tasks.'
        ]
      }

      // Send context to LLM
      llmStreamerRef.current.sendInterviewContext({
        type: 'interview_context',
        user_id: user?.id || 'anonymous',
        selected_job: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
          experience: selectedJob.experience,
          skills: selectedJob.skills,
          description: selectedJob.description
        } : null,
        all_jobs: jobContextList,
        resume_meta: resumeMeta || null,
        resume_file_base64: resumeBase64 || null,
        directives
      })
      
    } catch (error) {
      console.error('Failed to initialize LLM session:', error)
      setStreamingStatus('Failed to initialize LLM session')
    }
  }

  // Start LLM streaming
  const startLLMStreaming = async () => {
    if (!localStream) {
      alert('Please start your camera first')
      return
    }

    try {
      if (!llmStreamerRef.current) {
        await initializeLLMSession()
      }

      setIsLLMStreaming(true)
      setStreamingStatus('LLM analysis started...')
      
      if (videoRef.current) {
        streamingIntervalRef.current = await llmStreamerRef.current.startVideoAnalysis(
          videoRef.current,
          user?.id || 'anonymous',
          15000
        )
      }
      
    } catch (error) {
      console.error('Failed to start LLM streaming:', error)
      setStreamingStatus('Failed to start LLM streaming')
    }
  }

  // Stop LLM streaming
  const stopLLMStreaming = () => {
    setIsLLMStreaming(false)
    setStreamingStatus('LLM analysis stopped')
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }
  }

  // Initialize AI interviewer session
  const initializeAIInterviewer = async () => {
    if (!selectedJob) {
      alert('Please select a job first')
      return
    }

    setIsGeneratingResponse(true)
    setAiResponse('Initializing AI interviewer...')

    try {
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      const resumeBase64 = await fetchResumeBase64()
      
      const response = await fetch('http://localhost:8000/llm/initialize-interviewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          job_description: selectedJob.description,
          job_title: selectedJob.title,
          job_company: selectedJob.company,
          job_skills: selectedJob.skills,
          resume_base64: resumeBase64,
          user_id: user?.id || 'anonymous'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(data.ai_response || 'AI interviewer ready! Let\'s begin the interview.')
        setInterviewQuestions([{ question: "Ready to start", category: "Setup", time_limit: 30 }])
      } else {
        throw new Error('Failed to initialize interviewer')
      }
    } catch (error) {
      console.error('Error initializing interviewer:', error)
      setAiResponse('Error initializing interviewer. Please try again.')
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  // Generate next question dynamically
  const generateNextQuestion = useCallback(async () => {
    try {
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      const resumeBase64 = await fetchResumeBase64()
      
      const response = await fetch('http://localhost:8000/llm/generate-next-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          job_description: selectedJob.description,
          job_title: selectedJob.title,
          job_company: selectedJob.company,
          job_skills: selectedJob.skills,
          resume_base64: resumeBase64,
          user_id: user?.id || 'anonymous',
          current_question_index: currentQuestionIndex,
          total_questions: 5,
          previous_questions: interviewQuestions.slice(0, currentQuestionIndex).map(q => q.question),
          llm_insights: llmInsights.slice(-3) // Last 3 insights for context
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newQuestion = {
          question: data.question,
          category: data.category || 'General',
          time_limit: 30
        }
        
        setInterviewQuestions(prev => [...prev, newQuestion])
        setAiResponse(data.ai_response || '')
        return newQuestion
      } else {
        throw new Error('Failed to generate next question')
      }
    } catch (error) {
      console.error('Error generating next question:', error)
      setAiResponse('Error generating question. Please try again.')
      return null
    }
  }, [selectedJob, currentQuestionIndex, interviewQuestions, llmInsights, user?.id])

  // Start interview
  const startInterview = async () => {
    if (interviewQuestions.length === 0) {
      alert('Please initialize interviewer first')
      return
    }
    
    setInterviewPhase('interviewing')
    setCurrentQuestionIndex(0)
    setTimeRemaining(30)
    setIsTimerRunning(true)
    setAiResponse('')
    
    // Generate first question
    await generateNextQuestion()
  }

  // Skip to next question
  const nextQuestion = async () => {
    if (isTimerRunning) {
      setIsTimerRunning(false)
    }
    
    if (currentQuestionIndex < 4) { // 0-4 for 5 questions total
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setTimeRemaining(30)
      setIsTimerRunning(true)
      setAiResponse('')
      
      // Generate next question if we don't have it yet
      if (nextIndex >= interviewQuestions.length) {
        await generateNextQuestion()
      }
    } else {
      setInterviewPhase('completed')
      await generateInterviewSummary()
    }
  }

  // Reset interview
  const resetInterview = () => {
    setInterviewPhase('setup')
    setCurrentQuestionIndex(0)
    setInterviewQuestions([])
    setTimeRemaining(30)
    setIsTimerRunning(false)
    setAiResponse('')
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  // Start screen share LLM analysis
  const startScreenAnalysis = async () => {
    if (!screenStream) {
      alert('Please start screen sharing first')
      return
    }

    try {
      if (!llmStreamerRef.current) {
        await initializeLLMSession()
      }

      await llmStreamerRef.current.connectScreenAnalysis(sessionId, user?.id || 'anonymous')
      
      if (screenRef.current) {
        const screenInterval = await llmStreamerRef.current.startScreenAnalysis(
          screenRef.current,
          user?.id || 'anonymous',
          30000
        )
        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current)
        streamingIntervalRef.current = screenInterval
      }
      
      setStreamingStatus('Screen analysis started...')
      
    } catch (error) {
      console.error('Failed to start screen analysis:', error)
      setStreamingStatus('Failed to start screen analysis')
    }
  }

  // Generate interview summary
  const generateInterviewSummary = async () => {
    try {
      const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token') || localStorage.getItem('jwt')
      
      const response = await fetch('http://localhost:8000/media/generate-interview-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: user?.id || 'anonymous',
          session_id: sessionId,
          job_title: selectedJob?.title || '',
          job_company: selectedJob?.company || '',
          interview_questions: interviewQuestions,
          llm_insights: llmInsights,
          chat_history: [] // You can add chat history if needed
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(`Interview completed! Detailed summary generated and stored. Summary: ${data.summary.substring(0, 200)}...`)
      } else {
        setAiResponse('Interview completed! Thank you for your time.')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      setAiResponse('Interview completed! Thank you for your time.')
    }
  }

  // Handle time up for current question
  const handleTimeUp = useCallback(async () => {
    setIsTimerRunning(false)
    setAiResponse('Time\'s up! Let\'s proceed to the next question.')
    
    setTimeout(async () => {
      if (currentQuestionIndex < 4) { // 0-4 for 5 questions total
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        setTimeRemaining(30)
        setIsTimerRunning(true)
        setAiResponse('')
        
        // Generate next question if we don't have it yet
        if (nextIndex >= interviewQuestions.length) {
          await generateNextQuestion()
        }
      } else {
        setInterviewPhase('completed')
        await generateInterviewSummary()
      }
    }, 2000)
  }, [currentQuestionIndex, interviewQuestions.length, generateNextQuestion, selectedJob, sessionId, llmInsights, user?.id])

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
    } else if (timeRemaining === 0 && isTimerRunning) {
      handleTimeUp()
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerRunning, timeRemaining, handleTimeUp])

  // When a job is selected from dropdown, set selectedJob
  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null)
      return
    }
    const job = jobs.find(j => j.id === selectedJobId)
    setSelectedJob(job || null)
  }, [selectedJobId, jobs])

  // Start camera on component mount
  useEffect(() => {
    startCamera()
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (llmStreamerRef.current) {
        llmStreamerRef.current.cleanup()
      }
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, []) // Empty dependency array to prevent re-running

  return (
    <div className="bg-black text-white pt-32 pb-10 px-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">Interview Setup</h1>
        <p className="text-lg text-gray-400">Prepare for your interview</p>
      </div>

      {/* Job+resume controls moved below into Controls bar */}

      <div className="flex flex-col items-center gap-6 mb-32">
        {/* Camera Video Section */}
        <div className="bg-black rounded-3xl p-4 w-full max-w-6xl">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-4 flex items-center justify-center">
            {localStream && isVideoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-400">
                <IconVideo size={64} />
                <p className="mt-4 text-lg">Camera will appear here</p>
              </div>
            )}
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <span className="bg-black/70 px-4 py-2 rounded-full text-sm font-medium">
                {user?.username || 'Candidate'}
              </span>
              {!isVideoEnabled && (
                <div className="bg-red-600/70 px-4 py-2 rounded-full flex items-center gap-2">
                  <IconVideoOff size={20} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Screen Share Section */}
        <div className="bg-black rounded-3xl p-4 w-full max-w-6xl">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-4 flex items-center justify-center">
            {screenStream && isScreenSharing ? (
              <video
                ref={screenRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ 
                  backgroundColor: 'black',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-400">
                <IconScreenShare size={64} />
                <p className="mt-4 text-lg">Screen share will appear here</p>
              </div>
            )}
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <span className="bg-black/70 px-4 py-2 rounded-full text-sm font-medium">
                Screen Share
              </span>
              {isScreenSharing && (
                <div className="bg-green-600/70 px-4 py-2 rounded-full flex items-center gap-2">
                  <IconScreenShare size={20} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LLM Status Display */}
        {(isLLMStreaming || streamingStatus) && (
          <div className="bg-gray-900 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isLLMStreaming && (
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span>LLM Analysis Active</span>
                  </div>
                )}
                {sessionId && (
                  <div className="text-sm text-gray-400">
                    Session: {sessionId.substring(0, 8)}...
                  </div>
                )}
              </div>
              {streamingStatus && (
                <div className="text-sm text-blue-400">
                  {streamingStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 justify-center flex-wrap mb-8 relative">
          {/* Job chooser button + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowJobMenu((v) => !v)}
              className="px-4 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors"
              title="Select job for interview context"
            >
              {selectedJob ? `Job: ${selectedJob.title}` : (loadingJobs ? 'Loading jobs…' : 'Choose Job')}
            </button>
            {showJobMenu && (
              <div className="absolute z-20 mt-2 w-72 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black shadow-xl">
                <ul className="divide-y divide-white/5">
                  {jobs.length === 0 && (
                    <li className="px-3 py-2 text-sm text-white/60">{loadingJobs ? 'Loading…' : 'No jobs available'}</li>
                  )}
                  {jobs.map((j) => (
                    <li key={j.id}>
                      <button
                        onClick={() => { setSelectedJobId(j.id); setShowJobMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10"
                      >
                        {j.title} — {j.company}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Resume status chip */}
          {resumeMeta ? (
            <div className="px-4 py-3 rounded-full bg-white text-black text-sm font-medium flex items-center gap-2">
              <span className="inline-flex w-2 h-2 rounded-full bg-green-500"></span>
              <IconFileText size={16} />
              <span>Resume linked</span>
            </div>
          ) : (
            <a
              href="/profile"
              className="px-4 py-3 rounded-full bg-white text-black text-sm font-medium flex items-center gap-2 hover:bg-gray-200"
              title="Upload resume in Profile"
            >
              <IconAlertCircle size={16} />
              <span>Add resume</span>
            </a>
          )}

          <button
            onClick={toggleVideo}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              isVideoEnabled 
                ? 'bg-white hover:bg-gray-100 text-black border border-gray-300' 
                : 'bg-black hover:bg-gray-800 text-white border border-gray-600'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
            {isVideoEnabled ? 'Camera On' : 'Camera Off'}
          </button>

          <button
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              !isMuted 
                ? 'bg-white hover:bg-gray-100 text-black border border-gray-300' 
                : 'bg-black hover:bg-gray-800 text-white border border-gray-600'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
            {isMuted ? 'Muted' : 'Unmuted'}
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              isScreenSharing 
                ? 'bg-white hover:bg-gray-100 text-black border border-gray-300' 
                : 'bg-black hover:bg-gray-800 text-white border border-gray-600'
            }`}
            title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
          >
            {isScreenSharing ? <IconScreenShareOff size={20} /> : <IconScreenShare size={20} />}
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </button>
        </div>

        {/* LLM Analysis Controls */}
        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <button
            onClick={isLLMStreaming ? stopLLMStreaming : startLLMStreaming}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              isLLMStreaming 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title={isLLMStreaming ? 'Stop LLM analysis' : 'Start LLM analysis'}
          >
            {isLLMStreaming ? <IconVideoOff size={20} /> : <IconVideo size={20} />}
            {isLLMStreaming ? 'Stop Analysis' : 'Start Analysis'}
          </button>

          <button
            onClick={startScreenAnalysis}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
            title="Analyze screen share with LLM"
            disabled={!isScreenSharing}
          >
            <IconScreenShare size={20} />
            Analyze Screen
          </button>
        </div>

        {/* Interview Flow Controls */}
        {interviewPhase === 'setup' && (
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <button
              onClick={initializeAIInterviewer}
              disabled={!selectedJob || isGeneratingResponse}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                !selectedJob || isGeneratingResponse
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Initialize AI interviewer"
            >
              {isGeneratingResponse ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <IconFileText size={20} />
                  Initialize Interviewer
                </>
              )}
            </button>
          </div>
        )}

        {interviewPhase === 'setup' && interviewQuestions.length > 0 && (
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <button
              onClick={startInterview}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 bg-green-600 hover:bg-green-700 text-white"
              title="Start the interview"
            >
              <IconArrowRight size={20} />
              Start Interview
            </button>
            <button
              onClick={resetInterview}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 bg-gray-600 hover:bg-gray-700 text-white"
              title="Reset interview"
            >
              Reset
            </button>
          </div>
        )}

        {/* Interview Question Display */}
        {interviewPhase === 'interviewing' && (
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-4xl mb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <IconClock size={20} />
                  <span className="text-2xl font-bold">{timeRemaining}s</span>
                </div>
                <div className="text-sm text-gray-400">
                  Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((30 - timeRemaining) / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-black rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-center">Interview Question</h3>
              <p className="text-lg text-gray-300 text-center leading-relaxed">
                {interviewQuestions[currentQuestionIndex]?.question || 'Loading question...'}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
                title="Skip to next question"
              >
                <IconArrowRight size={20} />
                Next Question
              </button>
            </div>
          </div>
        )}

        {/* Interview Completed */}
        {interviewPhase === 'completed' && (
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-4xl mb-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-green-400">Interview Completed!</h3>
            <p className="text-lg text-gray-300 mb-6">Thank you for participating in the interview.</p>
            <button
              onClick={resetInterview}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white mx-auto"
              title="Start a new interview"
            >
              Start New Interview
            </button>
          </div>
        )}

        {/* AI Response Display */}
        {aiResponse && (
          <div className="bg-gray-900 rounded-2xl p-4 w-full max-w-4xl mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-400">AI Interviewer</span>
            </div>
            <p className="text-gray-300">{aiResponse}</p>
          </div>
        )}

        {/* Additional Controls */}
        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <button
            onClick={toggleChat}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              showChat 
                ? 'bg-white hover:bg-gray-100 text-black border border-gray-300' 
                : 'bg-black hover:bg-gray-800 text-white border border-gray-600'
            }`}
            title={showChat ? 'Hide AI chat' : 'Open AI chat'}
          >
            <IconChartBar size={20} />
            {showChat ? 'Hide Chat' : 'AI Chat'}
          </button>
        </div>

        {/* AI Chat */}
        {showChat && (
          <div className="bg-black rounded-3xl p-4 w-full max-w-6xl">
            <Chat
              selectedJob={selectedJob}
              allJobs={jobs}
              resumeMeta={resumeMeta}
              fetchResumeBase64={fetchResumeBase64}
              sessionId={sessionId}
              insights={llmInsights}
            />
          </div>
        )}

        {/* LLM Insights - Hidden from UI but still running in background */}
        {/* Analysis data is still being collected and sent to backend/chatbot */}
      </div>
    </div>
  )
}

export default Interview


