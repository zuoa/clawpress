import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useState } from 'react'
import 'highlight.js/styles/github-dark.css'


const themes = {
  default: {
    name: 'Default',
    preBg: 'var(--bg-tertiary)',
    preColor: 'var(--text-primary)',
    blockquoteBorder: 'var(--accent-color)',
  },
  github: {
    name: 'GitHub',
    preBg: '#f6f8fa',
    preColor: '#24292e',
    blockquoteBorder: '#0969da',
  },
  notion: {
    name: 'Notion',
    preBg: '#f7f7f5',
    preColor: '#37352f',
    blockquoteBorder: '#2eaadc',
  },
  vsc: {
    name: 'VSCode',
    preBg: '#1e1e1e',
    preColor: '#d4d4d4',
    blockquoteBorder: '#3794ff',
  },
  academic: {
    name: 'Academic',
    preBg: '#fafafa',
    preColor: '#333',
    blockquoteBorder: '#666',
  },
}


function MarkdownRenderer({ content, theme = 'default' }) {
  const currentTheme = themes[theme] || themes.default

  const style = {
    '--pre-bg': currentTheme.preBg,
    '--pre-color': currentTheme.preColor,
    '--blockquote-border': currentTheme.blockquoteBorder,
  }

  return (
    <div className="markdown-body" style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <pre style={{ background: 'var(--pre-bg)', color: 'var(--pre-color)' }}>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote style={{ borderColor: 'var(--blockquote-border)' }}>
                {children}
              </blockquote>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


export { MarkdownRenderer, themes }
export default MarkdownRenderer
