import type { MemoEntry } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'

interface MemoDraft {
  id?: string
  categoryId: string
  title?: string
  body?: string
  icon?: string
  sortOrder: number
  createdAt?: string
}

const DEFAULT_ICON = 'material-symbols:note-alt-rounded'

export const createMemoEntity = (draft: MemoDraft): MemoEntry => {
  const now = new Date().toISOString()
  return {
    id: draft.id ?? crypto.randomUUID(),
    categoryId: draft.categoryId,
    title: draft.title ?? '',
    body: draft.body ?? '',
    icon: draft.icon ?? DEFAULT_ICON,
    tags: extractTags(`${draft.title ?? ''} ${draft.body ?? ''}`),
    sortOrder: draft.sortOrder,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  }
}

export const updateMemoEntity = (current: MemoEntry, changes: Partial<Omit<MemoEntry, 'id'>>): MemoEntry => {
  const nextTitle = changes.title ?? current.title
  const nextBody = changes.body ?? current.body

  return {
    ...current,
    ...changes,
    title: nextTitle,
    body: nextBody,
    icon: changes.icon ?? current.icon ?? DEFAULT_ICON,
    tags: extractTags(`${nextTitle} ${nextBody}`),
    sortOrder: changes.sortOrder ?? current.sortOrder,
    updatedAt: new Date().toISOString(),
  }
}
