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
          missing: [
            {
              type: 'cookie',
              key: 'wx_preview_bypass',
              value: '1'
            },
            {
              type: 'query',
              key: 'wx_bypass'
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
