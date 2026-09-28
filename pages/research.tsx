import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/simple-page.module.css'

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Research — mariglynn.com</title>
      </Head>
      <SiteNav />
      <div className={styles.content}>
        <h1 className={styles.title}>Research</h1>
        <p className={styles.note}>This room is still being built. Check back soon.</p>
        <a href="/" className={styles.back}>← Back home</a>
      </div>
    </div>
  )
}
