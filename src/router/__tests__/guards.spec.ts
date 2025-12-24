import { describe, it, expect, vi, beforeEach } from 'vitest'

import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Mock components to avoid loading real views
vi.mock('@/views/LoginView.vue', () => ({ default: { template: '<div>Login</div>' } }))
vi.mock('@/views/DashboardView.vue', () => ({ default: { template: '<div>Dashboard</div>' } }))
// ... other mocks if needed

describe('Router Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    router.push('/')
  })

  it('redirects to login if not authenticated', async () => {
    const authStore = useAuthStore()
    authStore.token = null

    try {
      await router.push({ name: 'dashboard' })
    } catch {
      // Router might throw on redirect, or just complete
    }

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('allows access if authenticated', async () => {
    const authStore = useAuthStore()
    authStore.token = 'fake-token' // Set directly or use .setToken

    // We assume fetchUser is not needed for the guard itself (it checks token mainly),
    // unless requiresPermission is set. Dashboard only requiresAuth.

    try {
      await router.push({ name: 'dashboard' })
    } catch {}

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects to dashboard if already logged in and visiting login', async () => {
    const authStore = useAuthStore()
    authStore.token = 'fake-token'

    await router.push({ name: 'login' })
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
