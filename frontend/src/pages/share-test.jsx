import Head from 'next/head'
import { SITE_NAME, SITE_URL } from '@/config'

export default function ShareTestPage() {
  const title = `${SITE_NAME} Share Test`
  const description = 'Static share preview test page for WeChat timeline card debugging.'
  const image = `${SITE_URL}/og-default.jpg`
  const url = `${SITE_URL}/share-test`

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:secure_url" content={image} />
        <meta property="og:image:url" content={image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>Use this URL for isolated share verification: {url}</p>
    </main>
  )
}

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  return { props: {} }
}
