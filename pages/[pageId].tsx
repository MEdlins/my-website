import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, pageUrlOverrides } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params?.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    // Previously this re-threw, which fails the ENTIRE site build if even
    // one Notion page is temporarily unreachable (e.g. a transient 403 from
    // Notion's unofficial API). Instead, just 404 this one page and let the
    // rest of the site build/deploy normally - it'll retry on next request
    // since revalidate keeps this page fresh once Notion is reachable again.
    return { notFound: true, revalidate: 10 }
  }
}

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true
    }
  }

  const siteMap = await getSiteMap()

  // Combine sitemap paths with URL overrides (e.g., /articles, /notes)
  // URL overrides might not be in the sitemap if not directly linked from root
  const allPageIds = [
    ...new Set([
      ...Object.keys(siteMap.canonicalPageMap),
      ...Object.keys(pageUrlOverrides)
    ])
  ]

  const staticPaths = {
    paths: allPageIds.map((pageId) => ({ params: { pageId } })),
    fallback: true
  }

  console.log(staticPaths.paths)
  return staticPaths
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}
