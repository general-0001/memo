import type { MemoCategory, MemoEntry } from '../types/memo'
import type { AppSettings } from '../types/memo'
import { extractTags } from '../utils/tags'
import { useMemoDexie } from './db'

const iso = (date: Date) => date.toISOString()

const sampleCategories: MemoCategory[] = [
  {
    id: 'cat-inbox',
    title: 'Inbox',
    body: '気になったアイデアを素早く書き留めるための受け皿。#idea #inbox',
    icon: 'material-symbols:inbox-outline-rounded',
    tags: extractTags('気になったアイデアを素早く書き留めるための受け皿。#idea #inbox'),
    createdAt: iso(new Date('2024-12-20T08:00:00Z')),
    updatedAt: iso(new Date('2024-12-20T08:00:00Z')),
  },
  {
    id: 'cat-planning',
    title: 'Planning',
    body: '日次・週次計画や進捗メモ。#plan #workflow',
    icon: 'material-symbols:calendar-add-on-rounded',
    tags: extractTags('日次・週次計画や進捗メモ。#plan #workflow'),
    createdAt: iso(new Date('2024-12-22T05:30:00Z')),
    updatedAt: iso(new Date('2024-12-22T05:30:00Z')),
  },
  {
    id: 'cat-research',
    title: 'Research',
    body: 'リサーチ結果・リンク・読みたい記事を集約。#research #reading',
    icon: 'material-symbols:compost-rounded',
    tags: extractTags('リサーチ結果・リンク・読みたい記事を集約。#research #reading'),
    createdAt: iso(new Date('2024-12-25T03:00:00Z')),
    updatedAt: iso(new Date('2024-12-25T03:00:00Z')),
  },
]

const sampleMemos: MemoEntry[] = [
  {
    id: 'memo-clarify-flow',
    categoryId: 'cat-inbox',
    title: 'Memoアプリの画面フロー整理',
    body: '一覧→詳細/編集→カテゴリー詳細のパターンを踏襲。#memoapp #flow',
    icon: 'material-symbols:rule-rounded',
    tags: extractTags('一覧→詳細/編集→カテゴリー詳細のパターンを踏襲。#memoapp #flow'),
    createdAt: iso(new Date('2024-12-20T09:15:00Z')),
    updatedAt: iso(new Date('2024-12-20T10:00:00Z')),
  },
  {
    id: 'memo-sync',
    categoryId: 'cat-planning',
    title: '同期要件',
    body: 'BroadcastChannel で diff を投げ、IndexedDB を再読込する。#sync #realtime',
    icon: 'material-symbols:sync-rounded',
    tags: extractTags('BroadcastChannel で diff を投げ、IndexedDB を再読込する。#sync #realtime'),
    createdAt: iso(new Date('2024-12-22T06:00:00Z')),
    updatedAt: iso(new Date('2024-12-22T06:05:00Z')),
  },
  {
    id: 'memo-reading',
    categoryId: 'cat-research',
    title: 'IndexedDB best practice',
    body: 'Dexie を使って schema versioning。#indexeddb #dexie',
    icon: 'material-symbols:menu-book-rounded',
    tags: extractTags('Dexie を使って schema versioning。#indexeddb #dexie'),
    createdAt: iso(new Date('2024-12-25T04:10:00Z')),
    updatedAt: iso(new Date('2024-12-25T04:12:00Z')),
  },
]

export const seedSampleDataIfNeeded = async () => {
  const db = useMemoDexie()
  const setting = await db.settings.get('app')
  if (setting?.sampleSeeded) {
    return
  }

  await db.transaction('rw', db.categories, db.memos, db.settings, async () => {
    if ((await db.categories.count()) === 0) {
      await db.categories.bulkPut(sampleCategories)
    }
    if ((await db.memos.count()) === 0) {
      await db.memos.bulkPut(sampleMemos)
    }

    const payload: AppSettings = {
      id: 'app',
      sampleSeeded: true,
      lastSync: new Date().toISOString(),
    }
    await db.settings.put(payload)
  })
}
