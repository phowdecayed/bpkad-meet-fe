import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { requiresAuth: false },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { requiresAuth: false },
    },
    {
      path: '/email/verify',
      name: 'verify-email',
      component: VerifyEmailView,
      meta: { requiresAuth: false },
    },
    {
      path: '/app',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
          meta: { requiresPermission: 'manage settings' },
        },
      ],
    },
    // Catch-all route for 404 Not Found pages
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundView,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.requiresPermission && !authStore.hasPermission(to.meta.requiresPermission as string)) {
    // Optional: Redirect to a 'not-authorized' page or just the dashboard
    return next({ name: 'dashboard' })
  }

  if (['login', 'forgot-password', 'reset-password', 'verify-email'].includes(to.name as string) && isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router

