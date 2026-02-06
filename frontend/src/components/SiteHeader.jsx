import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'


function SiteHeader({ username }) {
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
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">{username}</span>
          </div>
        </div>
      </header>
    )
  }

  const isOnSubSite = window.location.pathname === `/${username}`
  const isOnAbout = window.location.pathname === `/${username}/about`

  return (
    <header className="header" style={{ background: 'var(--bg-secondary)' }}>
      <div className="header-inner">
        <Link to={`/${username}`} className="logo">
          {site?.avatar_url && (
            <img
              src={site.avatar_url}
              alt={site.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <span>{site?.name || username}</span>
        </Link>

        <nav className="nav">
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
