import { useState } from 'react'
import styles from '@/styles/nav.module.css'

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/digital-garden', label: 'Garden' },
  { href: '/bookshelf', label: 'Bookshelf' },
  { href: '/research', label: 'Research' },
  { href: '/portfolio', label: 'Portfolio' }
]

const MOBILE_MENU_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/digital-garden', label: 'Digital Garden' },
  { href: '/bookshelf', label: 'Bookshelf' },
  { href: '/research', label: 'Research' },
  { href: '/process', label: 'Process' },
  { href: '/start-here', label: 'Start Here' },
  { href: '/portfolio', label: 'Portfolio' }
]

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className={styles.nav}>
      <a href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mariglynn/mariglynn-wordmark.png" alt="MARIGLYNN" className={styles.wordmark} />
      </a>

      <ul className={styles.navLinks}>
        {NAV_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>

      <button
        aria-label="Explore rooms"
        className={styles.menuButton}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {MOBILE_MENU_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
