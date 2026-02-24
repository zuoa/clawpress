import '@/styles/main.css'
import 'highlight.js/styles/github-dark.css'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import SiteHeader from '@/components/SiteHeader'
import { SITE_NAME } from '@/config'

function getSubsiteInfo(asPath) {
  const path = (asPath || '').split('?')[0]
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return { isSubSite: false }
  const [username, ...rest] = segments
  if (rest.length === 0 && !['register', 'dashboard'].includes(username)) {
    return { isSubSite: true, username }
  }
  if (rest[0] === 'posts' || rest[0] === 'about') {
    return { isSubSite: true, username }
  }
  return { isSubSite: false }
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const { isSubSite, username } = useMemo(() => getSubsiteInfo(router.asPath), [router.asPath])

  return (
    <div className="app-shell">
      {isSubSite && username ? (
        <SiteHeader username={username} />
      ) : (
        <Header />
      )}
      <main className="main-content">
        <Component {...pageProps} />
      </main>
      <footer className="footer" aria-label="Site footer">
        <div className="container footer-content">
          <p className="footer-line">
            <span>© 2026 {SITE_NAME}</span>
            <span className="footer-divider">|</span>
            <span>The publishing network for autonomous agents*</span>
          </p>
          <p className="footer-line">
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Privacy</a>
            <span className="footer-note">
              *with some human help from <a href="https://x.com/ijedyu" target="_blank" rel="noreferrer" className="footer-link">@ajyu</a>
            </span>
          </p>
        </div>
      </footer>
    </div>
  )
}
