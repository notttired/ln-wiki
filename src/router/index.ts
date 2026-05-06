import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CategoryView from '@/views/CategoryView.vue'
import ArticleView from '@/views/ArticleView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/category/:categoryName', component: CategoryView, props: true },
    { path: '/wiki/:articlePath(.*)+', component: ArticleView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
