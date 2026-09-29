// Shared color language for Digital Garden growth stages, used by the main
// Garden page and both the Shoot and Sprout detail pages. Colors are picked
// by keyword rather than an exact list, since Shoots and Sprouts each keep
// their own stage wording in Notion (e.g. "Shoot published" vs "Sprout
// published").
export type StageColors = { color: string; bg: string; border: string }

export function stageColors(label: string): StageColors {
  const s = label.toLowerCase()
  if (s.includes('abandon')) return { color: '#999', bg: '#f3f2ec', border: '#ddd9cc' }
  if (s.includes('bloom')) return { color: '#ff54a1', bg: '#fff0f7', border: '#f6c4de' }
  if (s.includes('publish')) return { color: '#0092b0', bg: '#e8f7f9', border: '#bde5ed' }
  if (s.includes('start')) return { color: '#0073da', bg: '#eaf3fd', border: '#c6dcf6' }
  if (s.includes('seed')) return { color: '#f6cc3e', bg: '#fff9e8', border: '#f3e3ad' }
  return { color: '#999', bg: '#f3f2ec', border: '#ddd9cc' }
}

export function stageSortRank(label: string): number {
  const s = label.toLowerCase()
  if (s.includes('seed')) return 0
  if (s.includes('start')) return 1
  if (s.includes('publish')) return 2
  if (s.includes('bloom')) return 3
  if (s.includes('abandon')) return 4
  return 5
}
