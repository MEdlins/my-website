import Head from 'next/head'
import { getStaticNotionPage, STATIC_PAGE_IDS, type StaticPage } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/scaffold.module.css'

export const getStaticProps = async () => {
  const page = await getStaticNotionPage(STATIC_PAGE_IDS.teaching)
  return { props: { page }, revalidate: 60 }
}

export default function TeachingPage({ page }: { page: StaticPage }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{page.title || 'Teaching'} — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Teaching</p>
        {page.content.length > 0 ? (
          <div className={styles.prose}>
            <NotionBlocks blocks={page.content} />
          </div>
        ) : (
          <p className={styles.emptyNote}>Nothing written here yet.</p>
        )}
      </div>
    </div>
  )
}
