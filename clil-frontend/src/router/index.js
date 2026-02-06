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
const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Anmelden', noLayout: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { title: 'Registrieren', noLayout: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard', requiresAuth: true }
  },
  {
    path: '/create',
    name: 'create',
    component: CreateMaterial,
    props: route => ({ templateId: route.query.template, type: route.query.type }),
    meta: { title: 'Neues Material erstellen', requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'edit',
    component: EditMaterial,
    props: route => ({ id: route.params.id }),
    meta: { title: 'Material bearbeiten', requiresAuth: true }
  },
  {
    path: '/materials',
    component: MaterialsList,
    meta: { title: 'Meine Materialien', requiresAuth: true },
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
    meta: { title: 'Vorlagenbibliothek', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { title: 'Einstellungen', requiresAuth: true }
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

// Navigation Guards mit Auth-Prüfung
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

    const isAuthenticated = !!localStorage.getItem('accessToken')

    // Geschützte Route ohne Token → Login
    if (to.meta.requiresAuth && !isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // Bereits eingeloggt → nicht nochmal Login/Register zeigen
    if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
      next({ name: 'dashboard' })
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
