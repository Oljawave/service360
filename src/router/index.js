import { createRouter, createWebHistory } from 'vue-router'
import ServicedObjects from '../views/ServicedObjects.vue'
import OrgStructure from '../views/OrgStructure.vue';
import Login from '../views/Login.vue';
import WorkPlan from '@/views/WorkPlan.vue';
import Inspections from '@/views/Inspections.vue';
import WorkPlanForm from '@/views/WorkPlanForm.vue';

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
    path: '/work-plan',
    name: 'WorkPlan',
    component: WorkPlan
  },
  {
    path: '/inspections',
    name: 'Inspections',
    component: Inspections
  },
  {
    path: '/inspections/record',
    name: 'InspectionRecord',
    component: WorkPlanForm
  },
  {
    path: '/objects',
    name: 'ServicedObjects',
    component: ServicedObjects
  },
  {
    path: '/organization',
    name: 'OrgStructure',
    component: OrgStructure
  }
];


const router = createRouter({
  history: createWebHistory('/dtj/service/'),
  routes
})

export default router
