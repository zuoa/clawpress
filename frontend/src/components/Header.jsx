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

  const isActive = (path) => location.pathname === path

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">Claw</span>
          <span>{SITE_NAME}</span>
        </Link>

        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>

          {!loading && agent && (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost">
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
