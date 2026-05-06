<script setup lang="ts">
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import type { WikiIndex } from '@/types/wiki'

const props = defineProps<{ categoryName: string }>()

const wikiIndex = inject<WikiIndex>('wikiIndex')!

const category = computed(() =>
  wikiIndex.categories.find((c) => c.name === decodeURIComponent(props.categoryName)),
)

const totalCount = computed(() => {
  if (!category.value) return 0
  return (
    category.value.articles.length +
    category.value.subcategories.reduce((n, s) => n + s.articles.length, 0)
  )
})
</script>

<template>
  <main v-if="category" class="category-view">
    <div class="category-header">
      <RouterLink to="/" class="breadcrumb">Wiki</RouterLink>
      <span class="breadcrumb-sep">›</span>
      <h1>{{ category.name }}</h1>
      <span class="entity-count">{{ totalCount }} articles</span>
    </div>

    <!-- Root-level articles (no subcategory) -->
    <div v-if="category.articles.length" class="entity-section">
      <div
        v-if="category.subcategories.length"
        class="section-label"
      >General</div>
      <div class="entity-grid">
        <RouterLink
          v-for="article in category.articles"
          :key="article.filePath"
          :to="article.path"
          class="entity-card"
        >
          <span class="entity-name">{{ article.title }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Subcategory groups -->
    <div
      v-for="sub in category.subcategories"
      :key="sub.name"
      class="entity-section"
    >
      <div class="section-label">{{ sub.name }}</div>
      <div class="entity-grid">
        <RouterLink
          v-for="article in sub.articles"
          :key="article.filePath"
          :to="article.path"
          class="entity-card"
        >
          <span class="entity-name">{{ article.title }}</span>
        </RouterLink>
      </div>
    </div>
  </main>

  <main v-else class="category-view not-found">
    <p>Category not found.</p>
    <RouterLink to="/">← Back to home</RouterLink>
  </main>
</template>

<style scoped>
.category-view {
  padding: 2.5rem 3rem 4rem;
  max-width: 960px;
}

.category-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.breadcrumb {
  font-size: 0.875rem;
  color: var(--text);
  text-decoration: none;
  transition: color 0.15s;
}

.breadcrumb:hover {
  color: var(--accent);
}

.breadcrumb-sep {
  color: var(--border);
  font-size: 0.875rem;
}

.category-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-h);
  margin: 0;
}

.entity-count {
  font-size: 0.8rem;
  color: var(--text);
  margin-left: 0.25rem;
}

.entity-section {
  margin-bottom: 2.5rem;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.625rem;
}

.entity-card {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.125rem;
  border: 1px solid var(--border);
  border-radius: 7px;
  text-decoration: none;
  background: var(--bg);
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}

.entity-card:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
  transform: translateY(-1px);
}

.entity-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-h);
  line-height: 1.35;
}

.not-found {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.not-found a {
  color: var(--accent);
  text-decoration: none;
}

@media (max-width: 768px) {
  .category-view {
    padding: 1.5rem 1.25rem 3rem;
  }

  .entity-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
