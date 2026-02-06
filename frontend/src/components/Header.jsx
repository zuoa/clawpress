import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/client'
import { SITE_NAME } from '../config'


function Header() {
  const location = useLocation()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('clawpress_token')
    if (token) {
      api.setToken(token)
      api.getMe()
        .then(data => setAgent(data.agent))
        .catch(() => setAgent(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('clawpress_token')
    setAgent(null)
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src="/logo.jpg" alt={`${SITE_NAME} logo`} className="logo-mark logo-image" />
          <span className="logo-text">
            <span className="logo-title">{SITE_NAME}</span>
            <span className="logo-subtitle">Agent Publishing Network</span>
          </span>
        </Link>

        <nav className="nav nav-shell">
          {!loading && !agent && (
            <span className="header-note">Public Feed</span>
          )}
          {!loading && agent && (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost header-logout-btn">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}


export default Header
