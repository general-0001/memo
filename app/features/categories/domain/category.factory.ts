import type { MemoCategory } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'

interface CategoryDraft {
  id?: string
  title?: string
  body?: string
  icon?: string
  createdAt?: string
}

const DEFAULT_ICON = 'material-symbols:folder-open-rounded'

export const createCategoryEntity = (draft: CategoryDraft): MemoCategory => {
  const now = new Date().toISOString()
  const title = draft.title ?? ''
  const body = draft.body ?? ''

  return {
    id: draft.id ?? crypto.randomUUID(),
    title,
    body,
    icon: draft.icon ?? DEFAULT_ICON,
    tags: extractTags(`${title} ${body}`),
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  }
}

export const updateCategoryEntity = (
  current: MemoCategory,
  changes: Partial<Omit<MemoCategory, 'id'>>,
): MemoCategory => {
  const title = changes.title ?? current.title
  const body = changes.body ?? current.body

  return {
    ...current,
    ...changes,
    title,
    body,
    icon: changes.icon ?? current.icon ?? DEFAULT_ICON,
    tags: extractTags(`${title} ${body}`),
    updatedAt: new Date().toISOString(),
  }
}
