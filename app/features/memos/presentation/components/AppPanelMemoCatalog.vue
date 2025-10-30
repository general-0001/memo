<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from '#imports'
import { useMemoAppStore } from '@/features/app'
import { buildHighlightSegments, type HighlightSegment } from '@/shared/utils/highlight'
import type { MemoEntry } from '@/shared/types/memo'

const store = useMemoAppStore()
const router = useRouter()

const catalog = computed(() => store.filteredCategories)
const hasData = computed(() => catalog.value.length > 0)
const query = computed(() => store.searchQuery)

const draggedMemo = ref<{ id: string; sourceCategoryId: string } | null>(null)
const dropTarget = ref<{ memoId: string | null; categoryId: string | null }>({ memoId: null, categoryId: null })
const keyboardDrag = ref<{ memoId: string; categoryId: string } | null>(null)

const showMemo = (memoId: string) => {
  router.push(`/memos/${memoId}`)
}

const onMemoClick = (memoId: string) => {
  if (draggedMemo.value || keyboardDrag.value) {
    return
  }
  showMemo(memoId)
}

const fallback = (value: string, empty: string) => {
  return value?.trim() ? value : empty
}

const highlightParts = (text: string): HighlightSegment[] => {
  return buildHighlightSegments(text, query.value)
}

const resetPointerState = () => {
  draggedMemo.value = null
  dropTarget.value = { memoId: null, categoryId: null }
}

const isKeyboardDragging = (memoId: string) => keyboardDrag.value?.memoId === memoId
const isDropTarget = (memoId: string, categoryId: string) =>
  dropTarget.value.memoId === memoId && dropTarget.value.categoryId === categoryId

const determineTargetIndex = (event: DragEvent, memos: MemoEntry[], memoId: string): number | null => {
  const baseIndex = memos.findIndex((item) => item.id === memoId)
  if (baseIndex === -1) {
    return null
  }
  const element = event.currentTarget as HTMLElement | null
  if (!element) {
    return baseIndex
  }
  const { top, height } = element.getBoundingClientRect()
  const offset = event.clientY - top
  if (Number.isNaN(offset) || height === 0) {
    return baseIndex
  }
  const after = offset > height / 2
  return after ? baseIndex + 1 : baseIndex
}

const executeMove = async (
  sourceCategoryId: string,
  targetCategoryId: string,
  memoId: string,
  targetIndex: number,
  mode: 'pointer' | 'keyboard',
) => {
  try {
    await store.moveMemo({ memoId, sourceCategoryId, targetCategoryId, targetIndex })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    store.errorMessage = message
  } finally {
    if (mode === 'pointer') {
      resetPointerState()
      keyboardDrag.value = null
    }
  }
}

const handleDragStart = (event: DragEvent, memoId: string, categoryId: string) => {
  keyboardDrag.value = null
  draggedMemo.value = { id: memoId, sourceCategoryId: categoryId }
  dropTarget.value = { memoId, categoryId }
  event.dataTransfer?.setData('text/plain', memoId)
  event.dataTransfer?.setData('application/x-memo-id', memoId)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  resetPointerState()
}

const handleDragOverMemo = (event: DragEvent, memoId: string, categoryId: string) => {
  if (!draggedMemo.value) {
    return
  }
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dropTarget.value = { memoId, categoryId }
}

const handleDropOnMemo = async (
  event: DragEvent,
  memoId: string,
  categoryId: string,
  memosList: MemoEntry[],
) => {
  event.preventDefault()
  const source = draggedMemo.value
  if (!source) {
    resetPointerState()
    return
  }
  if (source.id === memoId && source.sourceCategoryId === categoryId) {
    resetPointerState()
    return
  }
  const targetIndex = determineTargetIndex(event, memosList, memoId)
  if (targetIndex === null) {
    resetPointerState()
    return
  }
  await executeMove(source.sourceCategoryId, categoryId, source.id, targetIndex, 'pointer')
}

const handleDropOnList = async (event: DragEvent, categoryId: string, memosList: MemoEntry[]) => {
  event.preventDefault()
  const source = draggedMemo.value
  if (!source) {
    resetPointerState()
    return
  }
  await executeMove(source.sourceCategoryId, categoryId, source.id, memosList.length, 'pointer')
}

const handleDragOverCategory = (event: DragEvent, categoryId: string) => {
  if (!draggedMemo.value) {
    return
  }
  event.preventDefault()
  dropTarget.value = { memoId: null, categoryId }
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDropOnCategory = async (event: DragEvent, categoryId: string, memosList: MemoEntry[]) => {
  event.preventDefault()
  const source = draggedMemo.value
  if (!source) {
    resetPointerState()
    return
  }
  await executeMove(source.sourceCategoryId, categoryId, source.id, memosList.length, 'pointer')
}

const toggleKeyboardDrag = (memoId: string, categoryId: string) => {
  if (keyboardDrag.value?.memoId === memoId) {
    keyboardDrag.value = null
  } else {
    keyboardDrag.value = { memoId, categoryId }
  }
}

const handleMemoKeydown = async (
  event: KeyboardEvent,
  memo: MemoEntry,
  memoIndex: number,
  memosList: MemoEntry[],
  categoryId: string,
) => {
  switch (event.key) {
    case ' ': // Space key
    case 'Spacebar': {
      event.preventDefault()
      toggleKeyboardDrag(memo.id, categoryId)
      return
    }
    case 'Escape': {
      if (isKeyboardDragging(memo.id)) {
        event.preventDefault()
        keyboardDrag.value = null
      }
      return
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      if (isKeyboardDragging(memo.id)) {
        event.preventDefault()
        const direction = event.key === 'ArrowUp' ? -1 : 1
        const targetIndex = memoIndex + direction
        if (targetIndex < 0 || targetIndex > memosList.length - 1) {
          return
        }
        await executeMove(categoryId, categoryId, memo.id, targetIndex, 'keyboard')
      }
      return
    }
    case 'Enter': {
      event.preventDefault()
      if (isKeyboardDragging(memo.id)) {
        keyboardDrag.value = null
      } else {
        showMemo(memo.id)
      }
      return
    }
    default:
      return
  }
}
</script>

<template>
  <div class="app_panelMemoCatalog flex-1 min-h-0 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-sm">
    <template v-if="hasData">
      <div
        v-for="{ category, memos } in catalog"
        :key="category.id"
        class="app_panelMemoCatalogGroup"
        @dragover="handleDragOverCategory($event, category.id)"
        @drop.prevent="handleDropOnCategory($event, category.id, memos)"
      >
        <div
          class="app_panelMemoCatalogHeader p-2 text-xs bg-white flex gap-2 cursor-pointer transition-colors duration-200 hover:bg-slate-100 group"
          @click="router.push(`/categories/${category.id}`)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="router.push(`/categories/${category.id}`)"
        >
          <div class="app_panelMemoCatalogHeaderSet flex flex-col gap-1">
            <div class="app_panelMemoCatalogTitle font-semibold">
              <template
                v-for="(segment, index) in highlightParts(
                  fallback(category.title, 'カテゴリーのタイトルが設定されていません'),
                )"
                :key="`category-title-${category.id}-${index}`"
              >
                <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                <span v-else>{{ segment.text }}</span>
              </template>
            </div>
            <div v-if="category.body?.trim()" class="app_panelMemoCatalogParagraph opacity-50">
              <template
                v-for="(segment, index) in highlightParts(category.body ?? '')"
                :key="`category-body-${category.id}-${index}`"
              >
                <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                <span v-else>{{ segment.text }}</span>
              </template>
            </div>
          </div>
          <div class="app_iconWrap ml-auto text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Icon name="material-symbols:edit-rounded" aria-hidden="true" class="opacity-50" />
          </div>
        </div>

        <div
          class="app_panelMemoCatalogBody"
          v-if="memos.length"
          :class="{
            'ring-2 ring-offset-1 ring-slate-300':
              dropTarget.categoryId === category.id && dropTarget.memoId === null && draggedMemo,
          }"
        >
          <div
            class="app_panelMemoCatalogBodyList"
            role="list"
            :aria-dropeffect="draggedMemo ? 'move' : undefined"
            @dragover.prevent="handleDragOverCategory($event, category.id)"
            @drop.stop.prevent="handleDropOnList($event, category.id, memos)"
          >
            <div
              v-for="(memo, memoIndex) in memos"
              :key="memo.id"
              class="app_panelMemoCatalogBodyItem p-2 transition-colors duration-200 bg-white hover:bg-slate-100 flex gap-2 cursor-pointer"
              :class="{
                'opacity-60': draggedMemo?.id === memo.id,
                'ring-2 ring-offset-1 ring-slate-400': isKeyboardDragging(memo.id),
                'border border-dashed border-slate-400': isDropTarget(memo.id, category.id),
              }"
              role="listitem"
              tabindex="0"
              draggable="true"
              :aria-grabbed="draggedMemo?.id === memo.id || isKeyboardDragging(memo.id)"
              @click="onMemoClick(memo.id)"
              @dragstart="handleDragStart($event, memo.id, category.id)"
              @dragend="handleDragEnd"
              @dragover.prevent="handleDragOverMemo($event, memo.id, category.id)"
              @drop.stop.prevent="handleDropOnMemo($event, memo.id, category.id, memos)"
              @keydown="handleMemoKeydown($event, memo, memoIndex, memos, category.id)"
            >
              <div class="app_iconWrap opacity-40">
                <Icon :name="memo.icon || 'material-symbols:note-alt-rounded'" aria-hidden="true" />
              </div>
              <div class="app_panelMemoCatalogBodySet inline truncate">
                <div class="app_panelMemoCatalogBodyTitle mr-1 inline">
                  <template
                    v-for="(segment, index) in highlightParts(
                      fallback(memo.title, 'メモのタイトルが設定されていません'),
                    )"
                    :key="`memo-title-${memo.id}-${index}`"
                  >
                    <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </div>
                <div class="app_panelMemoCatalogBodyParagraph inline opacity-50">
                  <template
                    v-for="(segment, index) in highlightParts(
                      fallback(memo.body, 'メモの内容が設定されていません'),
                    )"
                    :key="`memo-body-${memo.id}-${index}`"
                  >
                    <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </div>
              </div>
              <div class="app_iconWrap ml-auto flex items-center opacity-40 text-sm">
                <Icon name="material-symbols:chevron-right-rounded" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="opacity-40 p-2 text-center min-h-[2.5rem] flex items-center justify-center"
          :class="{
            'ring-2 ring-offset-1 ring-slate-300':
              dropTarget.categoryId === category.id && dropTarget.memoId === null && draggedMemo,
          }"
          @dragover.prevent="handleDragOverCategory($event, category.id)"
          @drop.prevent="handleDropOnCategory($event, category.id, memos)"
        >
          このカテゴリーにはメモがありません
        </div>

        <div
          class="app_panelMemoCatalogFooter app_panelMemoCatalogBodyItem w-full p-2 bg-white flex gap-2 border-b border-slate-200 transition-colors duration-200 hover:bg-slate-100 cursor-pointer"
          role="button"
          tabindex="0"
          @click="router.push(`/memos/new?category=${category.id}`)"
          @keydown.enter.prevent="router.push(`/memos/new?category=${category.id}`)"
        >
          <div class="app_iconWrap flex items-center opacity-40">
            <Icon name="material-symbols:add-rounded" aria-hidden="true" />
          </div>
          <div>メモを追加</div>
        </div>
      </div>
    </template>
    <p v-else class="text-center opacity-40 p-2">データがありません</p>
  </div>
</template>
