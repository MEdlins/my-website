import Head from 'next/head'
import { getStaticNotionPage, STATIC_PAGE_IDS, type StaticPage } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/scaffold.module.css'

export const getStaticProps = async () => {
  const page = await getStaticNotionPage(STATIC_PAGE_IDS.startHere)
  return { props: { page }, revalidate: 60 }
}

export default function StartHerePage({ page }: { page: StaticPage }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{page.title || 'Start Here'} — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mariglynn/icons/blue-blob.png"
          alt=""
          className={styles.floatingBlob}
          style={{ top: 10, right: -30, width: 100 }}
        />
        <p className={styles.eyebrow}>Start here</p>
        {page.content.length > 0 ? (
          <div className={styles.prose}>
            <NotionBlocks blocks={page.content} />
          </div>
        ) : (
          <p className={styles.emptyNote}>Nothing written here yet.</p>
        )}
        <div className={styles.ctaList}>
          <a href="/digital-garden" className={styles.ctaLink} style={{ color: '#0073da' }}>
            → If you want to see how I think, start in the Garden
          </a>
          <a href="/bookshelf" className={styles.ctaLink} style={{ color: '#0073da' }}>
            → If you want book recommendations, try the Bookshelf
          </a>
        </div>
      </div>
    </div>
  )
}
