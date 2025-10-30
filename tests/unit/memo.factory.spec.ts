import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoEntity, updateMemoEntity } from '@/features/memos/domain/memo.factory'

describe('Memo Factory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates memo with defaults and extracted tags', () => {
    const memo = createMemoEntity({
      categoryId: 'category-1',
      title: 'Hello #world',
      body: 'Details #info',
      sortOrder: 3,
    })

    expect(memo.id).toBeTruthy()
    expect(memo.sortOrder).toBe(3)
    expect(memo.tags).toEqual(['#world', '#info'])
    expect(memo.createdAt).toBeTruthy()
    expect(memo.updatedAt).toBeTruthy()
  })

  it('updates memo with merged fields and recalculated tags', () => {
    const existing = createMemoEntity({
      id: 'memo-1',
      categoryId: 'category-1',
      title: 'Initial',
      body: 'Initial body #first',
      sortOrder: 0,
    })

    vi.setSystemTime(new Date('2025-01-01T00:01:00Z'))
    const updated = updateMemoEntity(existing, {
      body: 'Changed body #second',
      sortOrder: 2,
    })

    expect(updated.sortOrder).toBe(2)
    expect(updated.tags).toEqual(['#second'])
    expect(updated.updatedAt).not.toBe(existing.updatedAt)
  })
})
