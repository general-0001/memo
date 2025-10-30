import type { MemoEntry } from '@/shared/types/memo'
import { useMemoDexie } from '@/shared/infrastructure/memoDexie.client'
import { setMemoRepository, type MemoRepositoryPort } from '../application/ports/memo.repository'

const createDexieMemoRepository = (): MemoRepositoryPort => ({
  async fetchAll(): Promise<MemoEntry[]> {
    const db = useMemoDexie()
    return db.memos.orderBy('[categoryId+sortOrder]').toArray()
  },

  async fetchByCategory(categoryId: string): Promise<MemoEntry[]> {
    const db = useMemoDexie()
    return db.memos.where('categoryId').equals(categoryId).sortBy('sortOrder')
  },

  async findById(id: string): Promise<MemoEntry | undefined> {
    const db = useMemoDexie()
    return db.memos.get(id) ?? undefined
  },

  async create(entity: MemoEntry): Promise<MemoEntry> {
    const db = useMemoDexie()
    await db.memos.put(entity)
    return entity
  },

  async update(entity: MemoEntry): Promise<MemoEntry> {
    const db = useMemoDexie()
    await db.memos.put(entity)
    return entity
  },

  async updateMany(entities: MemoEntry[]): Promise<void> {
    const db = useMemoDexie()
    await db.transaction('rw', db.memos, async () => {
      await Promise.all(entities.map((entity) => db.memos.put(entity)))
    })
  },

  async delete(id: string): Promise<void> {
    const db = useMemoDexie()
    await db.memos.delete(id)
  },

  async deleteByCategory(categoryId: string): Promise<void> {
    const db = useMemoDexie()
    await db.memos.where('categoryId').equals(categoryId).delete()
  },

  async getHighestSortOrder(categoryId: string): Promise<number | null> {
    const db = useMemoDexie()
    const items = await db.memos.where('categoryId').equals(categoryId).sortBy('sortOrder')
    if (!items.length) {
      return null
    }
    const lastItem = items[items.length - 1]
    return typeof lastItem?.sortOrder === 'number' ? lastItem.sortOrder : null
  },
})

export const registerDexieMemoRepository = () => {
  setMemoRepository(createDexieMemoRepository())
}
