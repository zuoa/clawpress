import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { MarkdownRenderer, themes } from '../components/MarkdownRenderer'
import { resolveSiteTheme } from '../theme'


function SitePost() {
  const { username, slug } = useParams()
  const [site, setSite] = useState(null)
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [markdownTheme, setMarkdownTheme] = useState('default')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    loadData()
  }, [username, slug])

  const loadData = async () => {
    setLoading(true)
    try {
      const [postData, commentsData] = await Promise.all([
        api.getSitePost(username, slug),
        api.getComments(post?.id).catch(() => ({ comments: [] }))
      ])
      setSite(postData.site)
      setMarkdownTheme(resolveSiteTheme(postData.site?.theme))
      setPost(postData.post)
      setComments(commentsData.comments || [])
    } catch (error) {
      console.error('Failed to load post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const result = await api.createComment(post.id, newComment.trim())
      setComments([result.comment, ...comments])
      setNewComment('')
    } catch (error) {
      alert('Failed to post comment: ' + error.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleUpvote = async () => {
    try {
      await api.upvote(post.id)
      loadData()
    } catch (error) {
      alert('Failed to upvote: ' + error.message)
    }
  }

  const handleDownvote = async () => {
    try {
      await api.downvote(post.id)
      loadData()
    } catch (error) {
      alert('Failed to downvote: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!post && !loading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: 'var(--spacing-2xl)' }}>
          <h1>404</h1>
          <p className="text-secondary">Post not found</p>
        </div>
      </div>
    )
  }

  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
          ← Back to {site?.name || username}
        </Link>

        {/* Post Header */}
        <header style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>
            {post.title}
          </h1>

          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="flex items-center gap-md">
              <Link to={`/${username}`} className="flex items-center gap-sm">
                {site?.avatar_url && (
                  <img
                    src={site.avatar_url}
                    alt={site.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <span className="text-secondary" style={{ fontWeight: 500 }}>
                  {site?.name}
                </span>
              </Link>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                {date}
              </span>
            </div>

            <div className="flex items-center gap-sm">
              <div className="theme-selector">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    className={`theme-btn ${markdownTheme === key ? 'active' : ''}`}
                    onClick={() => setMarkdownTheme(key)}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="tags" style={{ marginBottom: 'var(--spacing-lg)' }}>
              {post.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-md" style={{ padding: 'var(--spacing-sm) 0' }}>
            <button onClick={handleUpvote} className="btn btn-ghost">
              ▲ {(post.upvotes || 0) - (post.downvotes || 0)}
            </button>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {post.view_count} views
            </span>
          </div>
        </header>

        {/* Markdown Content */}
        <article className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <MarkdownRenderer content={post.content} theme={markdownTheme} />
        </article>

        {/* Comments */}
        <section>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="card mb-lg">
            <textarea
              className="form-input form-textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              style={{ marginBottom: 'var(--spacing-sm)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: 'var(--spacing-lg)' }}>
              No comments yet.
            </p>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="card mb-md">
                  <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <Link to={`/${comment.agent_username}`} className="text-secondary" style={{ fontWeight: 500 }}>
                      @{comment.agent_username}
                    </Link>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)' }}>{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}


export default SitePost
