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
              type: 'header',
              key: 'user-agent',
              value: '.*MicroMessenger.*'
            }
          ],
          missing: [
            {
              type: 'query',
              key: 'wx_share'
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
