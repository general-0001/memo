import { registerDexieCategoryRepository } from '@/features/categories/infrastructure'
import { registerDexieMemoRepository } from '@/features/memos/infrastructure'
import { ensureMemoSortOrder } from '@/shared/infrastructure/memoDexie.client'

export const registerMemoInfrastructure = async () => {
  registerDexieCategoryRepository()
  registerDexieMemoRepository()
  await ensureMemoSortOrder()
}
