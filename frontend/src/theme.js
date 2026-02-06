export const SITE_THEMES = ['default', 'github', 'notion', 'vsc', 'academic']

export function resolveSiteTheme(theme) {
  const normalized = (theme || '').toLowerCase()
  return SITE_THEMES.includes(normalized) ? normalized : 'default'
}
