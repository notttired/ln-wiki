export interface ArticleMeta {
  title: string
  path: string
  filePath: string
  category: string
  subcategory: string | null
}

export interface SubcategoryNode {
  name: string
  articles: ArticleMeta[]
}

export interface CategoryNode {
  name: string
  articles: ArticleMeta[]
  subcategories: SubcategoryNode[]
}

export interface WikiIndex {
  categories: CategoryNode[]
  allArticles: ArticleMeta[]
}
