import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  IconVideo, 
  IconVideoOff, 
  IconMicrophone, 
  IconMicrophoneOff
} from '@tabler/icons-react'

const Interview = () => {
  const { user } = useAuth()
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  
  const videoRef = useRef(null)
  const localStreamRef = useRef(null)

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      })
      
      localStreamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('Video stream set:', stream)
        console.log('Video element:', videoRef.current)
      }
      
      console.log('Camera started successfully')
    } catch (error) {
      console.error('Error accessing camera/microphone:', error)
      alert('Failed to access camera/microphone. Please check permissions and try again.')
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Camera Screen - Like Google Meet */}
      <div className="h-screen flex flex-col">
        {/* Video Preview Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                console.log('Video metadata loaded')
                setVideoLoaded(true)
              }}
              onCanPlay={() => console.log('Video can play')}
              onError={(e) => console.error('Video error:', e)}
            />
            {!videoLoaded && isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <div className="text-white text-xl">Loading camera...</div>
                </div>
              </div>
            )}
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <IconVideoOff size={64} className="mx-auto text-gray-400 mb-4" />
                  <div className="text-white text-xl">Camera is off</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-6 bg-black">
          {/* User Name */}
          <div className="text-white text-lg mb-4 text-center">
            {user?.username || user?.email || 'User'}
          </div>
          
          {/* Debug Info */}
          <div className="text-white/50 text-xs mb-2 text-center">
            Debug: Video: {isVideoEnabled ? 'On' : 'Off'}, Loaded: {videoLoaded ? 'Yes' : 'No'}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-6 mb-4">
            {/* Microphone */}
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isMuted 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {!isMuted ? <IconMicrophone size={28} /> : <IconMicrophoneOff size={28} />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isVideoEnabled ? <IconVideo size={28} /> : <IconVideoOff size={28} />}
            </button>

            {/* Start Interview */}
            <button
              className="w-14 h-14 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <span className="text-xl font-bold">▶</span>
            </button>
          </div>

          {/* Device Info */}
          <div className="text-center text-white/70 text-sm">
            <div className="mb-1">MacBook Air microphone • System Default</div>
            <div>FaceTime HD Camera</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview