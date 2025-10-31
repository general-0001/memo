import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: '/memo/',
  },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxt/icon'],
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
  icon: {
    serverBundle: {
      collections: ['material-symbols'],
    },
    mode: 'css',
  },
  nitro: {
    preset: 'github_pages',
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vueuse: {
    ssrHandlers: true,
  },
})
