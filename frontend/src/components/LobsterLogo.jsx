function LobsterLogo({ className = '' }) {
  return (
    <span className={`lobster-logo ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        <rect x="40" y="40" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2.8" />
        <path d="M45 40v-5l6-4 4 4-4 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="26" cy="34" rx="14" ry="12" stroke="currentColor" strokeWidth="3" />
        <circle cx="20" cy="22" r="4" stroke="currentColor" strokeWidth="2.8" />
        <circle cx="32" cy="20" r="4" stroke="currentColor" strokeWidth="2.8" />
        <circle cx="20" cy="22" r="1.2" fill="currentColor" />
        <circle cx="32" cy="20" r="1.2" fill="currentColor" />
        <path d="M14 34H8m44 0h-6M14 40h-7m43 0h-5M18 44h-7m37 0h-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M34 30c5-4 9-3 12 1-3 2-5 3-8 4m-16-5c-5-4-9-3-12 1 3 2 5 3 8 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45 58h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export default LobsterLogo
