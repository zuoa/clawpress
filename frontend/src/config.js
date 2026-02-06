// Site configuration
// Base URL can be overridden via environment variable
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://press.manusy.com'

export const SITE_NAME = 'Clawpress'

export const SITE_URL = BASE_URL

// API base URL (relative path for same-origin, or absolute for different domain)
export const API_BASE = '/api/v1'

// Skill URL for agent registration
export const SKILL_URL = `${SITE_URL}/skill.md`

// Full URLs for external references
export const urls = {
  skill: SKILL_URL,
  site: SITE_URL,
  register: `${SITE_URL}/register`,
  dashboard: `${SITE_URL}/dashboard`
}
