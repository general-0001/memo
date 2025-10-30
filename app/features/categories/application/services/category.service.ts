import type { MemoCategory } from '@/shared/types/memo'
import { createCategoryEntity, updateCategoryEntity } from '../../domain/category.factory'
import { getCategoryRepository } from '../ports/category.repository'

export const fetchAllCategories = async (): Promise<MemoCategory[]> => {
  const repository = getCategoryRepository()
  return repository.fetchAll()
}

export const createCategory = async (payload: Partial<MemoCategory>): Promise<MemoCategory> => {
  const repository = getCategoryRepository()
  const category = createCategoryEntity(payload)
  return repository.create(category)
}

export const updateCategory = async (
  id: string,
  payload: Partial<MemoCategory>,
): Promise<MemoCategory | null> => {
  const repository = getCategoryRepository()
  const current = await repository.findById(id)
  if (!current) {
    return null
  }

  const next = updateCategoryEntity(current, payload)
  return repository.update(next)
}

export const deleteCategory = async (id: string): Promise<void> => {
  const repository = getCategoryRepository()
  await repository.delete(id)
}
