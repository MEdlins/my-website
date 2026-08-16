import { useMemo, useState } from 'react'
import Head from 'next/head'
import { getBooks, type Book } from '@/lib/notion-cms'
import styles from '@/styles/bookshelf.module.css'

export const getStaticProps = async () => {
  const books = await getBooks()
  return { props: { books }, revalidate: 60 }
}

type SortMode = 'newest' | 'title'

export default function BookshelfPage({ books }: { books: Book[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  const categories = useMemo(() => {
    const set = new Set<string>()
    books.forEach((b) => b.category.forEach((c) => set.add(c)))
    return [...set].sort()
  }, [books])

  const visibleBooks = useMemo(() => {
    let list = activeCategory ? books.filter((b) => b.category.includes(activeCategory)) : books

    list = [...list].sort((a, b) => {
      if (sortMode === 'title') return a.title.localeCompare(b.title)
      // newest first; books without a finish date sink to the bottom
      if (!a.finishDate) return 1
      if (!b.finishDate) return -1
      return new Date(b.finishDate).getTime() - new Date(a.finishDate).getTime()
    })

    return list
  }, [books, activeCategory, sortMode])

  return (
    <div className={styles.shell}>
      <Head>
        <title>Bookshelf — mariglynn.com</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <nav className={styles.nav}>
        <a href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/mariglynn-wordmark.png" alt="MARIGLYNN" className={styles.wordmark} />
        </a>
        <div className={styles.navLinks}>
          <a href="/start-here">Start here</a>
          <a href="/about">Work with me</a>
        </div>
      </nav>

      <header className={styles.header}>
        <svg
          viewBox="0 0 440 100"
          preserveAspectRatio="none"
          className={styles.headerBlob}
        >
          <path
            d="M 38 24 C 70 4 118 -2 168 8 C 206 16 236 4 276 8 C 328 12 384 10 404 34 C 422 56 410 84 370 93 C 320 104 252 90 198 96 C 144 102 74 106 40 90 C 6 76 12 44 38 24 Z"
            fill="#ff3246"
          />
        </svg>
        <div className={styles.headerContent}>
          <a href="/" className={styles.backLink}>
            ← Back to the hall
          </a>
          <h1 className={styles.headerTitle}>Bookshelf</h1>
          <p className={styles.headerSubtitle}>
            What stayed with me — a running shelf of books, sorted however I feel like sorting them.
          </p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            className={`${styles.pill} ${!activeCategory ? styles.pillActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.pill} ${activeCategory === c ? styles.pillActive : ''}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>Sort</span>
          <button
            className={`${styles.pill} ${sortMode === 'newest' ? styles.pillActive : ''}`}
            onClick={() => setSortMode('newest')}
          >
            Newest
          </button>
          <button
            className={`${styles.pill} ${sortMode === 'title' ? styles.pillActive : ''}`}
            onClick={() => setSortMode('title')}
          >
            Title A–Z
          </button>
        </div>
      </div>

      {visibleBooks.length === 0 ? (
        <p className={styles.empty}>Nothing here yet for this filter.</p>
      ) : (
        <div className={styles.grid}>
          {visibleBooks.map((b) => (
            <a key={b.id} href={`/bookshelf/${b.slug}`} className={styles.cover}>
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt={b.title} className={styles.coverImg} />
              ) : (
                <div className={styles.coverPlaceholder}>{b.title}</div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
