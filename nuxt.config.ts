import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],
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
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vueuse: {
    ssrHandlers: true,
  },
})
