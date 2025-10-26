import type { MemoEntry } from '@/shared/types/memo'
import { extractTags } from '@/shared/utils/tags'
import { useMemoDexie } from '@/shared/infrastructure/db'

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
  const db = useMemoDexie()
  return db.memos.orderBy('createdAt').toArray()
}

export const fetchMemosByCategory = async (categoryId: string): Promise<MemoEntry[]> => {
  const db = useMemoDexie()
  return db.memos.where('categoryId').equals(categoryId).sortBy('createdAt')
}

export const createMemo = async (payload: Partial<MemoEntry> & { categoryId: string }): Promise<MemoEntry> => {
  const db = useMemoDexie()
  const memo = buildMemo(payload)
  await db.memos.put(memo)
  return memo
}

export const updateMemo = async (id: string, payload: Partial<MemoEntry>): Promise<MemoEntry | null> => {
  const db = useMemoDexie()
  const current = await db.memos.get(id)
  if (!current) {
    return null
  }

  const next: MemoEntry = {
    ...current,
    ...payload,
    tags: extractTags(`${payload.title ?? current.title} ${payload.body ?? current.body}`),
    updatedAt: new Date().toISOString(),
  }
  await db.memos.put(next)
  return next
}

export const deleteMemo = async (id: string): Promise<void> => {
  const db = useMemoDexie()
  await db.memos.delete(id)
}
