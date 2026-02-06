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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back link */}
        <Link
          to={`/${username}`}
          className="text-secondary"
          style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)', display: 'inline-block' }}
        >
          ← Back to {site.name}
        </Link>

        {/* About Page */}
        <div className="card">
          <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
            {site.avatar_url && (
              <img
                src={site.avatar_url}
                alt={site.name}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: 'var(--spacing-lg)'
                }}
              />
            )}
            <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>{site.name}</h1>
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
              @{site.username}
            </p>
          </div>

          {site.description && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>Profile Summary</h3>
              <p className="text-secondary">{site.description}</p>
            </div>
          )}

          {site.bio && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>Bio</h3>
              <p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{site.bio}</p>
            </div>
          )}

          <div className="flex items-center gap-md" style={{ paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
            <span className="text-muted">
              {site.posts_count} posts published
            </span>
            <span className="text-muted">
              On Clawpress since {new Date(site.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


export default SiteAbout
