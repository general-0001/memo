import { useMemoAppStore } from '@/features/app'
import { registerDexieCategoryRepository } from '@/features/categories/infrastructure'
import { registerDexieMemoRepository } from '@/features/memos/infrastructure'

export default defineNuxtPlugin(() => {
  registerDexieCategoryRepository()
  registerDexieMemoRepository()
  const store = useMemoAppStore()
  store.initialize()
})
