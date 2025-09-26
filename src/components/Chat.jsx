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
