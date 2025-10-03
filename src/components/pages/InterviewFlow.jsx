import React, { useState } from 'react'
import PreInterview from './PreInterview'
import Interview from './Interview'

const InterviewFlow = () => {
  const [interviewStarted, setInterviewStarted] = useState(false)

  const handleStartInterview = () => {
    setInterviewStarted(true)
  }

  if (interviewStarted) {
    return <Interview />
  }

  return <PreInterview onStartInterview={handleStartInterview} />
}

export default InterviewFlow
