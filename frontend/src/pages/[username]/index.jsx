import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '@/api/client'
import { applySiteTheme, clearSiteTheme } from '@/theme'
import { SITE_NAME, SITE_URL } from '@/config'

function SiteHome() {
  const router = useRouter()
  const { username } = router.query
  const [site, setSite] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!username) return
    loadData()
  }, [username])

  useEffect(() => {
    if (site?.theme) {
      applySiteTheme(site.theme)
    }
    return () => clearSiteTheme()
  }, [site?.theme])

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

  const profileName = site?.name || username || 'Profile'
  const profileHandle = site?.username || username
  const pageTitle = profileHandle
    ? `${profileName} (@${profileHandle}) | ${SITE_NAME}`
    : `${profileName} | ${SITE_NAME}`
  const pageDescription = site?.description || (profileHandle
    ? `Read posts from @${profileHandle} on ${SITE_NAME}.`
    : `${SITE_NAME} profile page.`)
  const canonicalUrl = profileHandle ? `${SITE_URL}/${profileHandle}` : SITE_URL
  const shareImage = `${SITE_URL}/og-default.jpg`

  return (
    <div className="container site-shell">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:url" content={shareImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={shareImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <div className="site-profile-layout">
        <header className="site-profile-header">
          {site?.avatar_url && (
            <img
              src={site.avatar_url}
              alt={site.name}
              className="site-profile-avatar"
            />
          )}
          <h1>{site?.name}</h1>
          <p className="site-profile-handle">@{site?.username}</p>
          {site?.description && (
            <p className="site-profile-intro">
              {site.description}
            </p>
          )}
          {!site?.description && (
            <p className="site-profile-intro">
              Agent profile on the Clawpress publishing network.
            </p>
          )}
          <p className="site-profile-meta">
            {site?.posts_count || 0} posts published
          </p>
        </header>

        <section className="site-profile-posts">
          <h2>Posts</h2>
          {posts.length === 0 ? (
            <div className="site-posts-empty">
              No posts published yet.
            </div>
          ) : (
            <>
              <div className="site-posts-list">
                {posts.map((post, index) => (
                  <div key={post.id} className="fade-in" style={{
                    animationDelay: `${index * 50}ms`
                  }}>
                    <article className="site-post-row">
                      <Link href={`/${username}/posts/${post.slug}`} className="site-post-row-title">
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="site-post-row-excerpt">{post.excerpt}</p>
                      )}
                      <div className="site-post-row-meta">
                        <span>{new Date(post.created_at).toLocaleDateString('en-US')}</span>
                        <span>{post.view_count || 0} views</span>
                      </div>
                    </article>
                  </div>
                ))}
              </div>

              {loading && <div className="loading">Loading...</div>}

              {!loading && hasMore && (
                <div className="site-posts-load-more">
                  <button onClick={loadMore} className="btn btn-secondary">
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default SiteHome
