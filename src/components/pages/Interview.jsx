import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  IconVideo, 
  IconVideoOff, 
  IconMicrophone, 
  IconMicrophoneOff,
  IconScreenShare,
  IconScreenShareOff,
  IconChartBar
} from '@tabler/icons-react'
import Poll from '../Poll'
import PollManager from '../PollManager'
import Chat from '../Chat'

const Interview = () => {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const [showChat, setShowChat] = useState(true)
  const [showPollManager, setShowPollManager] = useState(false)
  const [activePolls, setActivePolls] = useState([])
  const [isLoadingPolls, setIsLoadingPolls] = useState(false)
  const [currentPoll, setCurrentPoll] = useState(null)
  
  const videoRef = useRef(null)
  const screenRef = useRef(null)

  // Get user media (camera and microphone)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      
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
      
      console.log('Screen stream received:', screenStream)
      setScreenStream(screenStream)
      setIsScreenSharing(true)
      
      // Wait for the ref to be available
      setTimeout(() => {
        if (screenRef.current) {
          console.log('Setting screen stream to video element')
          screenRef.current.srcObject = screenStream
          screenRef.current.play().catch(e => console.log('Play failed:', e))
        } else {
          console.log('Screen ref not available')
        }
      }, 100)
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended')
        stopScreenShare()
      })
      
    } catch (error) {
      console.error('Error starting screen share:', error)
      alert('Failed to start screen sharing. Please check permissions.')
    }
  }

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
      setIsScreenSharing(false)
    }
  }

  // Fetch active polls
  const fetchActivePolls = async () => {
    setIsLoadingPolls(true)
    try {
      const response = await fetch('http://localhost:8000/polls/active')
      if (response.ok) {
        const polls = await response.json()
        setActivePolls(polls)
      }
    } catch (error) {
      console.error('Error fetching polls:', error)
    } finally {
      setIsLoadingPolls(false)
    }
  }

  // Handle poll creation
  const handlePollCreated = (newPoll) => {
    setActivePolls(prev => [...prev, newPoll])
  }

  // Handle poll deletion
  const handlePollDeleted = (pollId) => {
    setActivePolls(prev => prev.filter(poll => poll.id !== pollId))
  }

  // Handle vote
  const handleVote = (pollId, optionId) => {
    // Refresh polls to get updated vote counts
    fetchActivePolls()
  }

  // Toggle chat (close polls if open)
  const toggleChat = () => {
    setShowChat(!showChat)
    if (showPollManager) {
      setShowPollManager(false)
    }
  }

  // Toggle poll manager (close chat if open)
  const togglePollManager = () => {
    if (!showPollManager) {
      // Create a default poll when opening
      const defaultPoll = {
        id: 'default-poll',
        question: 'How do you rate this interview so far?',
        options: [
          { id: 'opt1', text: 'Excellent', votes: 0 },
          { id: 'opt2', text: 'Good', votes: 0 },
          { id: 'opt3', text: 'Average', votes: 0 },
          { id: 'opt4', text: 'Poor', votes: 0 }
        ],
        is_active: true,
        created_at: new Date(),
        total_votes: 0
      }
      setCurrentPoll(defaultPoll)
    }
    
    setShowPollManager(!showPollManager)
    if (showChat) {
      setShowChat(false)
    }
  }

  // Handle vote on current poll
  const handleCurrentPollVote = (optionId) => {
    if (!currentPoll) return

    const updatedPoll = {
      ...currentPoll,
      options: currentPoll.options.map(option => 
        option.id === optionId 
          ? { ...option, votes: option.votes + 1 }
          : option
      )
    }
    
    updatedPoll.total_votes = updatedPoll.options.reduce((total, opt) => total + opt.votes, 0)
    setCurrentPoll(updatedPoll)
  }

  // Start camera on component mount
  useEffect(() => {
    startCamera()
    fetchActivePolls()
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="bg-black text-white pt-32 pb-10 px-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">Interview Setup</h1>
        <p className="text-lg text-gray-400">Prepare for your interview</p>
      </div>

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

        {/* Controls */}
        <div className="flex gap-4 justify-center flex-wrap mb-16">
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

          <button
            onClick={togglePollManager}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              showPollManager 
                ? 'bg-white hover:bg-gray-100 text-black border border-gray-300' 
                : 'bg-black hover:bg-gray-800 text-white border border-gray-600'
            }`}
            title={showPollManager ? 'Hide poll manager' : 'Open poll manager'}
          >
            <IconChartBar size={20} />
            {showPollManager ? 'Hide Polls' : 'New Poll'}
          </button>
        </div>

        {/* AI Chat */}
        {showChat && (
          <div className="bg-black rounded-3xl p-4 w-full max-w-6xl">
            <Chat />
          </div>
        )}

        {/* Current Poll */}
        {showPollManager && currentPoll && (
          <div className="w-full flex justify-center">
            <div className="bg-black rounded-3xl p-4 w-full max-w-4xl">
              <Poll
                poll={currentPoll}
                onVote={handleCurrentPollVote}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Interview


