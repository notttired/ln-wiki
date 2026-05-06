<script setup lang="ts">
import { ref, inject } from 'vue'
import type { WikiIndex } from '@/types/wiki'
import CategoryNode from './CategoryNode.vue'
import SearchResults from './SearchResults.vue'

inject<WikiIndex>('wikiIndex')

const wikiIndex = inject<WikiIndex>('wikiIndex')!
const searchQuery = ref('')

defineEmits<{ close: [] }>()
</script>

<template>
  <aside class="app-sidebar">
    <div class="search-wrap">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search..."
        class="search-input"
        aria-label="Search articles"
      />
    </div>

    <nav class="sidebar-nav" aria-label="Wiki navigation">
      <SearchResults
        v-if="searchQuery.trim()"
        :query="searchQuery"
        :articles="wikiIndex.allArticles"
        @clear="searchQuery = ''"
      />
      <template v-else>
        <CategoryNode
          v-for="category in wikiIndex.categories"
          :key="category.name"
          :category="category"
        />
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: sticky;
  top: var(--header-height);
  height: calc(100svh - var(--header-height));
  overflow-y: auto;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.search-wrap {
  padding: 0.75rem 0.75rem 0.5rem;
  position: sticky;
  top: 0;
  background: var(--bg-2);
  z-index: 1;
  border-bottom: 1px solid var(--border);
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-family: var(--sans);
  color: var(--text-h);
  outline: none;
  transition: border-color 0.15s;
}

.search-input::placeholder {
  color: var(--text);
}

.search-input:focus {
  border-color: var(--accent-border);
}

.sidebar-nav {
  padding: 0.5rem 0 1rem;
  flex: 1;
}
</style>
