import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home', component: HelloWorld }],
})
