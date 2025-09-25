import React, { useState, useRef, useEffect } from 'react'
import { IconSend, IconUser } from '@tabler/icons-react'

const Chat = () => {
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
    setInputMessage('')
    setShowInput(false)
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: comments.length + 2,
        text: `Thanks for your question: "${inputMessage}". This is a simulated response. In a real implementation, this would connect to an AI service.`,
        author: 'AI Assistant',
        timestamp: new Date(),
        isAI: true
      }
      setComments(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
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
