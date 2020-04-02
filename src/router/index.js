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
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/manage/:uuid',
    name: 'Manage',
    component: () => import('../views/Manage.vue')
  },
  {
    path: '/poll/:uuid',
    name: 'poll',
    component: () => import('../views/Poll.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
