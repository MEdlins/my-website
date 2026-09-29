import { useMemo, useState } from 'react'
import Head from 'next/head'
import { getShoots, getSprouts, timeAgo, type Shoot, type Sprout } from '@/lib/notion-cms'
import { stageColors, stageSortRank } from '@/lib/garden-colors'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/digital-garden.module.css'

export const getStaticProps = async () => {
  const [shoots, sprouts] = await Promise.all([getShoots(), getSprouts()])
  return { props: { shoots, sprouts }, revalidate: 60 }
}

type ContentType = 'all' | 'shoots' | 'sprouts'

export default function DigitalGardenPage({ shoots, sprouts }: { shoots: Shoot[]; sprouts: Sprout[] }) {
  const [contentType, setContentType] = useState<ContentType>('all')
  const [stage, setStage] = useState<string | null>(null)

  const stages = useMemo(() => {
    const set = new Set<string>()
    shoots.forEach((s) => s.growthStage && set.add(s.growthStage))
    sprouts.forEach((s) => s.growthStatus && set.add(s.growthStatus))
    return [...set].sort((a, b) => stageSortRank(a) - stageSortRank(b) || a.localeCompare(b))
  }, [shoots, sprouts])

  const visibleShoots = shoots.filter((s) => !stage || s.growthStage === stage)
  const visibleSprouts = sprouts.filter((s) => !stage || s.growthStatus === stage)

  const showShoots = contentType !== 'sprouts'
  const showSprouts = contentType !== 'shoots'

  return (
    <div className={styles.page}>
      <Head>
        <title>Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <div className={styles.gardenHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mariglynn/icons/blue-stem.png" alt="" className={styles.gardenHeroBlob} />
        <p className={styles.gardenEyebrow}>Digital Garden</p>
        <h1 className={styles.gardenTitle}>Ideas at every stage of growing</h1>
        <p className={styles.gardenDesc}>
          Shoots are the fuller pieces I&rsquo;ve taken time with. Sprouts are quicker, rougher
          notes — thoughts I didn&rsquo;t want to lose. Nothing here is finished; that&rsquo;s kind
          of the point.
        </p>
      </div>

      <div className={styles.filterRow}>
        <button
          className={`${styles.typePill} ${contentType === 'all' ? styles.typePillActive : ''}`}
          onClick={() => setContentType('all')}
        >
          All
        </button>
        <button
          className={`${styles.typePill} ${contentType === 'shoots' ? styles.typePillActive : ''}`}
          onClick={() => setContentType('shoots')}
        >
          Shoots
        </button>
        <button
          className={`${styles.typePill} ${contentType === 'sprouts' ? styles.typePillActive : ''}`}
          onClick={() => setContentType('sprouts')}
        >
          Sprouts
        </button>
      </div>

      {stages.length > 0 && (
        <div className={styles.stageRow}>
          {stages.map((s) => {
            const c = stageColors(s)
            const active = stage === s
            return (
              <button
                key={s}
                className={styles.stagePill}
                onClick={() => setStage(active ? null : s)}
                style={{
                  color: c.color,
                  background: active ? c.bg : '#fff',
                  borderColor: active ? c.color : c.border
                }}
              >
                ● {s}
              </button>
            )
          })}
        </div>
      )}

      {showShoots && (
        <>
          <div className={styles.gardenDivider}>
            <span className={styles.gardenDividerLabel}>shoots</span>
            <div className={styles.gardenDividerLine} />
          </div>
          {visibleShoots.length === 0 ? (
            <p style={{ margin: '0 52px 56px', fontSize: 13, color: '#8b8672', fontStyle: 'italic' }}>
              Nothing here yet for this filter.
            </p>
          ) : (
            <div className={styles.shootGrid}>
              {visibleShoots.map((shoot) => {
                const c = stageColors(shoot.growthStage || '')
                return (
                  <a
                    key={shoot.id}
                    href={`/digital-garden/shoots/${shoot.slug}`}
                    className={styles.shootCard2}
                    style={{ borderTopColor: c.color }}
                  >
                    {shoot.growthStage && (
                      <span
                        className={styles.stageBadge}
                        style={{ color: c.color, background: c.bg, borderColor: c.border }}
                      >
                        {shoot.growthStage}
                      </span>
                    )}
                    <div className={styles.shootCard2Title}>{shoot.title}</div>
                    {shoot.description && <div className={styles.shootCard2Desc}>{shoot.description}</div>}
                    {shoot.tags.length > 0 && (
                      <div className={styles.shootCard2Tags}>{shoot.tags.join(' · ')}</div>
                    )}
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}

      {showSprouts && (
        <>
          <div className={styles.gardenDivider}>
            <span className={styles.gardenDividerLabel}>sprouts</span>
            <div className={styles.gardenDividerLine} />
          </div>
          {visibleSprouts.length === 0 ? (
            <p style={{ margin: '0 52px 90px', fontSize: 13, color: '#8b8672', fontStyle: 'italic' }}>
              Nothing here yet for this filter.
            </p>
          ) : (
            <div className={styles.sproutGrid2}>
              {visibleSprouts.map((sprout) => {
                const c = stageColors(sprout.growthStatus || '')
                return (
                  <a
                    key={sprout.id}
                    href={`/digital-garden/sprouts/${sprout.slug}`}
                    className={styles.sproutCard2}
                  >
                    {sprout.growthStatus && (
                      <span className={styles.sproutCard2Status} style={{ color: c.color }}>
                        ● {sprout.growthStatus}
                      </span>
                    )}
                    <div className={styles.sproutCard2Title}>{sprout.title}</div>
                    <div className={styles.sproutCard2Time}>{timeAgo(sprout.date)}</div>
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
