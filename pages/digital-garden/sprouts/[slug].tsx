import Head from 'next/head'
import { getSprouts, getShoots, formatDate, type Sprout } from '@/lib/notion-cms'
import { stageColors } from '@/lib/garden-colors'
import { SiteNav } from '@/components/SiteNav'
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

type RelatedLink = { id: string; title: string; href: string; kind: 'shoot' | 'sprout' }

export const getStaticProps = async ({ params }: { params: { slug: string } }) => {
  const [sprouts, shoots] = await Promise.all([getSprouts(), getShoots()])
  const sprout = sprouts.find((s) => s.slug === params.slug) ?? null
  if (!sprout) return { notFound: true, revalidate: 60 }

  const relatedLinks: RelatedLink[] = sprout.relatedLinkIds
    .map((id): RelatedLink | null => {
      const shoot = shoots.find((s) => s.id === id)
      if (shoot) return { id, title: shoot.title, href: `/digital-garden/shoots/${shoot.slug}`, kind: 'shoot' }
      const relatedSprout = sprouts.find((s) => s.id === id && s.id !== sprout.id)
      if (relatedSprout) {
        return { id, title: relatedSprout.title, href: `/digital-garden/sprouts/${relatedSprout.slug}`, kind: 'sprout' }
      }
      return null
    })
    .filter((link): link is RelatedLink => link !== null)

  return { props: { sprout, relatedLinks }, revalidate: 60 }
}

export default function SproutDetailPage({ sprout, relatedLinks }: { sprout: Sprout; relatedLinks: RelatedLink[] }) {
  const hasDates = Boolean(sprout.plantedDate || sprout.lastTendedDate)

  return (
    <div className={styles.page}>
      <Head>
        <title>{sprout.title} — Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px 100px' }}>
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
          <div style={{ margin: '24px 0 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: stageColors(sprout.growthStatus).color }}>
              ● {sprout.growthStatus}
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

        {hasDates && (
          <div className={styles.detailDateRow} style={{ marginTop: 16 }}>
            {sprout.plantedDate && (
              <span>
                Planted <strong>{formatDate(sprout.plantedDate)}</strong>
              </span>
            )}
            {sprout.plantedDate && sprout.lastTendedDate && <span style={{ color: '#d8d4c6' }}>·</span>}
            {sprout.lastTendedDate && (
              <span>
                Last tended <strong>{formatDate(sprout.lastTendedDate)}</strong>
              </span>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            fontFamily: "'Kopius', sans-serif",
            fontSize: 15,
            lineHeight: 1.8,
            color: '#2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {sprout.mySprout && <p style={{ margin: 0 }}>{sprout.mySprout}</p>}

          {sprout.seedQuote && (
            <div>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#aaa',
                  marginBottom: 6
                }}
              >
                → Seed Quote
              </div>
              <blockquote
                style={{
                  margin: 0,
                  padding: '4px 0 4px 18px',
                  borderLeft: '3px solid #ff3246',
                  fontStyle: 'italic',
                  color: '#2a2a2a'
                }}
              >
                {sprout.seedQuote}
              </blockquote>
            </div>
          )}

          {sprout.seedSourceInfo && (
            <p style={{ margin: 0, fontSize: 13, color: '#999' }}>{sprout.seedSourceInfo}</p>
          )}
        </div>

        {relatedLinks.length > 0 && (
          <>
            <div className={styles.detailDivider}>
              <span className={styles.gardenDividerLabel}>related to this sprout</span>
              <div className={styles.gardenDividerLine} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className={styles.sproutCard2}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '14px 18px' }}
                >
                  <span style={{ fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {link.kind === 'shoot' ? 'Shoot' : 'Sprout'}
                  </span>
                  <span className={styles.sproutCard2Title}>{link.title}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {sprout.tags.length > 0 && (
          <div className={styles.themesSection}>
            <div className={styles.themesLabel}>Themes</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sprout.tags.map((tag) => (
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
