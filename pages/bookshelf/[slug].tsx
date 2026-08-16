import Head from 'next/head'
import { getBooks, getBookBySlug, getPageContent, type Book, type NotionBlock } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/bookshelf.module.css'

export const getStaticPaths = async () => {
  try {
    const books = await getBooks()
    return {
      paths: books.map((b) => ({ params: { slug: b.slug } })),
      fallback: 'blocking'
    }
  } catch (err) {
    console.error('bookshelf getStaticPaths error', err)
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps = async ({ params }: { params: { slug: string } }) => {
  const book = await getBookBySlug(params.slug)
  if (!book) return { notFound: true, revalidate: 60 }
  const content = await getPageContent(book.id)
  return { props: { book, content }, revalidate: 60 }
}

export default function BookDetailPage({ book, content }: { book: Book; content: NotionBlock[] }) {
  return (
    <div className={styles.shell}>
      <Head>
        <title>{book.title} — Bookshelf — mariglynn.com</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <SiteNav />

      <div className={styles.detail}>
        <a href="/bookshelf" className={styles.backLinkPlain}>
          ← Back to shelf
        </a>

        <div className={styles.detailGrid}>
          {book.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.image} alt={book.title} className={styles.detailCover} />
          ) : (
            <div className={styles.coverPlaceholder} style={{ width: 260 }}>
              {book.title}
            </div>
          )}

          <div className={styles.detailInfo}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {book.category[0] && <span className={styles.typeBadge}>{book.category[0]}</span>}
              <h1 className={styles.detailTitle}>{book.title}</h1>
              {book.author && <span className={styles.detailAuthor}>{book.author}</span>}
              {book.rating && <span className={styles.stars}>{book.rating}</span>}
            </div>

            {book.description && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionLabel}>Summary</span>
                <p className={styles.summaryText}>{book.description}</p>
              </div>
            )}

            {book.url && (
              <div className={styles.sectionBlock}>
                <a href={book.url} target="_blank" rel="noreferrer">
                  More about this →
                </a>
              </div>
            )}

            {content.length > 0 && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionLabel}>Notes</span>
                <div className={styles.summaryText} style={{ maxWidth: 620 }}>
                  <NotionBlocks blocks={content} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
