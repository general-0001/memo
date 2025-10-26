import { useMemoAppStore } from '@/features/app/application/memoApp.store'

export default defineNuxtPlugin(() => {
  const store = useMemoAppStore()
  store.initialize()
})
