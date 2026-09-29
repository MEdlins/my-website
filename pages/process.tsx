import Head from 'next/head'
import { getStaticNotionPage, STATIC_PAGE_IDS, type StaticPage } from '@/lib/notion-cms'
import { SiteNav } from '@/components/SiteNav'
import { NotionBlocks } from '@/components/NotionBlocks'
import styles from '@/styles/scaffold.module.css'

export const getStaticProps = async () => {
  const page = await getStaticNotionPage(STATIC_PAGE_IDS.process)
  return { props: { page }, revalidate: 60 }
}

export default function ProcessPage({ page }: { page: StaticPage }) {
  return (
    <div className={styles.page}>
      <Head>
        <title>{page.title || 'Process'} — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mariglynn/icons/blue-stem.png"
          alt=""
          className={styles.floatingBlob}
          style={{ top: 20, right: -20 }}
        />
        <p className={styles.eyebrow}>Process</p>
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
