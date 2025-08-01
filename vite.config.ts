import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(pkg.version)
  },
  plugins: [vue(), vueJsx(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  preview: {
    allowedHosts: ['meeting.bpkadprovjabar.page'],
  },
})
