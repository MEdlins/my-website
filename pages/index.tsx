import Head from 'next/head'
import { getHomepageFeed, getRecentShootsForHero, type FeedItem } from '@/lib/notion-cms'
import { HeroQuestions } from '@/components/HeroQuestions'
import styles from '@/styles/home.module.css'

export const getStaticProps = async () => {
  const [feed, questions] = await Promise.all([
    getHomepageFeed(18),
    getRecentShootsForHero(5)
  ])
  return { props: { feed, questions }, revalidate: 60 }
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

const ROOMS = [
  { href: '/digital-garden', label: 'Digital Garden', icon: '/mariglynn/icons/garden-icon-leaf.png' },
  { href: '/bookshelf', label: 'Bookshelf', icon: '/mariglynn/icons/red-half-moon.png' },
  { href: '/research', label: 'Research', icon: '/mariglynn/icons/pink-blob.png' },
  { href: '/portfolio', label: 'Portfolio', icon: '/mariglynn/icons/yellow-blob.png' },
  { href: '/process', label: 'Process', icon: '/mariglynn/icons/blue-stem.png' },
  { href: '/start-here', label: 'Start Here', icon: '/mariglynn/icons/blue-blob.png' },
  { href: '/about', label: 'About', icon: null }
]

type Question = { text: string; href: string }

export default function HomePage({ feed, questions }: { feed: FeedItem[]; questions: Question[] }) {
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
        <a href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/mariglynn-wordmark.png" alt="MARIGLYNN" className={styles.wordmark} />
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

      <HeroQuestions questions={questions} />

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
          {ROOMS.map((room) => (
            <a key={room.href} className={styles.roomPill} href={room.href}>
              {room.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.icon} alt="" className={styles.roomPillIcon} />
              )}
              {room.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
