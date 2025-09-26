import React, { useState, useRef } from 'react'

const TTSTest = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Ready to test')
  const [testText, setTestText] = useState('Hello, this is a test of the text to speech functionality.')
  const currentAudioRef = useRef(null)

  // Simple function to load Puter.js
  const loadPuter = () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window !== 'undefined' && window.puter && window.puter.ai && window.puter.ai.txt2speech) {
        console.log('Puter.js already loaded')
        resolve(true)
        return
      }

      // Check if script already exists
      const existing = document.querySelector('script[src="https://js.puter.com/v2/"]')
      if (existing) {
        console.log('Puter.js script already exists, waiting for load')
        existing.addEventListener('load', () => {
          console.log('Puter.js loaded from existing script')
          resolve(true)
        }, { once: true })
        existing.addEventListener('error', () => {
          console.error('Failed to load Puter.js from existing script')
          reject(new Error('Failed to load Puter.js'))
        }, { once: true })
        return
      }

      // Create new script
      console.log('Loading Puter.js...')
      const script = document.createElement('script')
      script.src = 'https://js.puter.com/v2/'
      script.async = true
      script.onload = () => {
        console.log('Puter.js loaded successfully')
        resolve(true)
      }
      script.onerror = () => {
        console.error('Failed to load Puter.js')
        reject(new Error('Failed to load Puter.js'))
      }
      document.body.appendChild(script)
    })
  }

  // Simple TTS test function
  const testTTS = async () => {
    setIsLoading(true)
    setStatus('Loading Puter.js...')
    
    try {
      // Load Puter.js
      await loadPuter()
      setStatus('Puter.js loaded, testing TTS...')
      
      // Check if TTS function exists
      if (!window.puter?.ai?.txt2speech) {
        throw new Error('TTS function not available')
      }
      
      console.log('Testing TTS with text:', testText)
      setStatus('Generating speech...')
      
      // Call TTS
      const audio = await window.puter.ai.txt2speech(testText, {
        language: 'en-US',
        engine: 'standard'
      })
      
      if (audio) {
        console.log('TTS audio generated:', audio)
        setStatus('Playing audio...')
        
        // Store reference and play
        currentAudioRef.current = audio
        audio.onended = () => {
          console.log('TTS playback finished')
          setStatus('Test completed successfully!')
          currentAudioRef.current = null
        }
        
        await audio.play()
        setStatus('Audio playing...')
      } else {
        throw new Error('No audio returned from TTS')
      }
      
    } catch (error) {
      console.error('TTS Test Error:', error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      setStatus('Audio stopped')
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">TTS Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Text:</label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
          rows={3}
        />
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-300">Status: {status}</p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={testTTS}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test TTS'}
        </button>
        
        <button
          onClick={stopAudio}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Stop Audio
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>This will test the Puter.js TTS functionality</p>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  )
}

export default TTSTest
