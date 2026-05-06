import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'color-scheme'

function getInitial(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

const scheme = ref<'light' | 'dark'>(getInitial())

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', scheme.value)
  localStorage.setItem(STORAGE_KEY, scheme.value)
})

export function useColorScheme() {
  function toggle() {
    scheme.value = scheme.value === 'dark' ? 'light' : 'dark'
  }
  return { scheme, toggle }
}
