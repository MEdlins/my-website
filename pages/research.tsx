import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/scaffold.module.css'

const PLACEHOLDER_ITEMS = [
  { tag: 'Paper', title: '[Paper title]', desc: '[Venue, year, one-line abstract]' },
  { tag: 'Talk', title: '[Talk title]', desc: '[Conference, year]' }
]

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Research — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.heroSplit}>
        <div>
          <p className={styles.eyebrow}>Research</p>
          <h1 className={`${styles.title} ${styles.titleWide}`}>
            Placeholder — let&rsquo;s design this together
          </h1>
          <p className={styles.body}>
            A listing of papers, talks, and projects, with a detail page per item. Structure below
            is a rough starting scaffold — tell me what fields matter (venue, date, co-authors,
            abstract, PDF link) and we&rsquo;ll refine it.
          </p>
        </div>
        <div className={styles.heroBlob}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/icons/pink-blob.png" alt="" />
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <span className={styles.sectionLabel}>selected work</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.researchGrid}>
        {PLACEHOLDER_ITEMS.map((item) => (
          <div key={item.tag} className={styles.researchCard}>
            <span className={styles.researchTag}>{item.tag}</span>
            <div className={styles.researchTitle}>{item.title}</div>
            <div className={styles.researchDesc}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
