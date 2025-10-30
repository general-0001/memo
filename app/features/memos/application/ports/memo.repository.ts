import type { MemoEntry } from '@/shared/types/memo'

export interface MemoRepositoryPort {
  fetchAll(): Promise<MemoEntry[]>
  fetchByCategory(categoryId: string): Promise<MemoEntry[]>
  findById(id: string): Promise<MemoEntry | undefined>
  create(entity: MemoEntry): Promise<MemoEntry>
  update(entity: MemoEntry): Promise<MemoEntry>
  updateMany(entities: MemoEntry[]): Promise<void>
  delete(id: string): Promise<void>
  deleteByCategory(categoryId: string): Promise<void>
  getHighestSortOrder(categoryId: string): Promise<number | null>
}

let memoRepository: MemoRepositoryPort | null = null

export const setMemoRepository = (repository: MemoRepositoryPort) => {
  memoRepository = repository
}

export const getMemoRepository = (): MemoRepositoryPort => {
  if (!memoRepository) {
    throw new Error('MemoRepositoryPort is not configured')
  }
  return memoRepository
}
