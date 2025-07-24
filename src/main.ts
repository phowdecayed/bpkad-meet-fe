import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.headers.common['Accept'] = 'application/json'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

async function initializeApp() {
  try {
    if (authStore.token) {
      await authStore.fetchUser()
    }
  }
  catch (error) {
    // Token might be invalid, clear it
    authStore.logout()
  }
  finally {
    app.mount('#app')
  }
}

initializeApp()
