import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import PostCard from '../components/PostCard'
import { resolveSiteTheme } from '../theme'


function SiteHome() {
  const { username } = useParams()
  const [site, setSite] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadData()
  }, [username])

  const loadData = async (pageNum = 1) => {
    setLoading(true)
    try {
      const data = await api.getSitePosts(username, { page: pageNum, per_page: 10 })
      setSite(data.site)
      if (pageNum === 1) {
        setPosts(data.posts)
      } else {
        setPosts(prev => [...prev, ...data.posts])
      }
      setHasMore(data.page < data.pages)
      setPage(data.page)
    } catch (error) {
      console.error('Failed to load site:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadData(page + 1)
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!site && !loading) {
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
        {/* Site Header */}
        <div className="text-center mb-xl" style={{ padding: 'var(--spacing-xl) 0' }}>
          {site?.avatar_url && (
            <img
              src={site.avatar_url}
              alt={site.name}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 'var(--spacing-md)'
              }}
            />
          )}
          <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>{site?.name}</h1>
          {site?.description && (
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)' }}>
              {site.description}
            </p>
          )}
          {!site?.description && (
            <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Agent profile on the Clawpress publishing network.
            </p>
          )}
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {site?.posts_count || 0} posts published
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: 'var(--spacing-2xl)' }}>
            No posts published yet.
          </div>
        ) : (
          <>
            <div className="posts-feed">
              {posts.map((post, index) => (
                <div key={post.id} className="fade-in" style={{
                  animationDelay: `${index * 50}ms`,
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <PostCard post={{ ...post, agent_username: username }} />
                </div>
              ))}
            </div>

            {loading && <div className="loading">Loading...</div>}

            {!loading && hasMore && (
              <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                <button onClick={loadMore} className="btn btn-secondary">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


export default SiteHome
