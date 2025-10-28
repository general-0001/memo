import type { MemoEntry } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'
import { getMemoRepository } from '../ports/memo.repository'

const buildMemo = (payload: Partial<MemoEntry> & { categoryId: string }): MemoEntry => {
  const now = new Date().toISOString()
  return {
    id: payload.id ?? crypto.randomUUID(),
    categoryId: payload.categoryId,
    title: payload.title ?? '',
    body: payload.body ?? '',
    icon: payload.icon ?? 'material-symbols:note-alt-rounded',
    tags: extractTags(`${payload.title ?? ''} ${payload.body ?? ''}`),
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  }
}

export const fetchAllMemos = async (): Promise<MemoEntry[]> => {
  const repository = getMemoRepository()
  return repository.fetchAll()
}

export const fetchMemosByCategory = async (categoryId: string): Promise<MemoEntry[]> => {
  const repository = getMemoRepository()
  return repository.fetchByCategory(categoryId)
}

export const createMemo = async (payload: Partial<MemoEntry> & { categoryId: string }): Promise<MemoEntry> => {
  const repository = getMemoRepository()
  const memo = buildMemo(payload)
  return repository.create(memo)
}

export const updateMemo = async (id: string, payload: Partial<MemoEntry>): Promise<MemoEntry | null> => {
  const repository = getMemoRepository()
  const current = await repository.findById(id)
  if (!current) {
    return null
  }

  const next: MemoEntry = {
    ...current,
    ...payload,
    tags: extractTags(`${payload.title ?? current.title} ${payload.body ?? current.body}`),
    updatedAt: new Date().toISOString(),
  }
  return repository.update(next)
}

export const deleteMemo = async (id: string): Promise<void> => {
  const repository = getMemoRepository()
  await repository.delete(id)
}
