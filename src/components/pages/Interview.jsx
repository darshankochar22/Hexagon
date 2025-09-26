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
  
  // LLM streaming states
  const [isLLMStreaming, setIsLLMStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [llmInsights, setLlmInsights] = useState([])
  const [streamingStatus, setStreamingStatus] = useState('')
  
  const videoRef = useRef(null)
  const screenRef = useRef(null)
  const llmStreamerRef = useRef(null)
  const streamingIntervalRef = useRef(null)

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

  // Toggle chat
  const toggleChat = () => {
    setShowChat(!showChat)
  }

  // Initialize LLM streaming session
  const initializeLLMSession = async () => {
    try {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      
      llmStreamerRef.current = new LLMStreamer()
      await llmStreamerRef.current.connectVideoAnalysis(newSessionId, user?.id || 'anonymous')
      
      // Set up analysis callback
      llmStreamerRef.current.onAnalysis((analysis) => {
        setLlmInsights(prev => [...prev, analysis])
        console.log('LLM Analysis received:', analysis)
      })
      
      console.log('LLM session initialized:', newSessionId)
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
      
      // Start video analysis
      if (videoRef.current) {
        streamingIntervalRef.current = llmStreamerRef.current.startVideoAnalysis(
          videoRef.current, 
          user?.id || 'anonymous', 
          2000 // Analyze every 2 seconds
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

      // Connect to screen analysis
      await llmStreamerRef.current.connectScreenAnalysis(sessionId, user?.id || 'anonymous')
      
      // Start screen analysis
      if (screenRef.current) {
        const screenInterval = llmStreamerRef.current.startScreenAnalysis(
          screenRef.current, 
          user?.id || 'anonymous', 
          3000 // Analyze every 3 seconds
        )
        
        // Store interval for cleanup
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current)
        }
        streamingIntervalRef.current = screenInterval
      }
      
      setStreamingStatus('Screen analysis started...')
      
    } catch (error) {
      console.error('Failed to start screen analysis:', error)
      setStreamingStatus('Failed to start screen analysis')
    }
  }

  // Start camera on component mount
  useEffect(() => {
    startCamera()
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
      if (llmStreamerRef.current) {
        llmStreamerRef.current.cleanup()
      }
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
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
        <div className="flex gap-4 justify-center flex-wrap mb-8">
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
            <Chat />
          </div>
        )}

        {/* LLM Insights */}
        {llmInsights.length > 0 && (
          <div className="bg-black rounded-3xl p-4 w-full max-w-6xl">
            <h3 className="text-xl font-bold mb-4 text-center">Real-time Interview Analysis</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {llmInsights.slice(-10).map((insight, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-blue-400">
                      {insight.type === 'video_analysis' ? 'Video Analysis' : 
                       insight.type === 'screen_analysis' ? 'Screen Analysis' : 
                       insight.type === 'audio_analysis' ? 'Audio Analysis' : 'Analysis'}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    {insight.analysis}
                  </div>
                  {insight.insights && insight.insights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.insights.map((insightTag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-blue-600 text-xs rounded-full">
                          {insightTag}
                        </span>
                      ))}
                    </div>
                  )}
                  {insight.confidence && (
                    <div className="text-xs text-gray-400 mt-2">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Interview


