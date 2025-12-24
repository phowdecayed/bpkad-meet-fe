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
async function initializeApp() {
  try {
    // Always get CSRF token on app initialization
    await authStore.getCsrfToken()

    if (authStore.token) {
      await authStore.fetchUser()
    }
  } catch {
    // Token might be invalid, clear it
    authStore.logout()
  } finally {
    app.mount('#app')
  }
}

initializeApp()
