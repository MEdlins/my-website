import Head from 'next/head'
import { getSprouts, getPageContent, timeAgo, type Sprout, type NotionBlock } from '@/lib/notion-cms'
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

function dotColor(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('seed')) return '#f6cc3e'
  if (s.includes('sprout')) return '#0092b0'
  if (s.includes('shoot')) return '#0073da'
  return '#999'
}

export default function SproutDetailPage({ sprout, content }: { sprout: Sprout; content: NotionBlock[] }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{sprout.title} — Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px 100px' }}>
        <a
          href="/digital-garden"
          style={{
            fontSize: '11.5px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#999',
            textDecoration: 'none'
          }}
        >
          ← Back to the garden
        </a>

        {sprout.growthStatus && (
          <div style={{ margin: '24px 0 18px' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: dotColor(sprout.growthStatus) }}>
              ● {sprout.growthStatus} · {timeAgo(sprout.date)}
            </span>
          </div>
        )}

        <p
          style={{
            fontFamily: "'Kopius', sans-serif",
            fontSize: 20,
            lineHeight: 1.65,
            color: '#1a1a1a',
            margin: 0
          }}
        >
          {sprout.title}
        </p>

        {sprout.description && (
          <p
            style={{
              fontFamily: "'Kopius', sans-serif",
              fontSize: 15,
              lineHeight: 1.8,
              color: '#666',
              marginTop: 24
            }}
          >
            {sprout.description}
          </p>
        )}

        {content.length > 0 && (
          <div
            style={{
              marginTop: 24,
              fontFamily: "'Kopius', sans-serif",
              fontSize: 15,
              lineHeight: 1.8,
              color: '#2a2a2a'
            }}
          >
            <NotionBlocks blocks={content} />
          </div>
        )}
      </div>
    </div>
  )
}
