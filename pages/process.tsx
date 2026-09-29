import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/scaffold.module.css'

export default function ProcessPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Process — mariglynn.com</title>
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
        <h1 className={styles.title}>Placeholder — let&rsquo;s design this together</h1>
        <p className={styles.body}>
          This looks like a single static page — how I actually work, my tools, or the path an
          idea takes from a seed to something finished.
        </p>
        <p className={styles.hint}>Tell me what you want covered here and I&rsquo;ll write it up.</p>
      </div>
    </div>
  )
}
