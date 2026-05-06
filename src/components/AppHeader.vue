<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineEmits<{ 'toggle-sidebar': [] }>()
</script>

<template>
  <header class="app-header">
    <button class="menu-btn" aria-label="Toggle sidebar" @click="$emit('toggle-sidebar')">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="2" y="8.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="2" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    </button>
    <RouterLink to="/" class="site-title">ln-wiki</RouterLink>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  grid-column: 1 / -1;
}

.site-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-h);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.site-title:hover {
  color: var(--accent);
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  padding: 4px;
  border-radius: 4px;
  line-height: 0;
}

.menu-btn:hover {
  color: var(--text-h);
  background: var(--code-bg);
}

@media (max-width: 768px) {
  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
