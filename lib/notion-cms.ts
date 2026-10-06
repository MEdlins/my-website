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

// --- throttling + retry ---------------------------------------------------
// Notion's public API allows roughly 3 requests/second. During a static
// build we fetch dozens of pages' worth of content in parallel, which blows
// straight through that limit and gets 429s back. This wrapper caps how
// many Notion requests run at once and automatically retries a 429 after
// the delay Notion asks for (falling back to a short backoff otherwise).
const MAX_CONCURRENT_REQUESTS = 3
const MIN_REQUEST_INTERVAL_MS = 350 // caps the effective rate well under Notion's ~3 req/s limit
let activeRequests = 0
let lastDispatchTime = 0
const waitQueue: Array<() => void> = []

async function acquireSlot(): Promise<void> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waitQueue.push(resolve))
  }
  activeRequests++

  const wait = lastDispatchTime + MIN_REQUEST_INTERVAL_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastDispatchTime = Date.now()
}

function releaseSlot() {
  activeRequests--
  const next = waitQueue.shift()
  if (next) next()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function notionFetch(url: string, init: RequestInit, retries = 5): Promise<Response> {
  await acquireSlot()
  try {
    const res = await fetch(url, init)
    if (res.status === 429 && retries > 0) {
      const body = (await res
        .clone()
        .json()
        .catch(() => null)) as { additional_data?: { retry_after?: string | number } } | null
      const retryAfter = Number(body?.additional_data?.retry_after ?? res.headers.get('retry-after') ?? 1)
      await sleep((retryAfter + 0.5) * 1000)
      return notionFetch(url, init, retries - 1)
    }
    return res
  } finally {
    releaseSlot()
  }
}

async function queryDataSource(dataSourceId: string, body: Record<string, unknown> = {}) {
  if (!NOTION_TOKEN) {
    throw new Error(
      'Missing NOTION_TOKEN environment variable. Create a Notion internal integration, ' +
        'add the token as NOTION_TOKEN in .env.local / Vercel, and share each database with it.'
    )
  }

  const res = await notionFetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
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
// Tolerates a multi-select, a single select, or a relation (reads the
// related pages' titles) - whichever shape the "Tags"/"Themes" property
// actually turns out to be.
const multiSelect = (prop: any): string[] => {
  if (!prop) return []
  if (prop.multi_select) return prop.multi_select.map((o: any) => o.name)
  if (prop.select) return [prop.select.name]
  if (prop.relation) return prop.relation.map((r: any) => r.id)
  return []
}
const statusOrSelect = (prop: any): string => prop?.status?.name ?? prop?.select?.name ?? ''
// Reads a date out of a property, tolerating a few shapes beyond a plain
// Date field: a formula that resolves to a date (or to a date string), a
// rollup that surfaces a date (directly or via its array of source
// values), and the built-in created_time/last_edited_time properties.
const dateVal = (prop: any): string | null => {
  if (!prop) return null
  if (prop.date?.start) return prop.date.start
  if (prop.formula?.date?.start) return prop.formula.date.start
  if (prop.formula?.type === 'string' && prop.formula.string) return prop.formula.string
  if (prop.rollup?.date?.start) return prop.rollup.date.start
  if (Array.isArray(prop.rollup?.array)) {
    for (const item of prop.rollup.array) {
      if (item?.date?.start) return item.date.start
    }
  }
  if (typeof prop.created_time === 'string') return prop.created_time
  if (typeof prop.last_edited_time === 'string') return prop.last_edited_time
  return null
}
const fileUrl = (prop: any): string | null => {
  const file = prop?.files?.[0]
  if (!file) return null
  return file.type === 'external' ? file.external.url : (file.file?.url ?? null)
}
// Reads a URL property, but tolerates rich_text/title/email/phone too in
// case the property wasn't set up as an actual URL field. Also handles a
// rich_text property whose visible words are hyperlinked in Notion (e.g.
// the word "Amazon" linked to an actual URL) - the link lives on the
// individual text run, not the property itself.
export type LinkValue = { text: string; url: string | null }
const linkValue = (prop: any): LinkValue | null => {
  if (!prop) return null
  if (prop.url) return { text: prop.url, url: prop.url }
  if (prop.email) return { text: prop.email, url: `mailto:${prop.email}` }
  if (prop.phone_number) return { text: prop.phone_number, url: `tel:${prop.phone_number}` }
  const runs = prop.title ?? prop.rich_text ?? []
  const text = runs.map((t: any) => t.plain_text).join('')
  if (!text) return null
  const linkedRun = runs.find((t: any) => t.href)
  const url = linkedRun?.href ?? (/^https?:\/\//.test(text) ? text : null)
  return { text, url }
}
// Notion property names are easy to mistype/mis-case by a character - look
// up a property by name ignoring case and surrounding whitespace so a
// property named e.g. "website reference " still matches "Website Reference".
const getProp = (properties: Record<string, any>, name: string): any => {
  const target = name.trim().toLowerCase()
  const key = Object.keys(properties).find((k) => k.trim().toLowerCase() === target)
  return key ? properties[key] : undefined
}
// Same idea as getProp, but tries several candidate names in order and
// returns the first one that's actually set on the page - handy when a
// property's exact label (trailing colon, wording) isn't known for sure.
const firstProp = (properties: Record<string, any>, names: string[]): any => {
  for (const name of names) {
    const prop = getProp(properties, name)
    if (prop) return prop
  }
  return undefined
}
// Reads a relation property into the list of related page ids.
const relationIds = (prop: any): string[] => (prop?.relation ?? []).map((r: any) => r.id)
// Reads a "SlugID" property into a URL-safe slug string. Notion's own
// unique ID property type (prefix + number, e.g. "SHOOT-42") is the
// expected shape, but this also tolerates a formula, number, or plain
// text property in case SlugID isn't set up as a unique ID field.
const slugIdValue = (prop: any): string | null => {
  if (!prop) return null
  if (prop.unique_id) {
    const { prefix, number } = prop.unique_id
    if (number == null) return null
    return prefix ? `${prefix}-${number}` : String(number)
  }
  if (prop.formula) {
    const f = prop.formula
    if (f.type === 'string' && f.string) return f.string
    if (f.type === 'number' && f.number != null) return String(f.number)
  }
  if (typeof prop.number === 'number') return String(prop.number)
  const text = plainText(prop)
  return text || null
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
  websiteReference: LinkValue | null
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
      url: p['userDefined:URL']?.url ?? null,
      websiteReference: linkValue(getProp(p, 'Website Reference'))
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
  icon?: string
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
  if (depth > 4) return [] // guard against runaway recursion on deeply nested pages

  const res = await notionFetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
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

      if (type === 'callout' && data.icon?.emoji) {
        block.icon = data.icon.emoji
      }

      // Recurse into children for any nested block, except linked/sub-pages
      // (which would pull in unrelated content) - covers toggles, callouts,
      // lists, quotes, and any other container block Notion supports.
      const SKIP_CHILD_TYPES = ['child_page', 'child_database', 'link_to_page', 'synced_block']
      if (b.has_children && !SKIP_CHILD_TYPES.includes(type)) {
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
  plantedDate: string | null
  lastTendedDate: string | null
  relatedSproutIds: string[]
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
      tags: multiSelect(firstProp(p, ['Tags', 'Themes', 'Theme', 'Theme Tags'])),
      growthStage: statusOrSelect(p['Growth Stage']),
      slug: slugIdValue(getProp(p, 'SlugID')) || plainText(p['Slug']) || page.id,
      date: dateVal(p['Bloomed:']) ?? page.created_time,
      plantedDate: dateVal(firstProp(p, ['Planted on:', 'Planted:', 'Planted On', 'Planted on', 'Planted'])),
      lastTendedDate: dateVal(firstProp(p, ['Last tended:', 'Last Tended', 'Last tended'])),
      relatedSproutIds: relationIds(firstProp(p, ['Garden Sprouts', 'Sprouts', 'Related Sprouts']))
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
      slug: slugIdValue(getProp(p, 'SlugID')) || String(p['Slug']?.number ?? page.id.replace(/-/g, '').slice(0, 8)),
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

// e.g. "Mar 3, 2026" - used for the Planted/Last tended dates on Shoots.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(iso: string): string {
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

// ---- single-page Notion content (About, Portfolio, Research, Process,
// Start Here, Creative Practice, Teaching) - these are individual written
// Notion pages, not databases, each shared directly with the integration.
export const STATIC_PAGE_IDS = {
  about: '3bc3f5f0-fa3f-80f8-9c80-e3d80dad40f7',
  research: '05eda101-97f4-40b6-8fc0-7a105924fac0',
  startHere: '3bc3f5f0-fa3f-8069-9129-cc76764facd4',
  portfolio: 'c1fcdbcf-6e8a-4d56-bb1a-851362912bbd',
  creativePractice: '4211d8bc-5a04-4646-9b54-07d98dd7a1fa',
  process: 'fe942c72-6438-4cc1-8b65-4baf2f224484',
  teaching: '0561e238-2fc0-4ca0-8e96-03c109b8eddf'
} as const

async function getPageTitle(pageId: string): Promise<string> {
  if (!NOTION_TOKEN) return ''
  const res = await notionFetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION
    }
  })
  if (!res.ok) {
    console.error(`Failed to fetch page title for ${pageId}: ${res.status}`)
    return ''
  }
  const json = (await res.json()) as { properties?: Record<string, any> }
  const titleProp = Object.values(json.properties ?? {}).find((p: any) => p?.type === 'title')
  return titleProp ? plainText(titleProp) : ''
}

export type StaticPage = { title: string; content: NotionBlock[] }

export async function getStaticNotionPage(pageId: string): Promise<StaticPage> {
  const [title, content] = await Promise.all([getPageTitle(pageId), getPageContent(pageId)])
  return { title, content }
}
