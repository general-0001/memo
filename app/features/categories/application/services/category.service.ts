import type { MemoCategory } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'
import { getCategoryRepository } from '../ports/category.repository'

const buildCategory = (entity: Partial<MemoCategory>): MemoCategory => {
  const now = new Date().toISOString()
  return {
    id: entity.id ?? crypto.randomUUID(),
    title: entity.title ?? '',
    body: entity.body ?? '',
    icon: entity.icon ?? 'material-symbols:folder-open-rounded',
    tags: extractTags(`${entity.title ?? ''} ${entity.body ?? ''}`),
    createdAt: entity.createdAt ?? now,
    updatedAt: now,
  }
}

export const fetchAllCategories = async (): Promise<MemoCategory[]> => {
  const repository = getCategoryRepository()
  return repository.fetchAll()
}

export const createCategory = async (payload: Partial<MemoCategory>): Promise<MemoCategory> => {
  const repository = getCategoryRepository()
  const category = buildCategory({
    ...payload,
    tags: extractTags(`${payload.title ?? ''} ${payload.body ?? ''}`),
  })
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

  const next: MemoCategory = {
    ...current,
    ...payload,
    tags: extractTags(`${payload.title ?? current.title} ${payload.body ?? current.body}`),
    updatedAt: new Date().toISOString(),
  }
  return repository.update(next)
}

export const deleteCategory = async (id: string): Promise<void> => {
  const repository = getCategoryRepository()
  await repository.delete(id)
}
