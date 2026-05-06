<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import type { WikiIndex, ArticleMeta } from '@/types/wiki'

const wikiIndex = inject<WikiIndex>('wikiIndex')!
const totalArticles = wikiIndex.allArticles.length

const searchQuery = ref('')

const searchResults = computed<ArticleMeta[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return wikiIndex.allArticles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 60)
})

const isSearching = computed(() => searchQuery.value.trim().length > 0)
</script>

<template>
  <main class="home">
    <div class="home-hero">
      <h1>Wiki</h1>
      <p class="home-subtitle">{{ totalArticles }} articles across {{ wikiIndex.categories.length }} categories</p>
    </div>

    <div class="search-bar-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search entities..."
        class="search-bar"
        aria-label="Search all entities"
        autofocus
      />
      <button v-if="isSearching" class="clear-btn" @click="searchQuery = ''" aria-label="Clear search">✕</button>
    </div>

    <!-- Search results -->
    <template v-if="isSearching">
      <div v-if="searchResults.length === 0" class="no-results">No entities found for "{{ searchQuery }}"</div>
      <div v-else class="entity-grid">
        <RouterLink
          v-for="article in searchResults"
          :key="article.filePath"
          :to="article.path"
          class="entity-card"
        >
          <span class="entity-name">{{ article.title }}</span>
          <span class="entity-meta">{{ article.subcategory ?? article.category }}</span>
        </RouterLink>
      </div>
    </template>

    <!-- Category grid -->
    <template v-else>
      <div class="category-grid">
        <RouterLink
          v-for="cat in wikiIndex.categories"
          :key="cat.name"
          :to="'/category/' + encodeURIComponent(cat.name)"
          class="category-card"
        >
          <span class="category-card-name">{{ cat.name }}</span>
          <span class="category-card-count">
            {{ cat.articles.length + cat.subcategories.reduce((n, s) => n + s.articles.length, 0) }} articles
          </span>
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.home {
  padding: 3rem 3rem 4rem;
  max-width: 960px;
}

.home-hero {
  margin-bottom: 2rem;
}

.home-hero h1 {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.05em;
  margin: 0 0 0.4rem;
  color: var(--text-h);
}

.home-subtitle {
  color: var(--text);
  font-size: 0.95rem;
  margin: 0;
}

/* Search bar */
.search-bar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 480px;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  color: var(--text);
  pointer-events: none;
  flex-shrink: 0;
}

.search-bar {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 2.5rem;
  font-size: 0.9rem;
  font-family: var(--sans);
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-h);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-bar::placeholder {
  color: var(--text);
}

.search-bar:focus {
  border-color: var(--accent-border);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-size: 0.75rem;
  padding: 2px 4px;
  border-radius: 3px;
}

.clear-btn:hover {
  color: var(--text-h);
}

/* No results */
.no-results {
  color: var(--text);
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Entity grid (search results) */
.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.625rem;
}

.entity-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
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

.entity-meta {
  font-size: 0.75rem;
  color: var(--text);
}

/* Category grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.category-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
  background: var(--bg);
}

.category-card:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
}

.category-card-name {
  font-weight: 500;
  color: var(--text-h);
  font-size: 0.95rem;
}

.category-card-count {
  font-size: 0.8rem;
  color: var(--text);
}

@media (max-width: 768px) {
  .home {
    padding: 1.5rem 1.25rem 3rem;
  }

  .search-bar-wrap {
    max-width: 100%;
  }
}
</style>
