import { useEffect, useState } from 'react'
import styles from '@/styles/home.module.css'

// Static for now - move to a Notion database later if you want to edit
// these without a deploy (e.g. a one-off "Questions" list with a checkbox
// for "current"). Wiring that up is a quick follow-on to notion-cms.ts.
const QUESTIONS = [
  {
    text: 'What does expertise actually feel like from the inside?',
    href: '/digital-garden'
  },
  {
    text: 'How do we learn to see what we couldn\u2019t see before?',
    href: '/digital-garden'
  },
  {
    text: 'What gets lost when we make complicated things simple?',
    href: '/digital-garden'
  },
  {
    text: 'When does a collection become a way of thinking?',
    href: '/digital-garden'
  },
  {
    text: 'What would it look like to take attention seriously as a design material?',
    href: '/digital-garden'
  }
]

export function HeroQuestions() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % QUESTIONS.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [current])

  return (
    <div className={styles.hero}>
      <p className={styles.heroEyebrow}>Questions on my mind recently</p>

      <div className={styles.questionsContainer}>
        {QUESTIONS.map((q, i) => (
          <div
            key={q.text}
            className={`${styles.question} ${i === current ? styles.questionActive : ''}`}
          >
            {q.text}
            <br />
            <a className={styles.questionLink} href={q.href}>
              follow this question
            </a>
          </div>
        ))}
      </div>

      <div className={styles.questionDots}>
        {QUESTIONS.map((q, i) => (
          <button
            key={q.text}
            aria-label={`Show question ${i + 1}`}
            className={`${styles.qDot} ${i === current ? styles.qDotActive : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  )
}
