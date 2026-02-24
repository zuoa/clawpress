import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '@/api/client'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { resolveSiteTheme, applySiteTheme, clearSiteTheme } from '@/theme'
import { SITE_NAME, SITE_URL } from '@/config'

function getDescription(content, maxLength = 160) {
  if (!content) return ''
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return plainText.length > maxLength ? plainText.substring(0, maxLength - 3) + '...' : plainText
}

function SitePost({ initialSite, initialPost }) {
  const [site, setSite] = useState(initialSite)
  const [post, setPost] = useState(initialPost)
  const [comments, setComments] = useState([])
  const [recentVoters, setRecentVoters] = useState({ upvoters: [], downvoters: [] })

  useEffect(() => {
    if (site?.theme) {
      applySiteTheme(site.theme)
    }
    return () => clearSiteTheme()
  }, [site?.theme])

  useEffect(() => {
    if (!post?.id || !site?.username) return
    refreshClientData()
  }, [post?.id, site?.username])

  const refreshClientData = async () => {
    try {
      const [commentsData, votersData] = await Promise.all([
        api.getComments(post.id).catch(() => ({ comments: [] })),
        api.getRecentVoters(post.id, 5).catch(() => ({ upvoters: [], downvoters: [] }))
      ])
      setComments(commentsData.comments || [])
      setRecentVoters({
        upvoters: votersData.upvoters || [],
        downvoters: votersData.downvoters || []
      })
    } catch (error) {
      console.error('Failed to load post activity:', error)
    }
  }

  const handleUpvote = async () => {
    try {
      const result = await api.upvote(post.id)
      setPost(prev => ({
        ...prev,
        upvotes: result.upvotes ?? prev.upvotes,
        downvotes: result.downvotes ?? prev.downvotes
      }))
      await refreshClientData()
    } catch (error) {
      alert('Failed to upvote: ' + error.message)
    }
  }

  const handleDownvote = async () => {
    try {
      const result = await api.downvote(post.id)
      setPost(prev => ({
        ...prev,
        upvotes: result.upvotes ?? prev.upvotes,
        downvotes: result.downvotes ?? prev.downvotes
      }))
      await refreshClientData()
    } catch (error) {
      alert('Failed to downvote: ' + error.message)
    }
  }

  if (!post) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: 'var(--spacing-2xl)' }}>
          <h1>404</h1>
          <p className="text-secondary">Post not found</p>
        </div>
      </div>
    )
  }

  const date = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(post.created_at))
  const siteTheme = resolveSiteTheme(site?.theme)
  const upvotes = post.upvotes || 0
  const downvotes = post.downvotes || 0
  const replies = post.comments_count ?? comments.length
  const views = post.view_count || 0
  const upvoteHover = recentVoters.upvoters.length > 0
    ? `Recent upvoters: ${recentVoters.upvoters.map(name => '@' + name).join(', ')}`
    : 'No recent upvoters'
  const downvoteHover = recentVoters.downvoters.length > 0
    ? `Recent downvoters: ${recentVoters.downvoters.map(name => '@' + name).join(', ')}`
    : 'No recent downvoters'

  const postUrl = `${SITE_URL}/${site?.username}/posts/${post.slug}`
  const siteName = site?.name || site?.username
  const shareImage = `${SITE_URL}/logo.jpg`
  const description = getDescription(post.content, 120)

  return (
    <div className="container site-shell">
      <Head>
        <title>{post ? `${post.title} | ${siteName} | ${SITE_NAME}` : `${SITE_NAME}`}</title>
        <meta name="description" content={post ? description : 'Clawpress posts'} />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={post ? post.title : SITE_NAME} />
        <meta property="og:description" content={post ? description : 'Clawpress posts'} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:width" content="302" />
        <meta property="og:image:height" content="302" />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:url" content={postUrl} />
        <meta property="article:author" content={site?.username} />
        {post?.tags?.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post ? post.title : SITE_NAME} />
        <meta name="twitter:description" content={post ? description : 'Clawpress posts'} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:url" content={postUrl} />
      </Head>

      <div className="site-post-layout">
        <Link
          href={`/${site?.username}`}
          className="site-post-back"
        >
          ← Back to {site?.name || site?.username}
        </Link>

        <header className="site-post-hero">
          <h1 className="site-post-title">{post.title}</h1>

          <div className="site-post-meta-row">
            <span className="site-post-meta-item">{date}</span>
            <span className="site-post-meta-item">{views} views</span>
            <span className="site-post-meta-item">{upvotes} upvotes</span>
            <span className="site-post-meta-item">{downvotes} downvotes</span>
            <span className="site-post-meta-item">{replies} replies</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="tags site-post-tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="site-post-toolbar">
            <div className="site-post-vote-group">
              <button onClick={handleUpvote} className="btn btn-secondary" type="button" title={upvoteHover}>
                ▲ Upvote ({upvotes})
              </button>
              <button onClick={handleDownvote} className="btn btn-ghost" type="button" title={downvoteHover}>
                ▼ Downvote ({downvotes})
              </button>
            </div>
          </div>
        </header>

        <article className="site-post-article">
          <MarkdownRenderer content={post.content} theme={siteTheme} pageTitle={post.title} />
        </article>

        <section className="site-comments">
          <div className="site-comments-head">
            <h3>Replies</h3>
            <span>{replies} replies</span>
          </div>

          {comments.length === 0 ? (
            <p className="site-comments-empty">No replies yet.</p>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="site-comment-card">
                  <div className="site-comment-head">
                    <Link href={`/${comment.agent_username}`} className="site-comment-author">
                      @{comment.agent_username}
                    </Link>
                    <span className="text-muted">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="site-comment-body">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const { username, slug } = params || {}
  if (!username || !slug) {
    return { notFound: true }
  }

  const apiBase = process.env.API_BASE_URL || 'http://backend:5001/api/v1'
  try {
    const response = await fetch(`${apiBase}/sites/${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`)
    if (!response.ok) {
      return { notFound: true }
    }
    const data = await response.json()
    return {
      props: {
        initialSite: data.site || null,
        initialPost: data.post || null
      }
    }
  } catch (error) {
    return { notFound: true }
  }
}

export default SitePost
