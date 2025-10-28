import type { MemoCategory } from '@/shared/types/memo'

export interface CategoryRepositoryPort {
  fetchAll(): Promise<MemoCategory[]>
  findById(id: string): Promise<MemoCategory | undefined>
  create(entity: MemoCategory): Promise<MemoCategory>
  update(entity: MemoCategory): Promise<MemoCategory>
  delete(id: string): Promise<void>
}

let categoryRepository: CategoryRepositoryPort | null = null

export const setCategoryRepository = (repository: CategoryRepositoryPort) => {
  categoryRepository = repository
}

export const getCategoryRepository = (): CategoryRepositoryPort => {
  if (!categoryRepository) {
    throw new Error('CategoryRepositoryPort is not configured')
  }
  return categoryRepository
}
