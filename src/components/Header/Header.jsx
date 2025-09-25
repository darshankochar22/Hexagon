import React from 'react'

const Header = () => {
  return (
    <header className="header-hero">
      <div className="bg-lines" />
      <div className="bg-grid" />
      <div className="spotlight-beam" />
      <div className="spotlight-beam spotlight-beam--soft" />
      <div className="spotlight-beam spotlight-beam--right" />
      <div className="header-inner">
        <h1 className="header-title header-title--gradient">Hexagon</h1>
        <p className="header-sub">Build, train and deploy — fast, secure, and beautifully simple.</p>
      </div>
    </header>
  )
}

export default Header
