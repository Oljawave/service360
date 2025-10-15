import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue';
import ServicedObjects from '../views/ServicedObjects.vue'
import OrgStructure from '../views/OrgStructure.vue';
import Login from '../views/Login.vue';
import WorkPlan from '@/views/WorkPlan.vue';
import Inspections from '@/views/Inspections.vue';
import FaultJournalPage from '@/views/FaultJournalPage.vue';
import ParameterLogPage from '@/views/ParameterLogPage.vue';
import Incidents from '@/views/Incidents.vue';
import WorkPlanForm from '@/views/WorkPlanForm.vue';

const routes = [
  {
    path: '/main',
    name: 'Dashboard',
    component: Dashboard,
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
    path: '/parameters',
    name: 'Paramaters',
    component: ParameterLogPage
  },
  {
    path: '/defects',
    name: 'Defects',
    component: FaultJournalPage
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
  },
  {
    path: '/incidents',
    name: 'Incidents',
    component: Incidents
  },
];


const router = createRouter({
  history: createWebHistory('/dtj/service/'),
  routes
})

export default router
