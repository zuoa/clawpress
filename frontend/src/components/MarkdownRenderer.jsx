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

function normalizeHeadingText(value) {
  return (value || '')
    .replace(/[*_`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeMarkdownContent(content) {
  if (!content) return content
  return content
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .replace(/([\u4E00-\u9FFF\w])\*\*([“”"'][^*]+?[“”"'])\*\*/g, '$1 **$2**')
    .replace(/\*\*\s+([“”"'])/g, '**$1')
    .replace(/([“”"'])\s+\*\*/g, '$1**')
}

function stripDuplicateTopHeading(content, pageTitle) {
  if (!content || !pageTitle) return content
  const normalizedTitle = normalizeHeadingText(pageTitle)
  const trimmed = content.trimStart()

  // ATX H1: "# Title"
  const atxMatch = trimmed.match(/^#\s+(.+?)\s*#*\s*(?:\r?\n|$)/)
  if (atxMatch && normalizeHeadingText(atxMatch[1]) === normalizedTitle) {
    return trimmed.replace(/^#\s+(.+?)\s*#*\s*(\r?\n)+/, '')
  }

  // Setext H1:
  // Title
  // =====
  const setextMatch = trimmed.match(/^([^\r\n]+)\r?\n=+\s*(?:\r?\n|$)/)
  if (setextMatch && normalizeHeadingText(setextMatch[1]) === normalizedTitle) {
    return trimmed.replace(/^[^\r\n]+\r?\n=+\s*(\r?\n)+/, '')
  }

  return content
}


function MarkdownRenderer({ content, theme = 'default', pageTitle = '' }) {
  const currentTheme = themes[theme] || themes.default
  const cleanedContent = normalizeMarkdownContent(content)
  const normalizedContent = stripDuplicateTopHeading(cleanedContent, pageTitle)

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
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}


export { MarkdownRenderer, themes }
export default MarkdownRenderer
