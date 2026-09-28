import { useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getShoots, getSprouts, type Shoot, type Sprout } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/digital-garden.module.css'

export const getStaticProps = async () => {
  const [shoots, sprouts] = await Promise.all([getShoots(), getSprouts()])
  return { props: { shoots, sprouts }, revalidate: 60 }
}

type CategoryGroup = { name: string; shoots: Shoot[] }

export default function DigitalGardenPage({ shoots, sprouts }: { shoots: Shoot[]; sprouts: Sprout[] }) {
  const router = useRouter()
  const activeTag = typeof router.query.tag === 'string' ? router.query.tag : null

  const categories: CategoryGroup[] = useMemo(() => {
    const map = new Map<string, Shoot[]>()
    for (const s of shoots) {
      const name = s.category[0] || 'Uncategorized'
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(s)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, list]) => ({ name, shoots: list }))
  }, [shoots])

  const themes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of shoots) {
      for (const tag of s.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [shoots])

  const visibleCategories = activeTag
    ? categories
        .map((c) => ({ ...c, shoots: c.shoots.filter((s) => s.tags.includes(activeTag)) }))
        .filter((c) => c.shoots.length > 0)
    : categories

  const visibleSprouts = sprouts

  return (
    <div className={styles.page}>
      <Head>
        <title>Digital Garden — mariglynn.com</title>
      </Head>

      <SiteNav />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/icons/garden-icon-leaf.png" alt="" className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Digital garden</h1>
            <p className={styles.subtitle}>
              Ideas I&rsquo;m tending slowly and in public. Nothing here is finished — that&rsquo;s the point.
            </p>
          </div>
        </div>

        <div className={styles.pipeline}>
          <span className={styles.pipelinePill}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mariglynn/icons/growth-seed.png" alt="" className={styles.pipelineIcon} />
            <span className={styles.pipelineLabel}>Seeds</span>
          </span>
          <span className={styles.pipelineArrow}>→</span>
          <span className={styles.pipelinePill}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mariglynn/icons/growth-sprout.png" alt="" className={styles.pipelineIcon} />
            <span className={styles.pipelineLabel}>Sprouts</span>
          </span>
          <span className={styles.pipelineArrow}>→</span>
          <span className={styles.pipelinePill}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mariglynn/icons/growth-shoots.png" alt="" className={styles.pipelineIcon} />
            <span className={styles.pipelineLabel}>Shoots</span>
          </span>
          <span className={styles.pipelineArrow}>→</span>
          <span className={`${styles.pipelinePill} ${styles.pipelinePillActive}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mariglynn/icons/growth-bloom.png" alt="" className={styles.pipelineIcon} />
            <span className={styles.pipelineLabel}>Writing</span>
          </span>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mariglynn/icons/growth-shoots.png" alt="" />
            Shoots
          </span>
          {categories.length === 0 && <p className={styles.empty}>No shoots published yet.</p>}
          {categories.map((cat) => (
            <div key={cat.name} className={styles.categoryGroup}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.shoots.length}</span>
              </div>
              <div className={styles.shootList}>
                {cat.shoots.map((s) => (
                  <a key={s.id} href={`/digital-garden/shoots/${s.slug}`} className={styles.shootLink}>
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className={styles.main}>
          {activeTag && (
            <div className={styles.filterBanner}>
              <span>
                Filtered by theme: <strong>{activeTag}</strong>
              </span>
              <a href="/digital-garden">Clear filter ×</a>
            </div>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Sprouts</span>
            </div>
            <p className={styles.sectionNote}>
              Early notes — raw, unfinished, standalone nuggets. Worth poking around.
            </p>
            {visibleSprouts.length === 0 ? (
              <p className={styles.empty}>No sprouts published yet.</p>
            ) : (
              <div className={styles.grid2}>
                {visibleSprouts.map((sprout) => (
                  <a
                    key={sprout.id}
                    href={`/digital-garden/sprouts/${sprout.slug}`}
                    className={styles.card}
                  >
                    <div className={styles.cardTitleRow}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mariglynn/icons/growth-sprout.png" alt="" className={styles.cardIcon} />
                      <span className={styles.cardTitle}>{sprout.title}</span>
                    </div>
                    {sprout.growthStatus && (
                      <div className={styles.cardTags}>
                        <span className={styles.tagPill}>{sprout.growthStatus}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Explore by theme</span>
            </div>
            <p className={styles.sectionNote}>
              Each theme gathers shoots tagged with it — a cross-cutting lens through the garden.
            </p>
            {themes.length === 0 ? (
              <p className={styles.empty}>No tags yet.</p>
            ) : (
              <div className={styles.grid4}>
                {themes.map(([name, count]) => (
                  <a key={name} href={`/digital-garden?tag=${encodeURIComponent(name)}`} className={styles.card}>
                    <div className={styles.cardTitleRow}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mariglynn/icons/red-plus.png" alt="" className={styles.cardIcon} />
                      <span className={styles.cardTitle}>{name}</span>
                    </div>
                    <span className={styles.themeCount}>{count} {count === 1 ? 'shoot' : 'shoots'}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          {activeTag && visibleCategories.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Shoots tagged &ldquo;{activeTag}&rdquo;</span>
              </div>
              <div className={styles.grid2}>
                {visibleCategories.flatMap((c) => c.shoots).map((s) => (
                  <a key={s.id} href={`/digital-garden/shoots/${s.slug}`} className={styles.card}>
                    <div className={styles.cardTitleRow}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mariglynn/icons/growth-shoots.png" alt="" className={styles.cardIcon} />
                      <span className={styles.cardTitle}>{s.title}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
