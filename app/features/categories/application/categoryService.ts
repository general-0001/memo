import type { MemoCategory } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'
import { useMemoDexie } from '@/shared/infrastructure/db'

const withTimestamps = (entity: Partial<MemoCategory>): MemoCategory => {
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
  const db = useMemoDexie()
  return db.categories.orderBy('createdAt').toArray()
}

export const createCategory = async (payload: Partial<MemoCategory>): Promise<MemoCategory> => {
  const db = useMemoDexie()
  const category = withTimestamps({
    ...payload,
    tags: extractTags(`${payload.title ?? ''} ${payload.body ?? ''}`),
  })
  await db.categories.put(category)
  return category
}

export const updateCategory = async (
  id: string,
  payload: Partial<MemoCategory>,
): Promise<MemoCategory | null> => {
  const db = useMemoDexie()
  const current = await db.categories.get(id)
  if (!current) {
    return null
  }
  const next: MemoCategory = {
    ...current,
    ...payload,
    tags: extractTags(`${payload.title ?? current.title} ${payload.body ?? current.body}`),
    updatedAt: new Date().toISOString(),
  }
  await db.categories.put(next)
  return next
}

export const deleteCategory = async (id: string): Promise<void> => {
  const db = useMemoDexie()
  await db.transaction('rw', db.categories, db.memos, async () => {
    await db.memos.where('categoryId').equals(id).delete()
    await db.categories.delete(id)
  })
}
