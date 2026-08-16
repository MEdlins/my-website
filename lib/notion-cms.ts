// Lightweight client for pulling structured data out of the three "public"
// Notion databases that back the site's custom pages (as opposed to the
// notion-x rendered pages, which stay on the existing NotionPage flow).
//
// Requires a Notion internal integration token in `NOTION_TOKEN`, and each
// database below must be shared with that integration in Notion
// (••• menu on the database → Connections → add your integration).

const NOTION_VERSION = '2025-09-03'
const NOTION_TOKEN = process.env.NOTION_TOKEN

// Data source IDs (not page/database IDs) - confirmed via live schema fetch.
const DATA_SOURCES = {
  bookshelf: '061b5576-fdaf-44fe-8201-50caee44f42f', // "Bookshelf Notes"
  shoots: 'd3381578-2b91-47a0-9b40-6d2ef1418a88', // "Garden Shoots"
  sprouts: '96d55015-fc49-405e-88c0-b5b8d5ab34d0' // "Garden Seeds & Sprouts"
} as const

async function queryDataSource(dataSourceId: string, body: Record<string, unknown> = {}) {
  if (!NOTION_TOKEN) {
    throw new Error(
      'Missing NOTION_TOKEN environment variable. Create a Notion internal integration, ' +
        'add the token as NOTION_TOKEN in .env.local / Vercel, and share each database with it.'
    )
  }

  const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion query failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { results: any[] }
  return json.results
}

// ---- property readers ----
const plainText = (prop: any): string =>
  (prop?.title ?? prop?.rich_text ?? []).map((t: any) => t.plain_text).join('')
const isChecked = (prop: any): boolean => Boolean(prop?.checkbox)
const multiSelect = (prop: any): string[] => (prop?.multi_select ?? []).map((o: any) => o.name)
const statusOrSelect = (prop: any): string => prop?.status?.name ?? prop?.select?.name ?? ''
const dateVal = (prop: any): string | null => prop?.date?.start ?? null
const fileUrl = (prop: any): string | null => {
  const file = prop?.files?.[0]
  if (!file) return null
  return file.type === 'external' ? file.external.url : (file.file?.url ?? null)
}

export type Book = {
  id: string
  title: string
  author: string
  description: string
  category: string[]
  rating: string // raw star-emoji string, e.g. "⭐️⭐️⭐️⭐️⭐️"
  image: string | null
  slug: string
  finishDate: string | null
  url: string | null
}

export async function getBooks(): Promise<Book[]> {
  const results = await queryDataSource(DATA_SOURCES.bookshelf, {
    filter: { property: 'Publish', checkbox: { equals: true } },
    sorts: [{ property: 'Finish Date', direction: 'descending' }]
  })

  return results.map((page) => {
    const p = page.properties
    return {
      id: page.id,
      title: plainText(p['Name']),
      author: plainText(p['Author']),
      description: plainText(p['Description']),
      category: multiSelect(p['Category']),
      rating: multiSelect(p['My rating out of 5'])[0] ?? '',
      image: fileUrl(p['Image']),
      slug: plainText(p['Slug']) || page.id,
      finishDate: dateVal(p['Finish Date']),
      url: p['userDefined:URL']?.url ?? null
    }
  })
}

export type NotionRichText = {
  text: string
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  code?: boolean
  href?: string | null
}

export type NotionBlock = {
  id: string
  type: string
  richText: NotionRichText[]
  imageUrl?: string
  children?: NotionBlock[]
}

function readRichText(arr: any[] = []): NotionRichText[] {
  return arr.map((t: any) => ({
    text: t.plain_text ?? '',
    bold: t.annotations?.bold,
    italic: t.annotations?.italic,
    strikethrough: t.annotations?.strikethrough,
    code: t.annotations?.code,
    href: t.href ?? null
  }))
}

export async function getPageContent(pageId: string, depth = 0): Promise<NotionBlock[]> {
  if (!NOTION_TOKEN) return []
  if (depth > 2) return [] // guard against runaway recursion on deeply nested pages

  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION
    }
  })

  if (!res.ok) {
    console.error(`Failed to fetch page content for ${pageId}: ${res.status}`)
    return []
  }

  const json = (await res.json()) as { results: any[] }

  const blocks = await Promise.all(
    json.results.map(async (b: any): Promise<NotionBlock> => {
      const type = b.type
      const data = b[type] ?? {}
      const block: NotionBlock = {
        id: b.id,
        type,
        richText: readRichText(data.rich_text)
      }

      if (type === 'image') {
        block.imageUrl = data.type === 'external' ? data.external?.url : data.file?.url
      }

      if (b.has_children && ['bulleted_list_item', 'numbered_list_item', 'toggle', 'quote'].includes(type)) {
        block.children = await getPageContent(b.id, depth + 1)
      }

      return block
    })
  )

  return blocks
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const books = await getBooks()
  return books.find((b) => b.slug === slug) ?? null
}

export type Shoot = {
  id: string
  title: string
  description: string
  category: string[]
  tags: string[]
  growthStage: string
  slug: string
  date: string | null
}

export async function getShoots(): Promise<Shoot[]> {
  const results = await queryDataSource(DATA_SOURCES.shoots, {
    filter: { property: 'Published', checkbox: { equals: true } },
    sorts: [{ property: 'Bloomed:', direction: 'descending' }]
  })

  return results.map((page) => {
    const p = page.properties
    return {
      id: page.id,
      title: plainText(p['My Note']),
      description: plainText(p['Description']),
      category: multiSelect(p['Category']),
      tags: multiSelect(p['Tags']),
      growthStage: statusOrSelect(p['Growth Stage']),
      slug: plainText(p['Slug']) || page.id,
      date: dateVal(p['Bloomed:']) ?? page.created_time
    }
  })
}

export type Sprout = {
  id: string
  title: string
  description: string
  growthStatus: string
  slug: string // numeric id used as slug, per Mariglynn's call - sprouts are low-ceremony
  date: string
}

export async function getSprouts(): Promise<Sprout[]> {
  const results = await queryDataSource(DATA_SOURCES.sprouts, {
    filter: { property: 'Publish', checkbox: { equals: true } },
    sorts: [{ timestamp: 'created_time', direction: 'descending' }]
  })

  return results.map((page) => {
    const p = page.properties
    return {
      id: page.id,
      title: plainText(p['Sprouts Title']),
      description: plainText(p['Seed Info ↓']),
      growthStatus: statusOrSelect(p['Growth Status']),
      slug: String(p['Slug']?.number ?? page.id.replace(/-/g, '').slice(0, 8)),
      date: page.created_time
    }
  })
}

export async function getRecentShootsForHero(limit = 5): Promise<{ text: string; href: string }[]> {
  const results = await queryDataSource(DATA_SOURCES.shoots, {
    filter: { property: 'Published', checkbox: { equals: true } },
    sorts: [{ property: 'Last tended:', direction: 'descending' }],
    page_size: limit
  })

  return results.map((page) => {
    const p = page.properties
    const slug = plainText(p['Slug']) || page.id
    return {
      text: plainText(p['My Note']),
      href: `/digital-garden/shoots/${slug}`
    }
  })
}

// ---- unified homepage feed ----
export type FeedItem = {
  id: string
  source: 'Digital Garden' | 'Bookshelf'
  kind: string
  title: string
  excerpt: string
  meta: string
  date: string
  href: string
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  return months <= 1 ? '1 month ago' : `${months} months ago`
}

export async function getHomepageFeed(limit = 18): Promise<FeedItem[]> {
  const [books, shoots, sprouts] = await Promise.all([getBooks(), getShoots(), getSprouts()])

  const bookItems: FeedItem[] = books
    .filter((b) => b.finishDate)
    .map((b) => ({
      id: b.id,
      source: 'Bookshelf',
      kind: b.rating ? `${b.rating}` : 'Read',
      title: `${b.title}${b.author ? ` — ${b.author}` : ''}`,
      excerpt: b.description,
      meta: `Finished ${timeAgo(b.finishDate!)}`,
      date: b.finishDate!,
      href: `/bookshelf/${b.slug}`
    }))

  const shootItems: FeedItem[] = shoots
    .filter((s) => s.date)
    .map((s) => ({
      id: s.id,
      source: 'Digital Garden',
      kind: 'Shoot',
      title: s.title,
      excerpt: s.description,
      meta: `Shoot · ${timeAgo(s.date!)}`,
      date: s.date!,
      href: `/digital-garden/shoots/${s.slug}`
    }))

  const sproutItems: FeedItem[] = sprouts.map((s) => ({
    id: s.id,
    source: 'Digital Garden',
    kind: 'Sprout',
    title: s.title,
    excerpt: s.description,
    meta: `Sprout · ${timeAgo(s.date)}`,
    date: s.date,
    href: `/digital-garden/sprouts/${s.slug}`
  }))

  return [...bookItems, ...shootItems, ...sproutItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}
