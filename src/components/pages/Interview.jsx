import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX,
  Monitor,
  Grid3x3,
  FileText,
  Settings,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import API_CONFIG from '../../config/api';

const Interview = () => {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get('interviewId');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [layoutMode, setLayoutMode] = useState('sidebar'); // sidebar, spotlight, grid
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Fetch interview data if interviewId is provided
  const fetchInterviewData = async () => {
    if (!interviewId) return;
    
    try {
      const token = localStorage.getItem('hexagon_token');
      const response = await fetch(API_CONFIG.getApiUrl(`/interviews/${interviewId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewData(data.interview);
      } else {
        console.error('Failed to fetch interview data');
      }
    } catch (error) {
      console.error('Error fetching interview data:', error);
    }
  };

  useEffect(() => {
    startCamera();
    fetchInterviewData();
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [interviewId]);

  // Timer effect for interview duration
  useEffect(() => {
    if (!interviewData || interviewData.status !== 'in-progress') return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(interviewData.startedAt.getTime() + (interviewData.duration * 60 * 1000));
      const remaining = Math.max(0, endTime.getTime() - now.getTime());
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Interview time is up
        completeInterview();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [interviewData]);

  const completeInterview = async () => {
    if (!interviewId) return;

    try {
      const token = localStorage.getItem('hexagon_token');
      await fetch(API_CONFIG.getApiUrl(`/interviews/${interviewId}/complete`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Interview completed' })
      });
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setVideoLoaded(true);
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const LayoutMenuItem = ({ mode, label, icon: Icon, description }) => (
    <button
      onClick={() => {
        setLayoutMode(mode);
        setShowLayoutMenu(false);
      }}
      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-700 transition-colors ${
        layoutMode === mode ? 'bg-gray-700' : ''
      }`}
    >
      <Icon size={20} className="mt-1 text-gray-300" />
      <div className="text-left">
        <div className="text-white text-sm font-medium">{label}</div>
        <div className="text-gray-400 text-xs mt-0.5">{description}</div>
      </div>
    </button>
  );

  return (
    <div className="bg-[#202124] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-7xl">
        <div className="flex gap-6 h-[calc(100vh-100px)]">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Video Container */}
            <div className="flex-1 bg-[#1a1a1a] rounded-lg overflow-hidden relative shadow-2xl">
              {/* AI Interviewer Placeholder (Top-right) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg z-10">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="text-white text-sm font-medium">AI Interviewer</div>
                    <div className="text-gray-400 text-xs mt-1">Ready to begin</div>
                  </div>
                </div>
              </div>

              {/* User Video */}
              <div className="relative w-full h-full">
                {isVideoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => setVideoLoaded(true)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">👤</span>
                      </div>
                      <div className="text-white text-xl">Camera is off</div>
                    </div>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {isMuted && (
                    <div className="bg-red-600 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <MicOff size={16} className="text-white" />
                      <span className="text-white text-sm font-medium">Muted</span>
                    </div>
                  )}
                </div>

                {/* Loading Indicator */}
                {!videoLoaded && isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <div className="text-white text-lg">Connecting camera...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="bg-[#1a1a1a] rounded-lg mt-4 px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                {/* Left Section - Info */}
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm">
                    <div className="font-medium">
                      {interviewData ? interviewData.job.title : 'AI Interview'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {interviewData ? interviewData.job.company : 'Interview Preparation'}
                      {timeRemaining > 0 && (
                        <span className="ml-2">
                          • {Math.floor(timeRemaining / 60000)}:{(Math.floor(timeRemaining / 1000) % 60).toString().padStart(2, '0')} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center Section - Main Controls */}
                <div className="flex items-center gap-3">
                  {/* Microphone */}
                  <div className="relative group">
                    <button
                      onClick={toggleAudio}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        !isMuted 
                          ? 'bg-[#3c4043] hover:bg-[#4d5156] text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {!isMuted ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {isMuted ? 'Unmute' : 'Mute'}
                    </div>
                  </div>

                  {/* Camera */}
                  <div className="relative group">
                    <button
                      onClick={toggleVideo}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isVideoEnabled 
                          ? 'bg-[#3c4043] hover:bg-[#4d5156] text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    </div>
                  </div>

                  {/* Speaker */}
                  <div className="relative group">
                    <button
                      onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isSpeakerEnabled 
                          ? 'bg-[#3c4043] hover:bg-[#4d5156] text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      title={isSpeakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
                    >
                      {isSpeakerEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Speaker
                    </div>
                  </div>

                  {/* Screen Share */}
                  <div className="relative group">
                    <button
                      className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4d5156] text-white flex items-center justify-center transition-all"
                      title="Present screen"
                    >
                      <Monitor size={20} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Present
                    </div>
                  </div>

                  {/* Layout Options */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                      className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4d5156] text-white flex items-center justify-center transition-all"
                      title="Change layout"
                    >
                      <Grid3x3 size={20} />
                    </button>
                    
                    {showLayoutMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-[#2d2e30] rounded-lg shadow-xl overflow-hidden w-64">
                        <div className="px-4 py-2 bg-[#3c4043] border-b border-gray-700">
                          <div className="text-white text-sm font-medium">Change layout</div>
                        </div>
                        <LayoutMenuItem 
                          mode="sidebar" 
                          label="Sidebar"
                          icon={Grid3x3}
                          description="AI on side, you centered"
                        />
                        <LayoutMenuItem 
                          mode="spotlight" 
                          label="Spotlight"
                          icon={Monitor}
                          description="Focus on active speaker"
                        />
                        <LayoutMenuItem 
                          mode="grid" 
                          label="Grid"
                          icon={Grid3x3}
                          description="Equal-sized tiles"
                        />
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="relative group">
                    <button
                      className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4d5156] text-white flex items-center justify-center transition-all"
                      title="Settings"
                    >
                      <Settings size={20} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Settings
                    </div>
                  </div>
                </div>

                {/* Right Section - End Interview */}
                <button 
                  onClick={completeInterview}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg"
                >
                  <span>End Interview</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Transcript Sidebar */}
          {showTranscript && (
            <div className="w-80 bg-[#1a1a1a] rounded-lg shadow-xl flex flex-col">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-white font-medium text-sm">Transcript</span>
                </div>
                <button 
                  onClick={() => setShowTranscript(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-gray-400 text-sm text-center py-8">
                  Transcript will appear here during the interview
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Toggle Button */}
        {!showTranscript && (
          <button
            onClick={() => setShowTranscript(true)}
            className="fixed bottom-6 right-6 bg-[#3c4043] hover:bg-[#4d5156] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all"
            title="Show transcript"
          >
            <FileText size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Interview;