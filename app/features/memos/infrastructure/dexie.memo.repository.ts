import type { MemoEntry } from '@/shared/types/memo'
import { useMemoDexie } from '@/features/app/infrastructure/memoDexie.client'
import { setMemoRepository, type MemoRepositoryPort } from '../application/ports/memo.repository'

const createDexieMemoRepository = (): MemoRepositoryPort => ({
  async fetchAll(): Promise<MemoEntry[]> {
    const db = useMemoDexie()
    return db.memos.orderBy('createdAt').toArray()
  },

  async fetchByCategory(categoryId: string): Promise<MemoEntry[]> {
    const db = useMemoDexie()
    return db.memos.where('categoryId').equals(categoryId).sortBy('createdAt')
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

  async delete(id: string): Promise<void> {
    const db = useMemoDexie()
    await db.memos.delete(id)
  },

  async deleteByCategory(categoryId: string): Promise<void> {
    const db = useMemoDexie()
    await db.memos.where('categoryId').equals(categoryId).delete()
  },
})

export const registerDexieMemoRepository = () => {
  setMemoRepository(createDexieMemoRepository())
}
