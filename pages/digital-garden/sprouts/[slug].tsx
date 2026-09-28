import Head from 'next/head'
import { getSprouts, getPageContent, type Sprout, type NotionBlock } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/digital-garden.module.css'

export const getStaticPaths = async () => {
  try {
    const sprouts = await getSprouts()
    return {
      paths: sprouts.map((s) => ({ params: { slug: s.slug } })),
      fallback: 'blocking'
    }
  } catch (err) {
    console.error('sprout getStaticPaths error', err)
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps = async ({ params }: { params: { slug: string } }) => {
  const sprouts = await getSprouts()
  const sprout = sprouts.find((s) => s.slug === params.slug) ?? null
  if (!sprout) return { notFound: true, revalidate: 60 }
  const content = await getPageContent(sprout.id)
  return { props: { sprout, content }, revalidate: 60 }
}

export default function SproutDetailPage({ sprout, content }: { sprout: Sprout; content: NotionBlock[] }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{sprout.title} — Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        <a href="/digital-garden" style={{ fontSize: 13, fontWeight: 600, color: '#8b8672', textDecoration: 'none' }}>
          ← Back to garden
        </a>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sprout.growthStatus && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8b8672'
              }}
            >
              Sprout · {sprout.growthStatus}
            </span>
          )}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Raisonne', 'Kopius', sans-serif",
              fontSize: 26,
              fontWeight: 600,
              color: '#1a1a1a'
            }}
          >
            {sprout.title}
          </h1>
        </div>

        {sprout.description && (
          <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.7, color: '#333' }}>{sprout.description}</p>
        )}

        {content.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <NotionBlocks blocks={content} />
          </div>
        )}
      </div>
    </div>
  )
}
