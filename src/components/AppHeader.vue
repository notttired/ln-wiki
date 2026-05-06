<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useColorScheme } from '../composables/useColorScheme'

defineEmits<{ 'toggle-sidebar': [] }>()

const { scheme, toggle } = useColorScheme()
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
    <button class="theme-btn" :aria-label="scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggle">
      <svg v-if="scheme === 'dark'" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3.5" fill="currentColor" />
        <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="12.95" y1="3.05" x2="11.89" y2="4.11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="4.11" y1="11.89" x2="3.05" y2="12.95" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" fill="currentColor" />
      </svg>
    </button>
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

.theme-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  padding: 4px;
  border-radius: 4px;
  line-height: 0;
}

.theme-btn:hover {
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
