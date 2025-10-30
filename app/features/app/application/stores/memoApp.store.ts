import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MemoCategory, MemoEntry, PanelView } from '@/shared/types/memo'
import { seedMemoWorkspaceData } from '@/features/app/application/services/memoSeed.service'
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '@/features/categories'
import { fetchAllMemos, createMemo, updateMemo, deleteMemo, reorderMemo } from '@/features/memos'
import {
  createMemoSyncChannel,
  type MemoBroadcastEvent,
  type MemoSyncChannel,
} from '@/features/app/application/services/memoSync.service'

const normalize = (value: string) => value.toLowerCase()
const clampIndex = (value: number, max: number) => Math.min(Math.max(0, value), max)

const sortCategories = (list: MemoCategory[]) =>
  [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

const sortMemos = (list: MemoEntry[]) =>
  [...list].sort((a, b) => {
    const orderDiff = (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
    if (orderDiff !== 0) {
      return orderDiff
    }
    return a.createdAt.localeCompare(b.createdAt)
  })

const buildLocalMove = (
  allMemos: MemoEntry[],
  params: { memoId: string; sourceCategoryId: string; targetCategoryId: string; targetIndex: number },
): {
  sourceCategoryId: string
  targetCategoryId: string
  sourceMemos: MemoEntry[]
  targetMemos: MemoEntry[]
} | null => {
  const { memoId, sourceCategoryId, targetCategoryId, targetIndex } = params
  const memo = allMemos.find((item) => item.id === memoId && item.categoryId === sourceCategoryId)
  if (!memo) {
    return null
  }

  const sourceList = allMemos.filter((item) => item.categoryId === sourceCategoryId)
  const targetBase =
    sourceCategoryId === targetCategoryId
      ? sourceList.filter((item) => item.id !== memoId)
      : allMemos.filter((item) => item.categoryId === targetCategoryId)

  const insertIndex = clampIndex(targetIndex, targetBase.length)
  const movedMemo: MemoEntry = { ...memo, categoryId: targetCategoryId }

  if (sourceCategoryId === targetCategoryId) {
    const working = [...targetBase]
    working.splice(insertIndex, 0, movedMemo)
    const normalized = working.map((item, index) => ({ ...item, sortOrder: index }))
    return {
      sourceCategoryId,
      targetCategoryId,
      sourceMemos: normalized,
      targetMemos: normalized,
    }
  }

  const sourceWithout = sourceList.filter((item) => item.id !== memoId)
  const workingTarget = [...targetBase]
  workingTarget.splice(insertIndex, 0, movedMemo)

  const normalizedSource = sourceWithout.map((item, index) => ({ ...item, sortOrder: index }))
  const normalizedTarget = workingTarget.map((item, index) => ({ ...item, sortOrder: index }))

  return {
    sourceCategoryId,
    targetCategoryId,
    sourceMemos: normalizedSource,
    targetMemos: normalizedTarget,
  }
}

export const useMemoAppStore = defineStore('memoApp', () => {
  const categories = ref<MemoCategory[]>([])
  const memos = ref<MemoEntry[]>([])
  const searchQuery = ref('')
  const activeView = ref<PanelView>('catalog')
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null
  let channelInstance: MemoSyncChannel | null =
    typeof window !== 'undefined' ? createMemoSyncChannel() : null

  const memoMap = computed(() => {
    const map = new Map<string, MemoEntry[]>()
    for (const memo of memos.value) {
      const existing = map.get(memo.categoryId) ?? []
      existing.push(memo)
      map.set(memo.categoryId, existing)
    }
    return map
  })

  const filteredCategories = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      return categories.value.map((category) => ({
        category,
        memos: (memoMap.value.get(category.id) ?? []).slice(),
      }))
    }

    return categories.value
      .map((category) => {
        const keyword = `${category.title} ${category.body}`.toLowerCase()
        const candidates = memoMap.value.get(category.id) ?? []

        const filteredMemos = candidates.filter((memo) => {
          const memoText = `${memo.title} ${memo.body}`.toLowerCase()
          return memoText.includes(query) || keyword.includes(query)
        })

        if (filteredMemos.length === 0) {
          return null
        }

        return {
          category,
          memos: filteredMemos,
        }
      })
      .filter(Boolean) as Array<{ category: MemoCategory; memos: MemoEntry[] }>
  })

  const allTags = computed(() => {
    const set = new Set<string>()
    categories.value.forEach((category) => category.tags.forEach((tag) => set.add(tag)))
    memos.value.forEach((memo) => memo.tags.forEach((tag) => set.add(tag)))
    return Array.from(set.values())
  })

  const findCategory = (id?: string | null) => categories.value.find((category) => category.id === id)
  const findMemo = (id?: string | null) => memos.value.find((memo) => memo.id === id)

  const setView = (view: PanelView) => {
    activeView.value = view
  }

  const setSearch = (value: string) => {
    searchQuery.value = value
  }

  const refreshFromDb = async () => {
    const [categoryList, memoList] = await Promise.all([fetchAllCategories(), fetchAllMemos()])
    categories.value = sortCategories(categoryList)
    memos.value = sortMemos(memoList)
  }

  const initialize = async () => {
    if (process.server || loading.value || categories.value.length > 0) {
      return
    }
    loading.value = true
    try {
      await seedMemoWorkspaceData()
      await refreshFromDb()
      setupChannel()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : String(error)
    } finally {
      loading.value = false
    }
  }

  const setupChannel = () => {
    if (typeof window === 'undefined') {
      return
    }
    if (!channelInstance) {
      channelInstance = createMemoSyncChannel()
    }
    if (!channelInstance) {
      return
    }
    unsubscribe?.()
    unsubscribe = channelInstance.subscribe(async (_event: MemoBroadcastEvent) => {
      await refreshFromDb()
    })
  }

  const broadcast = (event: MemoBroadcastEvent) => {
    if (typeof window === 'undefined') {
      return
    }
    if (!channelInstance) {
      channelInstance = createMemoSyncChannel()
    }
    channelInstance?.publish(event)
  }

  const addCategory = async (payload: Partial<MemoCategory>) => {
    const category = await createCategory(payload)
    categories.value = sortCategories([...categories.value, category])
    broadcast({ type: 'categories-updated' })
    return category
  }

  const editCategory = async (id: string, payload: Partial<MemoCategory>) => {
    const category = await updateCategory(id, payload)
    if (!category) {
      return null
    }
    categories.value = sortCategories(categories.value.map((item) => (item.id === id ? category : item)))
    broadcast({ type: 'categories-updated', payload: { ids: [id] } })
    return category
  }

  const removeCategory = async (id: string) => {
    await deleteCategory(id)
    categories.value = categories.value.filter((item) => item.id !== id)
    memos.value = memos.value.filter((memo) => memo.categoryId !== id)
    broadcast({ type: 'categories-updated', payload: { ids: [id] } })
  }

  const addMemo = async (payload: Partial<MemoEntry> & { categoryId: string }) => {
    const memo = await createMemo(payload)
    memos.value = sortMemos([...memos.value, memo])
    broadcast({ type: 'memos-updated' })
    return memo
  }

  const editMemo = async (id: string, payload: Partial<MemoEntry>) => {
    const memo = await updateMemo(id, payload)
    if (!memo) {
      return null
    }
    memos.value = sortMemos(memos.value.map((item) => (item.id === id ? memo : item)))
    broadcast({ type: 'memos-updated', payload: { ids: [id] } })
    return memo
  }

  const removeMemo = async (id: string) => {
    await deleteMemo(id)
    memos.value = sortMemos(memos.value.filter((memo) => memo.id !== id))
    broadcast({ type: 'memos-updated', payload: { ids: [id] } })
  }

  const moveMemo = async (params: {
    memoId: string
    sourceCategoryId: string
    targetCategoryId: string
    targetIndex: number
  }) => {
    const { memoId, sourceCategoryId, targetCategoryId, targetIndex } = params
    const previousState = memos.value.map((item) => ({ ...item }))
    const localResult = buildLocalMove(memos.value, { memoId, sourceCategoryId, targetCategoryId, targetIndex })
    if (!localResult) {
      return
    }

    const unaffected = memos.value.filter(
      (memo) =>
        memo.categoryId !== localResult.sourceCategoryId && memo.categoryId !== localResult.targetCategoryId,
    )
    const combined =
      localResult.sourceCategoryId === localResult.targetCategoryId
        ? [...localResult.targetMemos, ...unaffected]
        : [...localResult.sourceMemos, ...localResult.targetMemos, ...unaffected]
    memos.value = sortMemos(combined)

    try {
      const persisted = await reorderMemo({
        memoId,
        sourceCategoryId,
        targetCategoryId,
        targetIndex,
      })
      const persistedIds = new Set<string>()
      persisted.sourceMemos.forEach((memo) => persistedIds.add(memo.id))
      persisted.targetMemos.forEach((memo) => persistedIds.add(memo.id))

      const persistedUnchanged = memos.value.filter(
        (memo) =>
          memo.categoryId !== persisted.sourceCategoryId && memo.categoryId !== persisted.targetCategoryId,
      )
      const persistedCombined =
        persisted.sourceCategoryId === persisted.targetCategoryId
          ? [...persisted.targetMemos, ...persistedUnchanged]
          : [...persisted.sourceMemos, ...persisted.targetMemos, ...persistedUnchanged]

      memos.value = sortMemos(persistedCombined)
      broadcast({
        type: 'memos-reordered',
        payload: {
          ids: Array.from(persistedIds.values()),
          sourceCategoryId: persisted.sourceCategoryId,
          targetCategoryId: persisted.targetCategoryId,
        },
      })
    } catch (error) {
      memos.value = sortMemos(previousState)
      throw error
    }
  }

  return {
    // state
    categories,
    memos,
    searchQuery,
    activeView,
    loading,
    errorMessage,
    // getters
    filteredCategories,
    allTags,
    findCategory,
    findMemo,
    // actions
    initialize,
    refreshFromDb,
    setView,
    setSearch,
    addCategory,
    editCategory,
    removeCategory,
    addMemo,
    editMemo,
    removeMemo,
    moveMemo,
  }
})
