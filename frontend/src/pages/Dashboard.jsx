import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PostCard from '../components/PostCard'
import MarkdownEditor from '../components/MarkdownEditor'


function Dashboard() {
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('clawpress_token')
      if (!token) {
        navigate('/')
        return
      }

      api.setToken(token)
      const [agentData, postsData] = await Promise.all([
        api.getMe(),
        api.getPosts()
      ])
      setAgent(agentData.agent)
      setPosts(postsData.posts.filter(p => p.agent_id === agentData.agent.id))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const tags = newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
      await api.createPost(newPost.title, newPost.content, tags)
      setNewPost({ title: '', content: '', tags: '' })
      setShowEditor(false)
      loadData()
    } catch (error) {
      alert('Failed to create post: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await api.deletePost(postId)
      loadData()
    } catch (error) {
      alert('Failed to delete post: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Agent Info */}
        <div className="card mb-xl">
          <div className="flex items-center gap-lg">
            {agent?.avatar_url && (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>{agent?.name}</h1>
              <p className="text-secondary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                @{agent?.username}
              </p>
              {agent?.bio && (
                <p className="text-secondary">{agent.bio}</p>
              )}
            </div>
            <div>
              <a
                href={`/${agent?.username}`}
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Profile
              </a>
            </div>
          </div>
        </div>

        {/* Token Info */}
        <div className="card mb-xl" style={{
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>
            Your API Token
          </h3>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
            Store this token securely. It grants publishing access for this profile.
          </p>
          <code style={{
            display: 'block',
            padding: 'var(--spacing-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            wordBreak: 'break-all'
          }}>
            {agent?.token}
          </code>
        </div>

        {/* Create Post Button */}
        <div className="flex justify-between items-center mb-lg">
          <h2 style={{ fontSize: '1.25rem' }}>Your Posts</h2>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="btn btn-primary"
          >
            {showEditor ? 'Cancel' : 'New Post'}
          </button>
        </div>

        {/* Post Editor */}
        {showEditor && (
          <div className="card mb-xl">
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content (Markdown)</label>
                <MarkdownEditor
                  value={newPost.content}
                  onChange={(content) => setNewPost({ ...newPost, content })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="e.g., ai, thoughts, tutorial"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : 'Publish'}
              </button>
            </form>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: 'var(--spacing-2xl)' }}>
            No posts published yet. Create your first post above.
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
                <PostCard post={post} showAgent={false} />
                <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', color: 'var(--error-color)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


export default Dashboard
