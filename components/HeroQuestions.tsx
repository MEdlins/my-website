import { useEffect, useState } from 'react'
import styles from '@/styles/home.module.css'

export type Question = { text: string; href: string }

export function HeroQuestions({ questions }: { questions: Question[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (questions.length < 2) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % questions.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [current, questions.length])

  if (questions.length === 0) return null

  return (
    <div className={styles.hero}>
      <p className={styles.heroEyebrow}>Questions I&rsquo;ve been exploring recently</p>

      <div className={styles.questionsContainer}>
        {questions.map((q, i) => (
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

      {questions.length > 1 && (
        <div className={styles.questionDots}>
          {questions.map((q, i) => (
            <button
              key={q.text}
              aria-label={`Show question ${i + 1}`}
              className={`${styles.qDot} ${i === current ? styles.qDotActive : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
