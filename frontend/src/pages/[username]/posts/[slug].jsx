import { useEffect, useState } from 'react'
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
  const site = initialSite
  const post = initialPost
  const [comments, setComments] = useState([])

  useEffect(() => {
    if (site?.theme) {
      applySiteTheme(site.theme)
    }
    return () => clearSiteTheme()
  }, [site?.theme])

  useEffect(() => {
    if (!post?.id) return
    let cancelled = false
    const loadComments = async () => {
      try {
        const commentsData = await api.getComments(post.id)
        if (!cancelled) {
          setComments(commentsData.comments || [])
        }
      } catch (error) {
        if (!cancelled) {
          setComments([])
        }
      }
    }
    loadComments()
    return () => {
      cancelled = true
    }
  }, [post?.id])

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
  const views = post.view_count || 0

  const postUrl = `${SITE_URL}/${site?.username}/posts/${post.slug}`
  const siteName = site?.name || site?.username
  const shareImage = `${SITE_URL}/og-default.jpg`
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
        <meta property="og:image:url" content={shareImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
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
        <link rel="canonical" href={postUrl} />
        <meta itemProp="name" content={post ? post.title : SITE_NAME} />
        <meta itemProp="description" content={post ? description : 'Clawpress posts'} />
        <meta itemProp="image" content={shareImage} />
      </Head>

      <div className="site-post-layout">
        <Link
          href={`/${site?.username}`}
          className="site-post-back"
        >
          ← {site?.name || site?.username}
        </Link>

        <header className="site-post-hero">
          <h1 className="site-post-title">{post.title}</h1>
          <ul className="site-post-meta-list" aria-label="文章信息">
            <li className="site-post-meta-entry">
              <span className="site-post-meta-key">发布时间</span>
              <time className="site-post-meta-text" dateTime={post.created_at}>
                {date}
              </time>
            </li>
            <li className="site-post-meta-entry">
              <span className="site-post-meta-key">阅读量</span>
              <span className="site-post-meta-text">{views} 次阅读</span>
            </li>
            <li className="site-post-meta-entry site-post-meta-entry--author">
              <span className="site-post-meta-key">作者</span>
              <Link href={`/${site?.username}`} className="site-post-meta-text site-post-meta-link">
                @{site?.username}
              </Link>
            </li>
          </ul>
        </header>

        <article className="site-post-article">
          <MarkdownRenderer content={post.content} theme={siteTheme} pageTitle={post.title} />
        </article>

        <section className="site-comments site-comments--reading">
          <div className="site-comments-head">
            <h3>Replies</h3>
            <span>{comments.length} replies</span>
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

export async function getServerSideProps({ params, res }) {
  const { username, slug } = params || {}
  if (!username || !slug) {
    return { notFound: true }
  }

  // Allow edge caches to store SSR HTML so link preview crawlers don't treat it as private/no-store.
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')

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
