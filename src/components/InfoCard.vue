<script setup lang="ts">
import type { InfoRow } from '@/utils/parseInfoTable'

defineProps<{ rows: InfoRow[] }>()
</script>

<template>
  <aside class="info-card">
    <template v-for="(row, i) in rows" :key="i">
      <div v-if="row.type === 'section'" class="info-section">{{ row.key }}</div>
      <div v-else class="info-row">
        <span class="info-key">{{ row.key }}</span>
        <span class="info-value">{{ row.value ?? '—' }}</span>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.info-card {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--header-height) + 1.5rem);
  align-self: flex-start;
  margin-top: 2.5rem;
  margin-right: 2rem;

  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  font-size: 0.8rem;
}

.info-section {
  padding: 0.45rem 0.875rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text);
  background: var(--code-bg);
  border-top: 1px solid var(--border);
}

.info-section:first-child {
  border-top: none;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.875rem;
  border-top: 1px solid var(--border);
  line-height: 1.4;
}

.info-row:first-child {
  border-top: none;
}

.info-key {
  flex: 0 0 45%;
  color: var(--text);
  font-style: italic;
}

.info-value {
  flex: 1;
  color: var(--text-h);
  font-weight: 500;
  word-break: break-word;
}
</style>
