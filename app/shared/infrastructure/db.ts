import Dexie, { type Table } from 'dexie'
import type { AppSettings, MemoCategory, MemoEntry } from '../types/memo'

class MemoDexie extends Dexie {
  categories!: Table<MemoCategory, string>
  memos!: Table<MemoEntry, string>
  settings!: Table<AppSettings, string>
}

let clientDb: MemoDexie | null = null

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
  }

  return clientDb
}
