import { useMemo, useState } from 'react'
import Head from 'next/head'
import { getBooks, type Book } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
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

      <SiteNav />

      <header className={styles.plainHeader}>
        <div className={styles.plainHeaderText}>
          <a href="/" className={styles.plainBackLink}>
            ← Back
          </a>
          <h1 className={styles.plainHeaderTitle}>Bookshelf</h1>
          <p className={styles.plainHeaderSubtitle}>
            What stayed with me — a running shelf of books, sorted however I feel like sorting them.
          </p>
        </div>
        <div className={styles.plainHeaderImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/icons/red-half-moon.png" alt="" />
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
