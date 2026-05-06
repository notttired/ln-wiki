<script setup lang="ts">
defineProps<{ html: string }>()
</script>

<template>
  <article class="article-body" v-html="html" />
</template>

<style scoped>
.article-body {
  padding: 2.5rem 3rem 4rem;
  max-width: 780px;
  color: var(--text);
  line-height: 1.75;
}

.article-body :deep(h1) {
  font-size: 1.875rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-h);
  margin: 0 0 0.25rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--border);
}

.article-body :deep(h2) {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--text-h);
  margin: 2rem 0 0.6rem;
  letter-spacing: -0.02em;
}

.article-body :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-h);
  margin: 1.5rem 0 0.4rem;
}

.article-body :deep(p) {
  margin: 0.75rem 0;
}

.article-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
}

.article-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

.article-body :deep(code) {
  font-family: var(--mono);
  font-size: 0.875em;
  background: var(--code-bg);
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--text-h);
}

.article-body :deep(blockquote) {
  border-left: 3px solid var(--accent-border);
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  color: var(--text);
  background: var(--accent-bg);
  border-radius: 0 4px 4px 0;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

.article-body :deep(li) {
  margin: 0.3rem 0;
}

.article-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.25rem 0;
  font-size: 0.9rem;
}

.article-body :deep(th),
.article-body :deep(td) {
  border: 1px solid var(--border);
  padding: 7px 14px;
  text-align: left;
}

.article-body :deep(th) {
  background: var(--code-bg);
  font-weight: 600;
  color: var(--text-h);
}

.article-body :deep(tr:nth-child(even)) {
  background: rgba(0, 0, 0, 0.02);
}

@media (prefers-color-scheme: dark) {
  .article-body :deep(tr:nth-child(even)) {
    background: rgba(255, 255, 255, 0.02);
  }
}

@media (max-width: 768px) {
  .article-body {
    padding: 1.5rem 1.25rem 3rem;
  }
}
</style>
