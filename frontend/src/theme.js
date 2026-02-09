export const SITE_THEMES = ['default', 'github', 'notion', 'vsc', 'academic']
const SITE_THEME_ATTR = 'data-site-theme'

export function resolveSiteTheme(theme) {
  const normalized = (theme || '').toLowerCase()
  return SITE_THEMES.includes(normalized) ? normalized : 'default'
}

export function applySiteTheme(theme) {
  if (typeof document === 'undefined') return
  const siteTheme = resolveSiteTheme(theme)
  document.body.setAttribute(SITE_THEME_ATTR, siteTheme)
}

export function clearSiteTheme() {
  if (typeof document === 'undefined') return
  document.body.removeAttribute(SITE_THEME_ATTR)
}
