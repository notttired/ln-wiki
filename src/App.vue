<script setup lang="ts">
import { ref, provide } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import { wikiIndex } from './composables/useWikiIndex'

provide('wikiIndex', wikiIndex)

const sidebarOpen = ref(false)
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="layout">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    />

    <AppSidebar
      :class="{ 'sidebar-open': sidebarOpen }"
      @close="sidebarOpen = false"
    />

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) 1fr;
  min-height: 100svh;
}

.layout > .app-header {
  grid-column: 1 / -1;
  grid-row: 1;
}

.layout > .app-sidebar {
  grid-column: 1;
  grid-row: 2;
}

.layout > .content {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .layout > .content {
    grid-column: 1;
  }

  .layout > .app-sidebar {
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: var(--shadow);
  }

  .layout > .app-sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 199;
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>
