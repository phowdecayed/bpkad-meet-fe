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
import axios from 'axios'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

/**
 * The base URL for the API.
 * @type {string}
 */
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL

/**
 * The default headers for all Axios requests.
 * @type {object}
 */
axios.defaults.headers.common['Accept'] = 'application/json'

/**
 * Axios response interceptor to handle 401 Unauthorized errors.
 * If a 401 error is received, the user is logged out and redirected to the login page.
 * @param {object} response - The response object.
 * @returns {object} The response object.
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

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
