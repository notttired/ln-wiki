import type { ArticleMeta, CategoryNode, WikiIndex } from '@/types/wiki'

export const markdownModules = import.meta.glob<string>(
  '/src/assets/wiki/**/*.md',
  { query: '?raw', import: 'default' },
)

function filePathToRoute(globKey: string): string {
  const relative = globKey.replace('/src/assets/wiki/', '').replace(/\.md$/, '')
  return '/wiki/' + relative.split('/').map(encodeURIComponent).join('/')
}

function buildIndex(): WikiIndex {
  const categoryMap = new Map<string, CategoryNode>()
  const allArticles: ArticleMeta[] = []

  for (const globKey of Object.keys(markdownModules)) {
    const relative = globKey.replace('/src/assets/wiki/', '').replace(/\.md$/, '')
    const segments = relative.split('/')

    if (segments.length < 2) continue

    const category = segments[0]
    const title = segments[segments.length - 1]
    const subcategory = segments.length === 3 ? segments[1] : null

    const article: ArticleMeta = {
      title,
      path: filePathToRoute(globKey),
      filePath: globKey,
      category,
      subcategory,
    }

    allArticles.push(article)

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { name: category, articles: [], subcategories: [] })
    }
    const catNode = categoryMap.get(category)!

    if (subcategory === null) {
      catNode.articles.push(article)
    } else {
      let subNode = catNode.subcategories.find((s) => s.name === subcategory)
      if (!subNode) {
        subNode = { name: subcategory, articles: [] }
        catNode.subcategories.push(subNode)
      }
      subNode.articles.push(article)
    }
  }

  // Sort articles alphabetically within each node
  const sortArticles = (articles: ArticleMeta[]) =>
    articles.sort((a, b) => a.title.localeCompare(b.title))

  const categories: CategoryNode[] = []
  for (const cat of categoryMap.values()) {
    sortArticles(cat.articles)
    for (const sub of cat.subcategories) {
      sortArticles(sub.articles)
    }
    cat.subcategories.sort((a, b) => a.name.localeCompare(b.name))
    categories.push(cat)
  }
  categories.sort((a, b) => a.name.localeCompare(b.name))
  allArticles.sort((a, b) => a.title.localeCompare(b.title))

  return { categories, allArticles }
}

export const wikiIndex: WikiIndex = buildIndex()
export const { allArticles } = wikiIndex

export function routeParamToGlobKey(articlePath: string | string[]): string {
  const path = Array.isArray(articlePath) ? articlePath.join('/') : articlePath
  const decoded = path.split('/').map(decodeURIComponent).join('/')
  return '/src/assets/wiki/' + decoded + '.md'
}
