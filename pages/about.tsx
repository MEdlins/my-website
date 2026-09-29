import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/scaffold.module.css'

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>About — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.hero} style={{ color: '#1a1a1a' }}>
        <p className={styles.eyebrow}>About</p>
        <h1 className={styles.title}>Placeholder — let&rsquo;s design this together</h1>
        <p className={styles.body}>
          A short bio, a photo, and whatever credentials feel worth stating plainly — no jargon
          inflation. Send me the real copy and a photo and I&rsquo;ll lay it out.
        </p>
      </div>
    </div>
  )
}
