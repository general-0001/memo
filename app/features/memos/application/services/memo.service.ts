import type { MemoEntry } from '@/shared/types/memo'
import { createMemoEntity, updateMemoEntity } from '../../domain/memo.factory'
import { getMemoRepository } from '../ports/memo.repository'

type CreateMemoPayload = Partial<Omit<MemoEntry, 'categoryId'>> & { categoryId: string }

const resolveSortOrder = async (
  repository = getMemoRepository(),
  categoryId: string,
  sortOrder?: number,
): Promise<number> => {
  if (typeof sortOrder === 'number') {
    return sortOrder
  }
  const highest = await repository.getHighestSortOrder(categoryId)
  return highest !== null ? highest + 1 : 0
}

export const fetchAllMemos = async (): Promise<MemoEntry[]> => {
  const repository = getMemoRepository()
  return repository.fetchAll()
}

export const fetchMemosByCategory = async (categoryId: string): Promise<MemoEntry[]> => {
  const repository = getMemoRepository()
  return repository.fetchByCategory(categoryId)
}

export const createMemo = async (payload: CreateMemoPayload): Promise<MemoEntry> => {
  const repository = getMemoRepository()
  const sortOrder = await resolveSortOrder(repository, payload.categoryId, payload.sortOrder)
  const memo = createMemoEntity({
    ...payload,
    sortOrder,
  })
  return repository.create(memo)
}

export const updateMemo = async (id: string, payload: Partial<MemoEntry>): Promise<MemoEntry | null> => {
  const repository = getMemoRepository()
  const current = await repository.findById(id)
  if (!current) {
    return null
  }

  const nextCategoryId = payload.categoryId ?? current.categoryId
  const nextSortOrder =
    nextCategoryId === current.categoryId
      ? payload.sortOrder ?? current.sortOrder
      : await resolveSortOrder(repository, nextCategoryId, payload.sortOrder)

  const next = updateMemoEntity(current, {
    ...payload,
    categoryId: nextCategoryId,
    sortOrder: nextSortOrder,
  })
  return repository.update(next)
}

export const deleteMemo = async (id: string): Promise<void> => {
  const repository = getMemoRepository()
  await repository.delete(id)
}

export interface ReorderMemoInput {
  memoId: string
  sourceCategoryId: string
  targetCategoryId: string
  targetIndex: number
}

export interface ReorderMemoResult {
  sourceCategoryId: string
  targetCategoryId: string
  sourceMemos: MemoEntry[]
  targetMemos: MemoEntry[]
}

export const reorderMemo = async ({
  memoId,
  sourceCategoryId,
  targetCategoryId,
  targetIndex,
}: ReorderMemoInput): Promise<ReorderMemoResult> => {
  const repository = getMemoRepository()
  const memo = await repository.findById(memoId)
  if (!memo) {
    throw new Error(`Memo ${memoId} not found`)
  }
  if (memo.categoryId !== sourceCategoryId) {
    throw new Error(`Memo ${memoId} does not belong to category ${sourceCategoryId}`)
  }

  if (sourceCategoryId === targetCategoryId) {
    const memos = await repository.fetchByCategory(sourceCategoryId)
    const currentIndex = memos.findIndex((item) => item.id === memoId)
    if (currentIndex === -1) {
      throw new Error(`Memo ${memoId} not found in category ${sourceCategoryId}`)
    }
    const nextOrder = [...memos]
    const removed = nextOrder.splice(currentIndex, 1)
    const moved = removed[0]
    if (!moved) {
      return {
        sourceCategoryId,
        targetCategoryId,
        sourceMemos: memos,
        targetMemos: memos,
      }
    }
    const insertIndex = Math.min(Math.max(0, targetIndex), nextOrder.length)
    nextOrder.splice(insertIndex, 0, moved)

    const normalized = nextOrder.map((item, index) => updateMemoEntity(item, { sortOrder: index }))
    await repository.updateMany(normalized)
    return {
      sourceCategoryId,
      targetCategoryId,
      sourceMemos: normalized,
      targetMemos: normalized,
    }
  }

  const [sourceMemos, targetMemos] = await Promise.all([
    repository.fetchByCategory(sourceCategoryId),
    repository.fetchByCategory(targetCategoryId),
  ])

  const sourceNext = sourceMemos.filter((item) => item.id !== memoId)
  const insertIndex = Math.min(Math.max(0, targetIndex), targetMemos.length)
  const movedMemo = updateMemoEntity(memo, { categoryId: targetCategoryId })
  const targetNext = [...targetMemos]
  targetNext.splice(insertIndex, 0, movedMemo)

  const normalizedSource = sourceNext.map((item, index) => updateMemoEntity(item, { sortOrder: index }))
  const normalizedTarget = targetNext.map((item, index) => updateMemoEntity(item, { sortOrder: index }))

  await repository.updateMany([...normalizedSource, ...normalizedTarget])

  return {
    sourceCategoryId,
    targetCategoryId,
    sourceMemos: normalizedSource,
    targetMemos: normalizedTarget,
  }
}
