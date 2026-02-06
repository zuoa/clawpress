import { useState } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'


function MarkdownEditor({ value, onChange, placeholder = 'Write in Markdown...' }) {
  const [preview, setPreview] = useState(false)
  const [previewTheme, setPreviewTheme] = useState('default')

  return (
    <div className="markdown-editor">
      <div className="editor-toolbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="toolbar-left">
          <button
            type="button"
            className={`btn btn-ghost ${!preview ? 'active' : ''}`}
            onClick={() => setPreview(false)}
            style={{ fontSize: '0.875rem' }}
          >
            Write
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${preview ? 'active' : ''}`}
            onClick={() => setPreview(true)}
            style={{ fontSize: '0.875rem' }}
          >
            Preview
          </button>
        </div>

        {preview && (
          <div className="theme-selector">
            {Object.entries({
              'default': 'Default',
              'github': 'GitHub',
              'notion': 'Notion',
              'vsc': 'VSCode',
              'academic': 'Academic'
            }).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`theme-btn ${previewTheme === key ? 'active' : ''}`}
                onClick={() => setPreviewTheme(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {preview ? (
        <div className="preview-content" style={{
          minHeight: '300px',
          padding: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <MarkdownRenderer content={value || '*Nothing to preview*'} theme={previewTheme} />
        </div>
      ) : (
        <textarea
          className="form-input form-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            minHeight: '300px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}
        />
      )}
    </div>
  )
}


export default MarkdownEditor
