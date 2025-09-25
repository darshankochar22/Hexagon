import React, { useState, useEffect } from 'react'
import { IconChartBar, IconCheck, IconX } from '@tabler/icons-react'

const Poll = ({ poll, onVote }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)

  const handleVote = async (optionId) => {
    if (hasVoted || !poll.is_active) return

    try {
      const response = await fetch('http://localhost:8000/polls/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poll_id: poll.id,
          option_id: optionId
        })
      })

      if (response.ok) {
        setSelectedOption(optionId)
        setHasVoted(true)
        onVote && onVote(poll.id, optionId)
      } else {
        alert('Failed to vote. Please try again.')
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote. Please try again.')
    }
  }

  const getTotalVotes = () => {
    return poll.options.reduce((total, option) => total + option.votes, 0)
  }

  const getPercentage = (votes) => {
    const total = getTotalVotes()
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  return (
    <div className="bg-black rounded-3xl p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-4">
        <IconChartBar size={24} className="text-white" />
        <h3 className="text-xl font-semibold text-white">Live Poll</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          poll.is_active ? 'bg-green-600 text-white' : 'bg-black text-white border border-gray-600'
        }`}>
          {poll.is_active ? 'Active' : 'Closed'}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-medium text-white mb-4 text-center">{poll.question}</h4>
        
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const percentage = getPercentage(option.votes)
            const isSelected = selectedOption === option.id
            const totalVotes = getTotalVotes()
            
            return (
              <div key={option.id} className="relative">
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={hasVoted || !poll.is_active}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                    hasVoted || !poll.is_active
                      ? 'border-black bg-black cursor-not-allowed'
                      : isSelected
                      ? 'border-white bg-black'
                      : 'border-black bg-black hover:border-white hover:bg-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-white bg-white' : 'border-black'
                      }`}>
                        {isSelected && <IconCheck size={16} className="text-black" />}
                      </div>
                      <span className={`font-medium ${
                        hasVoted || !poll.is_active ? 'text-white' : 'text-white'
                      }`}>
                        {option.text}
                      </span>
                    </div>
                    
                    {hasVoted && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">
                          {option.votes} vote{option.votes !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {hasVoted && (
                    <div className="mt-3">
                      <div className="w-full bg-black border border-black rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
        
        {hasVoted && (
          <div className="mt-4 text-center">
            <p className="text-sm text-white">
              Total votes: {totalVotes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Poll
