import Head from 'next/head'
import { getShoots, getPageContent, type Shoot, type NotionBlock } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/digital-garden.module.css'

export const getStaticPaths = async () => {
  try {
    const shoots = await getShoots()
    return {
      paths: shoots.map((s) => ({ params: { slug: s.slug } })),
      fallback: 'blocking'
    }
  } catch (err) {
    console.error('shoot getStaticPaths error', err)
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps = async ({ params }: { params: { slug: string } }) => {
  const shoots = await getShoots()
  const shoot = shoots.find((s) => s.slug === params.slug) ?? null
  if (!shoot) return { notFound: true, revalidate: 60 }
  const content = await getPageContent(shoot.id)
  return { props: { shoot, content }, revalidate: 60 }
}

export default function ShootDetailPage({ shoot, content }: { shoot: Shoot; content: NotionBlock[] }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{shoot.title} — Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        <a href="/digital-garden" style={{ fontSize: 13, fontWeight: 600, color: '#8b8672', textDecoration: 'none' }}>
          ← Back to garden
        </a>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shoot.category[0] && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8b8672'
              }}
            >
              {shoot.growthStage ? `${shoot.growthStage} · ` : ''}
              {shoot.category[0]}
            </span>
          )}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Raisonne', 'Kopius', sans-serif",
              fontSize: 28,
              fontWeight: 600,
              color: '#1a1a1a'
            }}
          >
            {shoot.title}
          </h1>
          {shoot.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {shoot.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/digital-garden?tag=${encodeURIComponent(tag)}`}
                  className={styles.tagPill}
                  style={{ textDecoration: 'none', color: '#0092b0', background: '#e3f4f7' }}
                >
                  {tag}
                </a>
              ))}
            </div>
          )}
        </div>

        {shoot.description && (
          <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.7, color: '#333' }}>{shoot.description}</p>
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
