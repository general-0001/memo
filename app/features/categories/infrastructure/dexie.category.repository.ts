import type { MemoCategory } from '@/shared/types/memo'
import { useMemoDexie } from '@/shared/infrastructure/memoDexie.client'
import { setCategoryRepository, type CategoryRepositoryPort } from '../application/ports/category.repository'

const createDexieCategoryRepository = (): CategoryRepositoryPort => ({
  async fetchAll(): Promise<MemoCategory[]> {
    const db = useMemoDexie()
    return db.categories.orderBy('createdAt').toArray()
  },

  async findById(id: string): Promise<MemoCategory | undefined> {
    const db = useMemoDexie()
    return db.categories.get(id) ?? undefined
  },

  async create(entity: MemoCategory): Promise<MemoCategory> {
    const db = useMemoDexie()
    await db.categories.put(entity)
    return entity
  },

  async update(entity: MemoCategory): Promise<MemoCategory> {
    const db = useMemoDexie()
    await db.categories.put(entity)
    return entity
  },

  async delete(id: string): Promise<void> {
    const db = useMemoDexie()
    await db.transaction('rw', db.categories, db.memos, async () => {
      await db.memos.where('categoryId').equals(id).delete()
      await db.categories.delete(id)
    })
  },
})

export const registerDexieCategoryRepository = () => {
  setCategoryRepository(createDexieCategoryRepository())
}
