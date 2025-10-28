import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MemoCategory, MemoEntry, PanelView } from '@/shared/types/memo'
import { seedMemoWorkspaceData } from '@/features/app/application/services/memoSeed.service'
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '@/features/categories'
import { fetchAllMemos, createMemo, updateMemo, deleteMemo } from '@/features/memos'
import {
  createMemoSyncChannel,
  type MemoBroadcastEvent,
  type MemoSyncChannel,
} from '@/features/app/application/services/memoSync.service'

const normalize = (value: string) => value.toLowerCase()

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
    categories.value = categoryList
    memos.value = memoList
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
    categories.value = [...categories.value, category].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    broadcast({ type: 'categories-updated' })
    return category
  }

  const editCategory = async (id: string, payload: Partial<MemoCategory>) => {
    const category = await updateCategory(id, payload)
    if (!category) {
      return null
    }
    categories.value = categories.value.map((item) => (item.id === id ? category : item))
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
    memos.value = [...memos.value, memo].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    broadcast({ type: 'memos-updated' })
    return memo
  }

  const editMemo = async (id: string, payload: Partial<MemoEntry>) => {
    const memo = await updateMemo(id, payload)
    if (!memo) {
      return null
    }
    memos.value = memos.value.map((item) => (item.id === id ? memo : item))
    broadcast({ type: 'memos-updated', payload: { ids: [id] } })
    return memo
  }

  const removeMemo = async (id: string) => {
    await deleteMemo(id)
    memos.value = memos.value.filter((memo) => memo.id !== id)
    broadcast({ type: 'memos-updated', payload: { ids: [id] } })
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
  }
})
