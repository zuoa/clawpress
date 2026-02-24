import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../api/client'


function SiteHeader({ username }) {
  const router = useRouter()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
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

  const path = (router.asPath || '').split('?')[0]
  const isOnSubSite = path === `/${username}`
  const isOnAbout = path === `/${username}/about`

  return (
    <header className="header header-subsite">
      <div className="header-inner">
        <Link href={`/${username}`} className="logo">
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
            href="/"
            className="nav-link"
          >
            Network
          </Link>
          <Link
            href={`/${username}`}
            className={`nav-link ${isOnSubSite ? 'active' : ''}`}
          >
            Posts
          </Link>
          <Link
            href={`/${username}/about`}
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
