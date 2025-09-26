import React, { useState, useRef, useEffect } from 'react'
import { IconSend, IconUser } from '@tabler/icons-react'

const Chat = ({ selectedJob, allJobs, resumeMeta, fetchResumeBase64, sessionId, insights }) => {
  const [comments, setComments] = useState([
    {
      id: 1,
      text: "Welcome to the interview! Feel free to ask any questions.",
      author: 'Interviewer',
      timestamp: new Date(),
      isAI: true
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [chatHistory, setChatHistory] = useState([]) // {role, content}
  const messagesEndRef = useRef(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceLanguage, setVoiceLanguage] = useState('en-US')
  const [voiceEngine, setVoiceEngine] = useState('standard') // 'standard' | 'neural' | 'generative'

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const speakWithPuter = async (text) => {
    try {
      console.log('Starting TTS for text:', text.substring(0, 100) + '...')
  
      if (!("speechSynthesis" in window)) {
        throw new Error("Browser does not support SpeechSynthesis API")
      }
  
      const maxLen = 2500
      const chunks = []
      let remaining = text || ''
  
      // 🔹 split into chunks (like your original function)
      while (remaining.length > maxLen) {
        const slice = remaining.slice(0, maxLen)
        const lastPunct = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('\n'))
        const cut = lastPunct > 500 ? lastPunct + 1 : maxLen
        chunks.push(remaining.slice(0, cut))
        remaining = remaining.slice(cut)
      }
      if (remaining) chunks.push(remaining)
  
      console.log(`Split text into ${chunks.length} chunks`)
  
      const audios = []
  
      for (const c of chunks) {
        try {
          console.log('Generating TTS for chunk:', c.substring(0, 50) + '...')
  
          const utterance = new SpeechSynthesisUtterance(c)
          utterance.lang = voiceLanguage || "en-US"
          utterance.rate = 1
          utterance.pitch = 1
          utterance.voice = speechSynthesis.getVoices().find(v => v.name === "Google US English") || null
  
          // Wrap utterance in a promise so it plays sequentially
          const playPromise = new Promise((resolve, reject) => {
            utterance.onend = resolve
            utterance.onerror = reject
          })
  
          window.speechSynthesis.speak(utterance)
          await playPromise
  
          audios.push(utterance)
          console.log('TTS chunk played successfully')
        } catch (chunkError) {
          console.error('Failed to generate/play TTS for chunk:', chunkError)
        }
      }
  
      if (audios.length > 0) {
        console.log(`Played ${audios.length} audio chunks successfully`)
      } else {
        console.warn('No audio chunks were spoken')
      }
    } catch (error) {
      console.error('TTS Error:', error)
    }
  }
  
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userComment = {
      id: comments.length + 1,
      text: inputMessage,
      author: 'You',
      timestamp: new Date(),
      isAI: false
    }

    setComments(prev => [...prev, userComment])
    setChatHistory(prev => [...prev, { role: 'user', content: inputMessage }])
    setInputMessage('')
    setShowInput(false)
    setIsTyping(true)

    try {
      // Prepare context; optionally include resume file as base64
      let resumeBase64 = null
      if (resumeMeta && typeof fetchResumeBase64 === 'function') {
        try {
          resumeBase64 = await fetchResumeBase64()
        } catch {
          resumeBase64 = null
        }
      }

      // Optional: fetch recent session insights to enrich context
      let sessionInsights = null
      try {
        if (sessionId) {
          const r = await fetch(`http://localhost:8000/media/llm/insights/${sessionId}`)
          if (r.ok) {
            sessionInsights = await r.json()
          }
        }
      } catch {
        // ignore session insights fetch errors to keep chat responsive
      }

      // Include the on-page (blue box) insights as an immediate context tail as well
      let localInsightsTail = []
      try {
        const tail = Array.isArray(insights) ? insights.slice(-5) : []
        localInsightsTail = tail.map(it => ({
          type: it.type,
          timestamp: it.timestamp,
          analysis: it.analysis,
          insights: it.insights
        }))
      } catch {
        // ignore local insights extraction errors
      }

      const payload = {
        session_id: sessionId || null,
        messages: chatHistory.concat([{ role: 'user', content: userComment.text }]),
        selected_job: selectedJob || null,
        all_jobs: (allJobs || []).map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          experience: j.experience,
          skills: j.skills,
          description: j.description
        })),
        resume_meta: resumeMeta || null,
        resume_file_base64: resumeBase64,
        session_insights: sessionInsights,
        local_insights_tail: localInsightsTail
      }

      const resp = await fetch('http://localhost:8000/media/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || `HTTP ${resp.status}`)
      }

      const data = await resp.json()
      const answer = data.reply || 'No reply'

      const aiResponse = {
        id: comments.length + 2,
        text: answer,
        author: 'AI Assistant',
        timestamp: new Date(),
        isAI: true
      }
      setComments(prev => [...prev, aiResponse])
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }])

      // Optional voice playback
      if (voiceEnabled && answer && answer.length < 3000) {
        console.log('Triggering TTS for AI response:', answer.substring(0, 100) + '...')
        speakWithPuter(answer)
      } else {
        console.log('TTS skipped - voiceEnabled:', voiceEnabled, 'answer length:', answer?.length)
      }
    } catch (e) {
      const aiResponse = {
        id: comments.length + 2,
        text: `AI error: ${e.message}`,
        author: 'System',
        timestamp: new Date(),
        isAI: true
      }
      setComments(prev => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAskQuestion = () => {
    if (showInput) {
      handleSendMessage()
    } else {
      setShowInput(true)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-white mb-1">Chat</h3>
        <p className="text-sm text-white">Ask questions or leave comments during the interview</p>
      </div>

      {/* Comments Section */}
      <div className="bg-black rounded-2xl h-96 overflow-y-auto p-4 mb-4 w-full max-w-4xl">
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="pb-3 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <IconUser size={16} className="text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.author}</span>
                    {comment.isAI && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        AI
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-white">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <IconUser size={16} className="text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">AI Assistant</span>
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                      AI
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Comment Input - Retweet Style */}
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
        {showInput && (
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            className="w-full p-3 bg-black border border-white rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-300"
            autoFocus
          />
        )}
        {/* Voice controls */}
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              Voice replies
            </label>
            <select
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className="bg-black border border-white rounded-md text-white text-sm px-2 py-1"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="es-ES">Spanish</option>
              <option value="it-IT">Italian</option>
            </select>
            <select
              value={voiceEngine}
              onChange={(e) => setVoiceEngine(e.target.value)}
              className="bg-black border border-white rounded-md text-white text-sm px-2 py-1"
            >
              <option value="standard">Standard</option>
              <option value="neural">Neural</option>
              <option value="generative">Generative</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={stopSpeaking}
              className="px-3 py-1 bg-black border border-white text-white rounded-md text-sm hover:bg-gray-800"
            >
              Stop voice
            </button>
          </div>
        </div>
        <button
          onClick={handleAskQuestion}
          disabled={isTyping}
          className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <IconSend size={20} />
          {showInput ? 'Post Question' : 'Ask Question'}
        </button>
      </div>
    </div>
  )
}

export default Chat