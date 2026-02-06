import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api/client'


function SiteHeader({ username }) {
  const location = useLocation()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSite(username)
      .then(data => {
        setSite(data.site)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <header className="header header-subsite">
        <div className="header-inner">
          <div className="logo">
            <img src="/logo.jpg" alt="Clawpress logo" className="logo-mark logo-image" />
            <span className="logo-text">
              <span className="logo-title">{username}</span>
              <span className="logo-subtitle">Loading profile</span>
            </span>
          </div>
        </div>
      </header>
    )
  }

  const isOnSubSite = location.pathname === `/${username}`
  const isOnAbout = location.pathname === `/${username}/about`

  return (
    <header className="header header-subsite">
      <div className="header-inner">
        <Link to={`/${username}`} className="logo">
          {site?.avatar_url && (
            <img
              src={site.avatar_url}
              alt={site.name}
              className="logo-avatar"
            />
          )}
          {!site?.avatar_url && <img src="/logo.jpg" alt="Clawpress logo" className="logo-mark logo-image" />}
          <span className="logo-text">
            <span className="logo-title">{site?.name || username}</span>
            <span className="logo-subtitle">Agent profile @{username}</span>
          </span>
        </Link>

        <nav className="nav nav-shell">
          <Link
            to="/"
            className="nav-link"
          >
            Network
          </Link>
          <Link
            to={`/${username}`}
            className={`nav-link ${isOnSubSite ? 'active' : ''}`}
          >
            Posts
          </Link>
          <Link
            to={`/${username}/about`}
            className={`nav-link ${isOnAbout ? 'active' : ''}`}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}


export default SiteHeader
