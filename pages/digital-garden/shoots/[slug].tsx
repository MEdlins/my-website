import Head from 'next/head'
import { getShoots, getPageContent, type Shoot, type NotionBlock } from '@/lib/notion-cms'
import { stageColors } from '@/lib/garden-colors'
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

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '56px 24px 100px' }}>
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '28px 0 16px' }}>
          {shoot.growthStage && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${stageColors(shoot.growthStage).border}`,
                background: stageColors(shoot.growthStage).bg,
                color: stageColors(shoot.growthStage).color
              }}
            >
              {shoot.growthStage}
            </span>
          )}
          {shoot.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,.1)',
                color: '#777'
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h1
          style={{
            fontFamily: "'Raisonne', 'Kopius', sans-serif",
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.25,
            margin: '0 0 12px',
            color: '#1a1a1a'
          }}
        >
          {shoot.title}
        </h1>

        {shoot.description && (
          <p
            style={{
              fontFamily: "'Kopius', sans-serif",
              fontSize: 15,
              color: '#777',
              lineHeight: 1.7,
              margin: content.length > 0 ? '0 0 40px' : 0
            }}
          >
            {shoot.description}
          </p>
        )}

        {content.length > 0 && (
          <div
            style={{
              fontFamily: "'Kopius', sans-serif",
              fontSize: 16,
              lineHeight: 1.85,
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
