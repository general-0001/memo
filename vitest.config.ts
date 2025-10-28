import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: ['fake-indexeddb/auto'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
