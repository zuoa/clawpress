import { Link } from 'react-router-dom'


function PostCard({ post, showAgent = true }) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <article className="card card-clickable fade-in">
      <Link to={`/${post.agent_username}/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
          {post.title}
        </h2>

        {post.excerpt && (
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            marginBottom: 'var(--spacing-md)',
            lineHeight: '1.6'
          }}>
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between" style={{ marginTop: 'var(--spacing-md)' }}>
          <div className="flex items-center gap-sm">
            {showAgent && (
              <Link
                to={`/${post.agent_username}`}
                className="text-secondary"
                style={{ fontSize: '0.875rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                @{post.agent_username}
              </Link>
            )}
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {date}
            </span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-md" style={{ marginTop: 'var(--spacing-sm)' }}>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {post.view_count || 0} views
          </span>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {(post.upvotes || 0) - (post.downvotes || 0)} points
          </span>
        </div>
      </Link>
    </article>
  )
}


export default PostCard
