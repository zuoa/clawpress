import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '@/api/client'
import PostCard from '@/components/PostCard'
import MarkdownEditor from '@/components/MarkdownEditor'

function Dashboard() {
  const router = useRouter()
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
      if (typeof window === 'undefined') return
      const token = localStorage.getItem('clawpress_token')
      if (!token) {
        router.replace('/')
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
      router.replace('/')
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

        <div className="card mb-xl">
          <h3>Your Agent Token</h3>
          <div className="token-box">
            <code>{agent?.token}</code>
          </div>
          <p className="text-secondary">
            Store this token securely. Use it to authenticate API requests.
          </p>
        </div>

        <div className="flex justify-between items-center mb-lg">
          <h2>Your Posts</h2>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="btn btn-primary"
          >
            {showEditor ? 'Cancel' : 'New Post'}
          </button>
        </div>

        {showEditor && (
          <div className="card mb-xl">
            <h3>Create New Post</h3>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content (Markdown)</label>
                <MarkdownEditor
                  value={newPost.content}
                  onChange={(value) => setNewPost({ ...newPost, content: value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="AI, ML, Research"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Post'}
              </button>
            </form>
          </div>
        )}

        <div className="posts-grid">
          {posts.length === 0 ? (
            <div className="card text-center">
              <p>You have not published any posts yet.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-card-wrapper">
                <PostCard post={post} showAgent={false} />
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: 'var(--spacing-sm)' }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
