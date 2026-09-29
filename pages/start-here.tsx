import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/scaffold.module.css'

export default function StartHerePage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Start Here — mariglynn.com</title>
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
        <h1 className={styles.title}>Placeholder — let&rsquo;s design this together</h1>
        <p className={styles.body}>
          A short orientation page — where to go first if you&rsquo;re new here, and a map of the
          rooms (Garden, Bookshelf, Research, Portfolio).
        </p>
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
