<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CategoryNode } from '@/types/wiki'

defineProps<{ category: CategoryNode }>()
</script>

<template>
  <details class="category-node" open>
    <summary class="category-summary">
      <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ category.name }}
    </summary>

    <div class="category-items">
      <!-- Root-level articles in this category -->
      <RouterLink
        v-for="article in category.articles"
        :key="article.filePath"
        :to="article.path"
        class="nav-article"
      >
        {{ article.title }}
      </RouterLink>

      <!-- Subcategories -->
      <details
        v-for="sub in category.subcategories"
        :key="sub.name"
        class="subcategory-node"
        open
      >
        <summary class="subcategory-summary">
          <svg class="chevron" width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ sub.name }}
        </summary>
        <RouterLink
          v-for="article in sub.articles"
          :key="article.filePath"
          :to="article.path"
          class="nav-article nav-article-sub"
        >
          {{ article.title }}
        </RouterLink>
      </details>
    </div>
  </details>
</template>

<style scoped>
.category-node {
  border: none;
}

.category-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text);
  list-style: none;
  user-select: none;
  border-radius: 4px;
  transition: color 0.15s;
}

.category-summary::-webkit-details-marker {
  display: none;
}

.category-summary:hover {
  color: var(--text-h);
}

.chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}

details[open] > summary .chevron {
  transform: rotate(0deg);
}

details:not([open]) > summary .chevron {
  transform: rotate(-90deg);
}

.category-items {
  padding-left: 0;
}

.subcategory-node {
  border: none;
}

.subcategory-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px 4px 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
  list-style: none;
  user-select: none;
  transition: color 0.15s;
}

.subcategory-summary::-webkit-details-marker {
  display: none;
}

.subcategory-summary:hover {
  color: var(--text-h);
}

.nav-article {
  display: block;
  padding: 4px 12px 4px 28px;
  font-size: 0.8rem;
  color: var(--text);
  text-decoration: none;
  border-left: 2px solid transparent;
  border-radius: 0 4px 4px 0;
  transition: color 0.1s, background 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-article-sub {
  padding-left: 36px;
}

.nav-article:hover {
  color: var(--text-h);
  background: var(--code-bg);
}

.nav-article.router-link-active {
  color: var(--accent);
  border-left-color: var(--accent);
  background: var(--accent-bg);
  font-weight: 500;
}
</style>
