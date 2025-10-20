import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],
  devtools: {
    enabled: true,
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {},
  },
  sourcemap: {
    // Tailwind CSS v4 build plugin skips production sourcemaps (see tailwindlabs/tailwindcss#13694)
    server: false,
  },
  compatibilityDate: '2025-10-20',
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vueuse: {
    ssrHandlers: true,
  },
})
