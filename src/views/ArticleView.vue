<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { markdownModules, routeParamToGlobKey } from '@/composables/useWikiIndex'
import { renderMarkdown } from '@/composables/useMarkdown'
import { parseInfoTable } from '@/utils/parseInfoTable'
import type { InfoRow } from '@/utils/parseInfoTable'
import ArticleRenderer from '@/components/ArticleRenderer.vue'
import InfoCard from '@/components/InfoCard.vue'

const props = defineProps<{ articlePath: string | string[] }>()

const html = ref<string | null>(null)
const infoRows = ref<InfoRow[]>([])
const loading = ref(false)
const notFound = ref(false)

async function loadArticle(articlePath: string | string[]) {
  loading.value = true
  notFound.value = false
  html.value = null
  infoRows.value = []

  const globKey = routeParamToGlobKey(articlePath)
  const loader = markdownModules[globKey]

  if (!loader) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const raw = await loader()
    const parsed = parseInfoTable(raw)
    infoRows.value = parsed?.rows ?? []
    const body = parsed?.strippedMarkdown ?? raw
    html.value = renderMarkdown(body)

    const pathStr = Array.isArray(articlePath) ? articlePath.join('/') : articlePath
    const title = decodeURIComponent(pathStr.split('/').pop() ?? '')
    document.title = title + ' — ln-wiki'
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadArticle(props.articlePath))
watch(() => props.articlePath, (val) => loadArticle(val))
</script>

<template>
  <div class="article-view">
    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton skeleton-title" />
      <div class="skeleton skeleton-line" />
      <div class="skeleton skeleton-line skeleton-short" />
      <div class="skeleton skeleton-line" />
    </div>
    <div v-else-if="notFound" class="not-found">
      <p>Article not found.</p>
    </div>
    <div v-else-if="html" class="article-layout">
      <ArticleRenderer :html="html" />
      <InfoCard v-if="infoRows.length" :rows="infoRows" />
    </div>
  </div>
</template>

<style scoped>
.article-view {
  min-height: 60vh;
}

.article-layout {
  display: flex;
  align-items: flex-start;
}

.not-found {
  padding: 3rem;
  color: var(--text);
}

.skeleton-wrap {
  padding: 3rem 3rem 4rem;
  max-width: 780px;
}

.skeleton {
  border-radius: 4px;
  margin-bottom: 0.75rem;
  animation: shimmer 1.4s ease-in-out infinite;
  background: linear-gradient(90deg, var(--border) 25%, var(--code-bg) 50%, var(--border) 75%);
  background-size: 400% 100%;
}

.skeleton-title {
  height: 2.25rem;
  width: 55%;
  margin-bottom: 1.5rem;
}

.skeleton-line {
  height: 1rem;
  width: 100%;
}

.skeleton-short {
  width: 70%;
}

@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (max-width: 900px) {
  .article-layout {
    flex-direction: column-reverse;
  }
}
</style>
