import { useMemoAppStore } from '@/features/app'
import { registerMemoInfrastructure } from '@/composition/registerMemoInfrastructure'

export default defineNuxtPlugin(async () => {
  await registerMemoInfrastructure()
  const store = useMemoAppStore()
  await store.initialize()
})
