import Head from 'next/head'
import { getHomepageFeed, type FeedItem } from '@/lib/notion-cms'
import { HeroQuestions } from '@/components/HeroQuestions'
import styles from '@/styles/home.module.css'

export const getStaticProps = async () => {
  const feed = await getHomepageFeed(18)
  return { props: { feed }, revalidate: 60 }
}

const SOURCE_STYLE: Record<FeedItem['source'], { card: string; tag: string }> = {
  'Digital Garden': { card: styles.cardGarden!, tag: styles.tagGarden! },
  Bookshelf: { card: styles.cardBookshelf!, tag: styles.tagBookshelf! }
}

// Roughly mirrors the design's hand-placed wide/tall rhythm: longer
// excerpts get more room instead of being clamped down to nothing.
function layoutClassFor(item: FeedItem, index: number): string {
  const len = item.excerpt.length
  if (len > 220) return styles.cardTall ?? ''
  if (len > 130 || index % 7 === 0) return styles.cardWide ?? ''
  return ''
}

export default function HomePage({ feed }: { feed: FeedItem[] }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>mariglynn.com</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <nav className={styles.nav}>
        <a href="/" className={styles.wordmark}>
          mariglynn
        </a>
        <ul className={styles.navLinks}>
          <li>
            <a href="/digital-garden">Garden</a>
          </li>
          <li>
            <a href="/bookshelf">Bookshelf</a>
          </li>
          <li>
            <a href="/research">Research</a>
          </li>
          <li>
            <a href="/portfolio">Portfolio</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>
      </nav>

      <HeroQuestions />

      <div className={styles.feedSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>recently in my world</span>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.cardGrid}>
          {feed.map((item, i) => {
            const sourceStyle = SOURCE_STYLE[item.source]
            return (
              <a
                key={item.id}
                href={item.href}
                className={`${styles.card} ${sourceStyle.card} ${layoutClassFor(item, i)}`}
              >
                <span className={`${styles.cardSource} ${sourceStyle.tag}`}>
                  <span className={styles.srcDot} />
                  {item.source}
                </span>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardExcerpt}>{item.excerpt}</div>
                <div className={styles.cardMeta}>{item.meta}</div>
              </a>
            )
          })}
        </div>
      </div>

      <div className={styles.roomsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>explore by room</span>
          <div className={styles.sectionLine} />
        </div>
        <div className={styles.roomsRow}>
          <a className={styles.roomPill} href="/digital-garden">
            🌱 Digital Garden
          </a>
          <a className={styles.roomPill} href="/bookshelf">
            📚 Bookshelf
          </a>
          <a className={styles.roomPill} href="/research">
            🔬 Research
          </a>
          <a className={styles.roomPill} href="/portfolio">
            ✦ Portfolio
          </a>
          <a className={styles.roomPill} href="/process">
            ⚙ Process
          </a>
          <a className={styles.roomPill} href="/start-here">
            → Start Here
          </a>
          <a className={styles.roomPill} href="/about">
            About
          </a>
        </div>
      </div>
    </div>
  )
}
