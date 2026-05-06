<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ArticleMeta } from '@/types/wiki'

const props = defineProps<{ query: string; articles: ArticleMeta[] }>()
const emit = defineEmits<{ clear: [] }>()

const results = computed(() => {
  const q = props.query.toLowerCase()
  return props.articles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 50)
})
</script>

<template>
  <div class="search-results">
    <div v-if="results.length === 0" class="no-results">No results</div>
    <RouterLink
      v-for="article in results"
      :key="article.filePath"
      :to="article.path"
      class="result-item"
      @click="emit('clear')"
    >
      <span class="result-title">{{ article.title }}</span>
      <span class="result-category">{{ article.category }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.search-results {
  padding: 0.5rem 0;
}

.no-results {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: var(--text);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.1s;
}

.result-item:hover {
  background: var(--accent-bg);
}

.result-title {
  font-size: 0.875rem;
  color: var(--text-h);
  font-weight: 500;
}

.result-category {
  font-size: 0.75rem;
  color: var(--text);
}
</style>
