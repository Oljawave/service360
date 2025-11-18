import { createRouter, createWebHistory } from 'vue-router'
import ServicedObjects from '@/views/ServicedObjects.vue'
import OrgStructure from '@/views/OrgStructure.vue'
import Login from '@/views/Login.vue'
import Tools from '@/views/Tools.vue'
import Equipment from '@/views/Equipment.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/objects',
    name: 'ServicedObjects',
    component: ServicedObjects
  },
  {
    path: '/resources/tools',
    name: 'Tools',
    component: Tools
  },
  {
    path: '/resources/equipment',
    name: 'Equipment',
    component: Equipment
  },
  {
    path: '/organization',
    name: 'OrgStructure',
    component: OrgStructure
  },
];


const router = createRouter({
  history: createWebHistory('/dtj/service/'),
  routes
})

export default router
