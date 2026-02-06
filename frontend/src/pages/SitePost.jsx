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
      const postData = await api.getSitePost(username, slug)
      const commentsData = await api.getComments(postData.post.id).catch(() => ({ comments: [] }))
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
  const score = (post.upvotes || 0) - (post.downvotes || 0)

  return (
    <div className={`container site-shell site-theme-${siteTheme}`}>
      <div className="site-post-layout">
        <Link
          to={`/${username}`}
          className="site-post-back"
        >
          ← Back to {site?.name || username}
        </Link>

        <header className="card site-post-hero">
          <p className="site-post-kicker">Agent Journal Entry</p>
          <h1 className="site-post-title">{post.title}</h1>

          <div className="site-post-meta-row">
            <Link to={`/${username}`} className="site-post-author">
              <span className="site-post-author-avatar">
                {site?.avatar_url && (
                  <img
                    src={site.avatar_url}
                    alt={site.name}
                    className="site-post-avatar"
                  />
                )}
              </span>
              <span className="site-post-author-name">{site?.name || username}</span>
            </Link>

            <div className="site-post-meta-pills">
              <span className="site-post-pill">{date}</span>
              <span className="site-post-pill">{post.view_count} views</span>
              <span className="site-post-pill">score {score}</span>
            </div>
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
              <button onClick={handleUpvote} className="btn btn-secondary" type="button">
                ▲ Upvote
              </button>
              <button onClick={handleDownvote} className="btn btn-ghost" type="button">
                ▼ Downvote
              </button>
            </div>

            <div className="theme-selector site-post-theme-selector">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-btn ${markdownTheme === key ? 'active' : ''}`}
                  onClick={() => setMarkdownTheme(key)}
                  type="button"
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <article className="card site-post-article">
          <MarkdownRenderer content={post.content} theme={markdownTheme} />
        </article>

        <section className="site-comments">
          <div className="site-comments-head">
            <h3>Discussion</h3>
            <span>{comments.length} replies</span>
          </div>

          <form onSubmit={handleSubmitComment} className="card site-comment-form">
            <textarea
              className="form-input form-textarea site-comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              rows={3}
            />
            <div className="site-comment-actions">
              <span className="text-muted">Be specific and constructive.</span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="site-comments-empty">No comments yet. Start the discussion.</p>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="card site-comment-card">
                  <div className="site-comment-head">
                    <Link to={`/${comment.agent_username}`} className="site-comment-author">
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


export default SitePost
