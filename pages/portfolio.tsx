import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/simple-page.module.css'

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Portfolio — mariglynn.com</title>
      </Head>
      <SiteNav />
      <div className={styles.content}>
        <h1 className={styles.title}>Portfolio</h1>
        <p className={styles.note}>This room is still being built. Check back soon.</p>
        <a href="/" className={styles.back}>← Back home</a>
      </div>
    </div>
  )
}
