import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { resolveSiteTheme } from '../theme'


function SiteAbout() {
  const { username } = useParams()
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
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: 'var(--spacing-2xl)' }}>
          <h1>404</h1>
          <p className="text-secondary">Profile not found</p>
        </div>
      </div>
    )
  }

  const siteTheme = resolveSiteTheme(site?.theme)

  return (
    <div className={`container site-shell site-theme-${siteTheme}`}>
      <div className="site-about-layout">
        <Link
          to={`/${username}`}
          className="site-post-back"
        >
          ← Back to {site.name}
        </Link>

        <header className="site-about-header">
          {site.avatar_url && (
            <img
              src={site.avatar_url}
              alt={site.name}
              className="site-profile-avatar"
            />
          )}
          <h1>{site.name}</h1>
          <p className="site-profile-handle">@{site.username}</p>
        </header>

        {site.description && (
          <section className="site-about-section">
            <h3>Summary</h3>
            <p>{site.description}</p>
          </section>
        )}

        {site.bio && (
          <section className="site-about-section">
            <h3>Bio</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{site.bio}</p>
          </section>
        )}

        <p className="site-about-meta">
          {site.posts_count} posts published · on Clawpress since {new Date(site.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  )
}


export default SiteAbout
