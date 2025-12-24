/**
 * @file This is the main entry point for the BPKAD Zoom Vue application.
 * It initializes the Vue app, Pinia for state management, and Axios for HTTP requests.
 * It also handles authentication and CSRF protection.
 * @author BPKAD
 * @version 1.0.0
 */

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

/**
 * The Vue application instance.
 * @type {object}
 */
const app = createApp(App)

/**
 * The Pinia instance for state management.
 * @type {object}
 */
const pinia = createPinia()

app.use(pinia)
app.use(router)

/**
 * The authentication store.
 * @type {object}
 */
const authStore = useAuthStore()

/**
 * Initializes the application.
 * This function gets the CSRF token, fetches the user if a token exists, and mounts the app.
 * If the token is invalid, it logs out the user.
 * @returns {Promise<void>}
 */
import { toast } from 'vue-sonner'

/**
 * Initializes the application.
 * This function gets the CSRF token, fetches the user if a token exists, and mounts the app.
 * If the token is invalid, it logs out the user.
 * @returns {Promise<void>}
 */
async function initializeApp() {
  let initError = null
  try {
    // Always get CSRF token on app initialization
    await authStore.getCsrfToken()

    if (authStore.token) {
      await authStore.fetchUser()
    }
  } catch (error) {
    // Token might be invalid or server down, clear it locally
    authStore.clearAuth()
    initError = error
  } finally {
    app.mount('#app')

    // Hide splash screen with fade effect
    const splashScreen = document.getElementById('splash-screen')
    if (splashScreen) {
      splashScreen.classList.add('fade-out')
      setTimeout(() => splashScreen.remove(), 400)
    }

    if (initError) {
      // Use setTimeout to ensure Toaster is mounted and ready to receive event
      setTimeout(() => {
        toast.error('Connection Failed', {
          description:
            'Could not connect to the server. Please check your internet or try again later.',
          duration: Infinity, // Keep it visible until dismissed
        })
      }, 100)
    }
  }
}

initializeApp()
