import Head from 'next/head'
import {
  getShoots,
  getSprouts,
  getPageContent,
  formatDate,
  type Shoot,
  type Sprout,
  type NotionBlock
} from '@/lib/notion-cms'
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
  const [shoots, sprouts] = await Promise.all([getShoots(), getSprouts()])
  const shoot = shoots.find((s) => s.slug === params.slug) ?? null
  if (!shoot) return { notFound: true, revalidate: 60 }
  const content = await getPageContent(shoot.id)
  const relatedSprouts = sprouts.filter((s) => shoot.relatedSproutIds.includes(s.id))
  return { props: { shoot, content, relatedSprouts }, revalidate: 60 }
}

export default function ShootDetailPage({
  shoot,
  content,
  relatedSprouts
}: {
  shoot: Shoot
  content: NotionBlock[]
  relatedSprouts: Sprout[]
}) {
  const hasDates = Boolean(shoot.plantedDate || shoot.lastTendedDate)

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

        <h1
          style={{
            fontFamily: "'Raisonne', 'Kopius', sans-serif",
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.25,
            margin: '26px 0 12px',
            color: '#1a1a1a'
          }}
        >
          {shoot.title}
        </h1>

        {hasDates && (
          <div className={styles.detailDateRow}>
            {shoot.plantedDate && (
              <span>
                Planted <strong>{formatDate(shoot.plantedDate)}</strong>
              </span>
            )}
            {shoot.plantedDate && shoot.lastTendedDate && <span style={{ color: '#d8d4c6' }}>·</span>}
            {shoot.lastTendedDate && (
              <span>
                Last tended <strong>{formatDate(shoot.lastTendedDate)}</strong>
              </span>
            )}
          </div>
        )}

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

        {relatedSprouts.length > 0 && (
          <>
            <div className={styles.detailDivider}>
              <span className={styles.gardenDividerLabel}>sprouts from this shoot</span>
              <div className={styles.gardenDividerLine} />
            </div>
            <div className={styles.relatedSproutGrid}>
              {relatedSprouts.map((sprout) => (
                <a
                  key={sprout.id}
                  href={`/digital-garden/sprouts/${sprout.slug}`}
                  className={styles.sproutCard2}
                >
                  <span className={styles.sproutCard2Status} style={{ color: stageColors(sprout.growthStatus).color }}>
                    ● {sprout.growthStatus}
                  </span>
                  <div className={styles.sproutCard2Title}>{sprout.title}</div>
                </a>
              ))}
            </div>
          </>
        )}

        {shoot.tags.length > 0 && (
          <div className={styles.themesSection}>
            <div className={styles.themesLabel}>Themes</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {shoot.tags.map((tag) => (
                <span key={tag} className={styles.themeTag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
