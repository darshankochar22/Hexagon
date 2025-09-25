import React, { useState } from 'react'
import { IconPlus, IconX, IconChartBar, IconTrash, IconPower } from '@tabler/icons-react'

const PollManager = ({ onPollCreated, onPollDeleted }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isCreating, setIsCreating] = useState(false)

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const createPoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert('Please fill in the question and all options')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:8000/polls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          options: options.filter(opt => opt.trim()),
          is_active: true
        })
      })

      if (response.ok) {
        const newPoll = await response.json()
        setQuestion('')
        setOptions(['', ''])
        setShowCreateForm(false)
        onPollCreated && onPollCreated(newPoll)
        alert('Poll created successfully!')
      } else {
        alert('Failed to create poll. Please try again.')
      }
    } catch (error) {
      console.error('Error creating poll:', error)
      alert('Failed to create poll. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const togglePollStatus = async (pollId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/polls/${pollId}/toggle`, {
        method: 'PUT'
      })

      if (response.ok) {
        alert(`Poll ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
      } else {
        alert('Failed to toggle poll status.')
      }
    } catch (error) {
      console.error('Error toggling poll:', error)
      alert('Failed to toggle poll status.')
    }
  }

  const deletePoll = async (pollId) => {
    if (!confirm('Are you sure you want to delete this poll?')) return

    try {
      const response = await fetch(`http://localhost:8000/polls/${pollId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onPollDeleted && onPollDeleted(pollId)
        alert('Poll deleted successfully!')
      } else {
        alert('Failed to delete poll.')
      }
    } catch (error) {
      console.error('Error deleting poll:', error)
      alert('Failed to delete poll.')
    }
  }

  return (
    <div className="bg-black rounded-3xl p-6 w-full max-w-4xl mx-auto border border-black">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconChartBar size={24} className="text-white" />
          <h3 className="text-xl font-semibold text-white">Poll Manager</h3>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
        >
          <IconPlus size={20} />
          {showCreateForm ? 'Cancel' : 'Create Poll'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-black rounded-2xl p-6 mb-6 border border-gray-600">
          <h4 className="text-lg font-medium text-white mb-4">Create New Poll</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your poll question..."
                className="w-full p-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 p-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <IconX size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {options.length < 6 && (
                <button
                  onClick={addOption}
                  className="mt-2 flex items-center gap-2 text-white hover:text-white transition-colors"
                >
                  <IconPlus size={16} />
                  Add Option
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={createPoll}
                disabled={isCreating}
                className="flex-1 bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Poll'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border border-white text-white rounded-xl hover:border-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PollManager
