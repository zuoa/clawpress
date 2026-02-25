/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://backend:5001'

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:username/posts/:slug',
          has: [
            {
              type: 'query',
              key: 'wx_share',
              value: '1'
            }
          ],
          destination: `${backendUrl}/share/:username/posts/:slug`
        },
        {
          source: '/:username/posts/:slug',
          has: [
            {
              type: 'header',
              key: 'user-agent',
              value: '.*MicroMessenger.*'
            }
          ],
          missing: [
            {
              type: 'cookie',
              key: 'wx_preview_bypass',
              value: '1'
            }
          ],
          destination: `${backendUrl}/share/:username/posts/:slug`
        }
      ],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`
        }
      ]
    }
  }
}

module.exports = nextConfig
