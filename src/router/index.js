import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import( '../views/Home.vue')
  },
  {
    path: '/create',
    name: 'Create',
    component: () => import('../views/Create.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/manage/:uuid',
    name: 'Manage',
    component: () => import('../views/Manage.vue')
  },
  {
    path: '/join/:uuid',
    name: 'Join',
    component: () => import('../views/Join.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
