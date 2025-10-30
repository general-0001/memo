import Dexie, { type Table, type Transaction } from 'dexie'
import type { AppSettings, MemoCategory, MemoEntry } from '@/shared/types/memo'

class MemoDexie extends Dexie {
  categories!: Table<MemoCategory, string>
  memos!: Table<MemoEntry, string>
  settings!: Table<AppSettings, string>
}

let clientDb: MemoDexie | null = null

const normalizeMemoSortOrderInternal = async (
  entries: MemoEntry[],
  put: (entry: MemoEntry) => Promise<string | number | void>,
) => {
  const grouped = new Map<string, MemoEntry[]>()

  for (const memo of entries) {
    const list = grouped.get(memo.categoryId) ?? []
    list.push(memo)
    grouped.set(memo.categoryId, list)
  }

  for (const [, items] of grouped) {
    const hasSortOrder = items.every((item) => typeof item.sortOrder === 'number')
    items.sort((a, b) => {
      if (hasSortOrder) {
        const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        if (diff !== 0) {
          return diff
        }
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
    let index = 0
    for (const item of items) {
      await put({
        ...item,
        sortOrder: index++,
      })
    }
  }
}

const applySortOrderMigration = async (transaction: Transaction) => {
  const memoTable = transaction.table<MemoEntry>('memos')
  const memos = await memoTable.toArray()
  await normalizeMemoSortOrderInternal(memos, (entry) => memoTable.put(entry))
}

export const useMemoDexie = (): MemoDexie => {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in the browser context')
  }

  if (!clientDb) {
    clientDb = new MemoDexie('memo_app_v1')
    clientDb.version(1).stores({
      categories: 'id, createdAt, updatedAt',
      memos: 'id, categoryId, createdAt, updatedAt',
      settings: 'id',
    })
    clientDb
      .version(2)
      .stores({
        categories: 'id, createdAt, updatedAt',
        memos: 'id, categoryId, sortOrder, createdAt, updatedAt, [categoryId+sortOrder]',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        await applySortOrderMigration(transaction)
      })
  }

  return clientDb
}

export const ensureMemoSortOrder = async (): Promise<void> => {
  const db = useMemoDexie()
  const memos = await db.memos.toArray()
  const requiresNormalization = memos.some((memo) => typeof memo.sortOrder !== 'number')
  if (!requiresNormalization) {
    return
  }

  await db.transaction('rw', db.memos, async () => {
    const fresh = await db.memos.toArray()
    await normalizeMemoSortOrderInternal(fresh, (entry) => db.memos.put(entry))
  })
}
