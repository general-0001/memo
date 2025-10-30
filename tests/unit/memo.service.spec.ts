import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemoEntry } from '@/shared/types/memo'
import {
  reorderMemo,
  type ReorderMemoResult,
} from '@/features/memos/application/services/memo.service'
import {
  setMemoRepository,
  type MemoRepositoryPort,
} from '@/features/memos/application/ports/memo.repository'

class InMemoryMemoRepository implements MemoRepositoryPort {
  constructor(initial: MemoEntry[] = []) {
    this.memos = initial.map((entry) => ({ ...entry }))
  }

  private memos: MemoEntry[]

  async fetchAll(): Promise<MemoEntry[]> {
    return this.memos.slice()
  }

  async fetchByCategory(categoryId: string): Promise<MemoEntry[]> {
    return this.memos
      .filter((memo) => memo.categoryId === categoryId)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async findById(id: string): Promise<MemoEntry | undefined> {
    return this.memos.find((memo) => memo.id === id)
  }

  async create(entity: MemoEntry): Promise<MemoEntry> {
    this.upsert(entity)
    return entity
  }

  async update(entity: MemoEntry): Promise<MemoEntry> {
    this.upsert(entity)
    return entity
  }

  async updateMany(entities: MemoEntry[]): Promise<void> {
    entities.forEach((entity) => this.upsert(entity))
  }

  async delete(id: string): Promise<void> {
    this.memos = this.memos.filter((memo) => memo.id !== id)
  }

  async deleteByCategory(categoryId: string): Promise<void> {
    this.memos = this.memos.filter((memo) => memo.categoryId !== categoryId)
  }

  async getHighestSortOrder(categoryId: string): Promise<number | null> {
    const target = this.memos.filter((memo) => memo.categoryId === categoryId)
    if (target.length === 0) {
      return null
    }
    return Math.max(...target.map((memo) => memo.sortOrder))
  }

  private upsert(entity: MemoEntry) {
    const index = this.memos.findIndex((memo) => memo.id === entity.id)
    if (index === -1) {
      this.memos.push({ ...entity })
    } else {
      this.memos[index] = { ...entity }
    }
  }
}

const createMemo = (overrides: Partial<MemoEntry>): MemoEntry => ({
  id: 'memo-id',
  categoryId: 'cat-a',
  title: 'Memo',
  body: '',
  icon: '',
  tags: [],
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('reorderMemo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reorders memos within the same category', async () => {
    const repository = new InMemoryMemoRepository([
      createMemo({ id: 'm1', sortOrder: 0 }),
      createMemo({ id: 'm2', sortOrder: 1 }),
      createMemo({ id: 'm3', sortOrder: 2 }),
    ])
    setMemoRepository(repository)

    const result = await reorderMemo({
      memoId: 'm3',
      sourceCategoryId: 'cat-a',
      targetCategoryId: 'cat-a',
      targetIndex: 1,
    })

    expect(result.sourceCategoryId).toBe('cat-a')
    expect(result.targetCategoryId).toBe('cat-a')
    expect(result.targetMemos.map((memo) => memo.id)).toEqual(['m1', 'm3', 'm2'])
    expect(result.targetMemos.map((memo) => memo.sortOrder)).toEqual([0, 1, 2])
  })

  it('moves memo across categories and normalizes sort order', async () => {
    const repository = new InMemoryMemoRepository([
      createMemo({ id: 'm1', sortOrder: 0, categoryId: 'cat-a' }),
      createMemo({ id: 'm2', sortOrder: 1, categoryId: 'cat-a' }),
      createMemo({ id: 'm3', sortOrder: 0, categoryId: 'cat-b' }),
    ])
    setMemoRepository(repository)

    const result: ReorderMemoResult = await reorderMemo({
      memoId: 'm1',
      sourceCategoryId: 'cat-a',
      targetCategoryId: 'cat-b',
      targetIndex: 1,
    })

    expect(result.sourceCategoryId).toBe('cat-a')
    expect(result.targetCategoryId).toBe('cat-b')
    expect(result.sourceMemos.map((memo) => ({ id: memo.id, order: memo.sortOrder }))).toEqual([
      { id: 'm2', order: 0 },
    ])
    expect(result.targetMemos.map((memo) => ({ id: memo.id, categoryId: memo.categoryId, order: memo.sortOrder }))).toEqual(
      [
        { id: 'm3', categoryId: 'cat-b', order: 0 },
        { id: 'm1', categoryId: 'cat-b', order: 1 },
      ],
    )
  })
})
