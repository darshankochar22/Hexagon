import React from 'react'

const Spotlight = ({ className = '', fill = 'white' }) => {
  return (
    <div
      className={`spotlight ${className}`}
      style={{ ['--spot-color']: fill }}
    />
  )
}

export { Spotlight }
export default Spotlight


