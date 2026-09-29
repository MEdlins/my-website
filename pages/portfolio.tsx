import Head from 'next/head'
import { SiteNav } from '@/components/SiteNav'
import styles from '@/styles/scaffold.module.css'

const PLACEHOLDER_PROJECTS = [1, 2, 3]

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Portfolio — mariglynn.com</title>
      </Head>
      <SiteNav />

      <div className={styles.heroSplit}>
        <div>
          <p className={styles.eyebrow}>Portfolio</p>
          <h1 className={`${styles.title} ${styles.titleWide}`}>
            Placeholder — let&rsquo;s design this together
          </h1>
          <p className={styles.body}>
            Projects and work samples. Rough scaffold below — tell me what belongs here (case
            studies, visual work, client projects) and how much detail each one needs.
          </p>
        </div>
        <div className={styles.heroBlob}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mariglynn/icons/yellow-blob.png" alt="" />
        </div>
      </div>

      <div className={styles.sectionDivider}>
        <span className={styles.sectionLabel}>projects</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.projectGrid}>
        {PLACEHOLDER_PROJECTS.map((i) => (
          <div key={i} className={styles.projectCard}>
            <div className={styles.projectImage}>Project image</div>
            <div className={styles.projectBody}>
              <div className={styles.projectTitle}>[Project name]</div>
              <div className={styles.projectDesc}>[One-line description]</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
