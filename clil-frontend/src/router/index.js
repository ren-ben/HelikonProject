import { createRouter, createWebHistory } from 'vue-router'

// Lazy-loaded Komponenten für bessere Performance
const Dashboard = () => import('@/views/Dashboard.vue')
const CreateMaterial = () => import('@/views/CreateMaterial.vue')
const EditMaterial = () => import('@/views/EditMaterial.vue')
const MaterialsList = () => import('@/views/MaterialsList.vue')
const MaterialDetails = () => import('@/views/MaterialDetails.vue')
const TemplateLibrary = () => import('@/views/TemplateLibrary.vue')
const Settings = () => import('@/views/Settings.vue')
const NotFound = () => import('@/views/NotFound.vue')
const MaterialsGrid = () => import('@/views/MaterialsGrid.vue') // Import hinzugefügt

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/create',
    name: 'create',
    component: CreateMaterial,
    props: route => ({ templateId: route.query.template, type: route.query.type }),
    meta: { title: 'Neues Material erstellen' }
  },
  {
    path: '/edit/:id',
    name: 'edit',
    component: EditMaterial,
    props: route => ({ id: route.params.id }),
    meta: { title: 'Material bearbeiten' }
  },
  {
    path: '/materials',
    component: MaterialsList,
    meta: { title: 'Meine Materialien' },
    children: [
      {
        path: '',
        name: 'materials',
        component: MaterialsGrid // Korrigierter Komponentenname
      },
      {
        path: ':id',
        name: 'material-details',
        component: MaterialDetails,
        props: true
      }
    ]
  },
  {
    path: '/templates',
    name: 'templates',
    component: TemplateLibrary,
    meta: { title: 'Vorlagenbibliothek' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { title: 'Einstellungen' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: '404 - Seite nicht gefunden' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Global error handler für Router
router.onError((error) => {
  console.error('Router error:', error)
  // Fallback to home if component loading fails
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.href = '/'
  }
})

// Navigation Guards mit besserem Error Handling
router.beforeEach(async (to, from, next) => {
  try {
    // Dynamischen Titel setzen
    document.title = to.meta.title ? `${to.meta.title} | CLIL-KI-Tool` : 'CLIL-KI-Tool'
    
    // Überprüfe ob die Route existiert
    if (!to.matched.length) {
      console.warn('No matching route found for:', to.path)
      next({ name: 'not-found' })
      return
    }
    
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)
    next(false)
  }
})

// Globaler after hook für debugging
router.afterEach((to, from) => {
  console.log('Navigation completed:', from.path, '->', to.path)
})

export default router 