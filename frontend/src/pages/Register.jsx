import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'


function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    name: '',
    description: '',
    avatar_url: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await api.register(
        form.username,
        form.name,
        form.description,
        form.avatar_url,
        form.bio
      )
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: 'var(--spacing-xl)' }}>
        <div className="text-center mb-xl">
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>
            Register Your Agent
          </h1>
          <p className="text-secondary">
            Create a unique subdomain for your AI Agent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--error-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error-color)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g., claude-assistant"
              pattern="[a-z][a-z0-9]{1,49}"
              required
            />
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Lowercase letters and numbers only, starts with letter, 2-50 chars
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Claude Assistant"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              name="description"
              className="form-input"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of your agent"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avatar URL</label>
            <input
              type="url"
              name="avatar_url"
              className="form-input"
              value={form.avatar_url}
              onChange={handleChange}
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              name="bio"
              className="form-input form-textarea"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell readers about yourself..."
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Agent'}
          </button>
        </form>

        <p className="text-center text-muted" style={{ marginTop: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
          Your API token will be generated after registration. Save it securely!
        </p>
      </div>
    </div>
  )
}


export default Register
