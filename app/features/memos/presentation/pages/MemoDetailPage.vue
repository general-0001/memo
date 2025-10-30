<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from '#imports'
import { AppPanelSearch, useMemoAppStore } from '@/features/app'
import { AppPanelModal, AppPanelPopover, AppPanelAutoSaveStatus } from '@/shared/presentation'
import type { MemoEntry } from '@/shared/types/memo'
import { buildHighlightSegments, type HighlightSegment } from '@/shared/utils/highlight'

const store = useMemoAppStore()
const router = useRouter()
const route = useRoute()

const memoId = computed(() => route.params.id as string)
const isNew = computed(() => memoId.value === 'new')
const queryCategory = computed(() => (route.query.category as string) ?? null)
const searchQuery = computed(() => store.searchQuery)

const iconCandidates = [
  'material-symbols:note-alt-rounded',
  'material-symbols:edit-note-rounded',
  'material-symbols:checklist-rounded',
  'material-symbols:draw-rounded',
  'material-symbols:stylus-brush-rounded',
  'material-symbols:flag-circle-rounded',
  'material-symbols:bookmark-added-rounded',
]

const memoForm = reactive({
  title: '',
  body: '',
  icon: 'material-symbols:note-alt-rounded',
  categoryId: '' as string,
})

const createdAt = ref<string | null>(null)
const updatedAt = ref<string | null>(null)

const showCategoryPopover = ref(false)
const showIconPopover = ref(false)
const categoryButtonRef = ref<HTMLElement | null>(null)
const iconButtonRef = ref<HTMLElement | null>(null)
const iconSearch = ref('')
const showDeleteModal = ref(false)
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const autoSaveState = ref<'idle' | 'saving' | 'saved' | 'error'>(isNew.value ? 'idle' : 'saved')
const autoSaveError = ref<string | null>(null)
const isFormInitialized = ref(false)
const isSaving = ref(false)
const shouldRetrySave = ref(false)
const isPopulatingForm = ref(false)
const lastSavedSnapshot = ref('')
const autoSaveResetTimer = ref<number | null>(null)
let activeSavePromise: Promise<void> | null = null
const AUTO_SAVE_DELAY = 500
let scheduledAutoSaveHandle: number | null = null

const titleInputRef = ref<HTMLInputElement | null>(null)
const bodyTextareaRef = ref<HTMLTextAreaElement | null>(null)
const isTitleEditing = ref(isNew.value)
const isBodyEditing = ref(isNew.value)

const filteredIcons = computed(() => {
  const query = iconSearch.value.trim().toLowerCase()
  if (!query) {
    return iconCandidates
  }
  return iconCandidates.filter((name) => name.includes(query))
})

const currentMemo = computed<MemoEntry | null>(() => {
  if (isNew.value) {
    return null
  }
  return store.findMemo(memoId.value) ?? null
})

const selectedCategory = computed(() => store.findCategory(memoForm.categoryId ?? queryCategory.value ?? null))

const displayTitleText = computed(() =>
  memoForm.title?.trim() ? memoForm.title : 'メモのタイトルが設定されていません',
)
const displayBodyText = computed(() =>
  memoForm.body?.trim() ? memoForm.body : 'メモの内容が設定されていません',
)

watch(() => isNew.value, (value) => {
  isTitleEditing.value = value
  isBodyEditing.value = value
})

const startTitleEditing = async () => {
  if (isTitleEditing.value) {
    return
  }
  isTitleEditing.value = true
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

const finishTitleEditing = () => {
  isTitleEditing.value = false
}

const handleTitleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    finishTitleEditing()
  }
}

const startBodyEditing = async () => {
  if (isBodyEditing.value) {
    return
  }
  isBodyEditing.value = true
  await nextTick()
  bodyTextareaRef.value?.focus()
  bodyTextareaRef.value?.select()
}

const finishBodyEditing = () => {
  isBodyEditing.value = false
}

const handleBodyInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    finishBodyEditing()
  }
}

const populateFromMemo = (memo: MemoEntry | null) => {
  isFormInitialized.value = false
  isPopulatingForm.value = true
  if (memo) {
    memoForm.title = memo.title
    memoForm.body = memo.body
    memoForm.icon = memo.icon
    memoForm.categoryId = memo.categoryId
    createdAt.value = memo.createdAt
    updatedAt.value = memo.updatedAt
  } else {
    memoForm.title = ''
    memoForm.body = ''
    memoForm.icon = 'material-symbols:note-alt-rounded'
    memoForm.categoryId = queryCategory.value ?? store.categories[0]?.id ?? ''
    createdAt.value = null
    updatedAt.value = null
  }
  lastSavedSnapshot.value = buildSnapshot()
  autoSaveState.value = memo ? 'saved' : 'idle'
  autoSaveError.value = null
  isPopulatingForm.value = false
  isFormInitialized.value = true
}

const buildSnapshot = () =>
  JSON.stringify({
    title: memoForm.title ?? '',
    body: memoForm.body ?? '',
    icon: memoForm.icon ?? '',
    categoryId: memoForm.categoryId ?? '',
  })

const hasUnsavedChanges = () => buildSnapshot() !== lastSavedSnapshot.value

watch(
  () => currentMemo.value,
  (memo) => populateFromMemo(memo),
  { immediate: true },
)

onMounted(() => {
  if (isNew.value && !memoForm.categoryId && store.categories.length) {
    memoForm.categoryId = queryCategory.value ?? store.categories[0]?.id ?? ''
  }
  if (isTitleEditing.value) {
    nextTick(() => {
      titleInputRef.value?.focus()
      titleInputRef.value?.select()
    })
  }
})

watch(
  () => store.categories.length,
  (length) => {
    if (length && isNew.value && !memoForm.categoryId) {
      memoForm.categoryId = queryCategory.value ?? store.categories[0]?.id ?? ''
    }
  },
  { immediate: true },
)

const ensureCategory = () => {
  if (!memoForm.categoryId && store.categories.length) {
    memoForm.categoryId = store.categories[0]?.id ?? ''
  }
}

const clearAutoSaveTimer = () => {
  if (typeof window === 'undefined') {
    return
  }
  if (autoSaveResetTimer.value !== null) {
    window.clearTimeout(autoSaveResetTimer.value)
    autoSaveResetTimer.value = null
  }
}

const scheduleAutoSaveReset = () => {
  if (typeof window === 'undefined') {
    return
  }
  clearAutoSaveTimer()
  autoSaveResetTimer.value = window.setTimeout(() => {
    if (!hasUnsavedChanges()) {
      autoSaveState.value = 'idle'
    }
    autoSaveResetTimer.value = null
  }, 2000)
}

const cancelScheduledAutoSave = () => {
  if (typeof window === 'undefined') {
    scheduledAutoSaveHandle = null
    return
  }
  if (scheduledAutoSaveHandle !== null) {
    window.clearTimeout(scheduledAutoSaveHandle)
    scheduledAutoSaveHandle = null
  }
}

const scheduleAutoSave = () => {
  if (!isFormInitialized.value || isPopulatingForm.value) {
    return
  }
  if (typeof window === 'undefined') {
    return
  }
  cancelScheduledAutoSave()
  scheduledAutoSaveHandle = window.setTimeout(() => {
    scheduledAutoSaveHandle = null
    void executeSave('auto')
  }, AUTO_SAVE_DELAY)
}

const handleRetry = async () => {
  cancelScheduledAutoSave()
  await executeSave('manual')
}

const completeAndReturn = async () => {
  cancelScheduledAutoSave()
  await executeSave('manual')
  if (autoSaveState.value === 'error') {
    return
  }
  await router.push('/')
}

const executeSave = async (reason: 'auto' | 'manual') => {
  if (!isFormInitialized.value || isPopulatingForm.value) {
    return
  }

  if (isSaving.value) {
    shouldRetrySave.value = true
    return activeSavePromise ?? Promise.resolve()
  }

  if (!hasUnsavedChanges()) {
    if (reason === 'manual' && autoSaveState.value !== 'error') {
      autoSaveState.value = 'saved'
      scheduleAutoSaveReset()
    }
    return
  }

  ensureCategory()
  if (!memoForm.categoryId) {
    const message = 'カテゴリーを選択してください'
    errorMessage.value = message
    autoSaveError.value = message
    autoSaveState.value = 'error'
    return
  }

  const run = (async () => {
    isSaving.value = true
    autoSaveState.value = 'saving'
    autoSaveError.value = null
    errorMessage.value = null
    const snapshotBeforeSave = buildSnapshot()
    const wasNew = isNew.value
    try {
      if (wasNew) {
        const memo = await store.addMemo({
          title: memoForm.title,
          body: memoForm.body,
          icon: memoForm.icon,
          categoryId: memoForm.categoryId,
        })
        createdAt.value = memo.createdAt
        updatedAt.value = memo.updatedAt
        lastSavedSnapshot.value = snapshotBeforeSave
        await router.replace(`/memos/${memo.id}`)
      } else {
        const memo = await store.editMemo(memoId.value, {
          title: memoForm.title,
          body: memoForm.body,
          icon: memoForm.icon,
          categoryId: memoForm.categoryId,
        })
        if (!memo) {
          throw new Error('対象のメモが見つかりませんでした')
        }
        updatedAt.value = memo.updatedAt
        lastSavedSnapshot.value = snapshotBeforeSave
      }
      autoSaveState.value = 'saved'
      autoSaveError.value = null
      scheduleAutoSaveReset()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errorMessage.value = message
      autoSaveError.value = message
      autoSaveState.value = 'error'
    } finally {
      isSaving.value = false
      activeSavePromise = null
      if (shouldRetrySave.value) {
        shouldRetrySave.value = false
        await executeSave('auto')
      }
    }
  })()

  activeSavePromise = run
  return run
}

watch(
  () => [memoForm.title, memoForm.body, memoForm.icon, memoForm.categoryId],
  () => {
    if (!isFormInitialized.value || isPopulatingForm.value) {
      return
    }
    scheduleAutoSave()
  },
)

const confirmDeletion = async () => {
  if (isNew.value || !currentMemo.value) {
    router.push('/')
    return
  }
  pending.value = true
  errorMessage.value = null
  try {
    await store.removeMemo(currentMemo.value.id)
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
    showDeleteModal.value = false
  }
}

const formatDate = (value: string | null) => {
  if (!value) {
    return '-'
  }
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })
  const [date, weekday] = formatter.formatToParts(new Date(value)).reduce<[string, string]>(
    (acc, part) => {
      if (part.type === 'weekday') acc[1] = part.value
      else if (part.type === 'literal') acc
      else acc[0] += part.value
      return acc
    },
    ['', ''],
  )
  return `${date}(${weekday})`
}

const highlightSegments = (text: string): HighlightSegment[] => {
  const base = text ?? ''
  return buildHighlightSegments(base, searchQuery.value)
}

onBeforeRouteLeave(async () => {
  cancelScheduledAutoSave()
  await executeSave('manual')
  if (autoSaveState.value === 'error') {
    return false
  }
  return true
})

onUnmounted(() => {
  cancelScheduledAutoSave()
  clearAutoSaveTimer()
})
</script>

<template>
  <div class="app_display flex flex-col gap-2 p-2 min-h-0 text-sm flex-1">
    <AppPanelSearch />

    <div class="app_panelMemoDetail flex flex-col flex-1 min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="app_panelMemoDetailHeader flex gap-4 p-2 border-b border-slate-200">
        <div class="app_panelMemoDetailHeaderTitle flex items-center gap-1 opacity-50">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:edit-note-rounded" size="20" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderTitleText">
            {{ isNew ? 'メモの作成' : 'メモの詳細・編集' }}
          </div>
        </div>
        <div class="relative">
          <button
            ref="categoryButtonRef"
            class="app_panelMemoDetailHeaderCategory flex items-center gap-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            type="button"
            @click="showCategoryPopover = !showCategoryPopover"
          >
            <div class="app_iconWrap flex items-center">
              <Icon :name="selectedCategory?.icon || 'material-symbols:folder-open-rounded'" aria-hidden="true" />
            </div>
            <div class="app_panelMemoDetailHeaderCategoryText">
              <template
                v-if="selectedCategory"
                v-for="(segment, index) in highlightSegments(selectedCategory.title || 'カテゴリー')"
                :key="`memo-detail-category-${index}`"
              >
                <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                <span v-else>{{ segment.text }}</span>
              </template>
              <template v-else>カテゴリー</template>
            </div>
          </button>

          <AppPanelPopover
            v-model="showCategoryPopover"
            aria-label="カテゴリー選択"
            :anchor="categoryButtonRef"
            :offset="12"
          >
            <div class="app_panelPopoverList overflow-hidden">
              <div
                v-for="category in store.categories"
                :key="category.id"
                class="app_panelPopoverItem flex items-center gap-1 cursor-pointer hover:bg-slate-100 p-2"
                @click="
                  memoForm.categoryId = category.id;
                  showCategoryPopover = false
                "
              >
                <div class="app_iconWrap">
                  <Icon :name="category.icon" aria-hidden="true" />
                </div>
                <div class="app_panelPopoverItemText">
                  <template
                    v-for="(segment, index) in highlightSegments(category.title || '名称未設定')"
                    :key="`memo-popover-category-${category.id}-${index}`"
                  >
                    <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </div>
              </div>
            </div>
          </AppPanelPopover>
        </div>
        <div class="app_panelMemoDetailHeaderRegistration items-center flex gap-1 opacity-50">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:event-available-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderRegistrationText">{{ formatDate(createdAt) }}</div>
        </div>
        <div class="app_panelMemoDetailHeaderUpdate flex gap-1 items-center opacity-50">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:update-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderUpdateText">{{ formatDate(updatedAt) }}</div>
        </div>
        <button
          v-if="!isNew"
          class="app_memoDelete app_iconWrap ml-auto flex items-center cursor-pointer opacity-30 hover:opacity-100 transition-opacity"
          type="button"
          @click="showDeleteModal = true"
        >
          <Icon name="material-symbols:delete-outline-rounded" aria-hidden="true" />
        </button>
      </div>

      <div class="app_panelMemoDetailBody flex-1 min-h-0 overflow-y-auto bg-white p-2 flex gap-2 border-b border-slate-200">
        <div class="relative">
          <button
            ref="iconButtonRef"
            class="app_memoIconEdit app_iconWrap py-1.5 text-2xl cursor-pointer flex items-center"
            type="button"
            @click="showIconPopover = !showIconPopover"
          >
            <Icon :name="memoForm.icon" aria-hidden="true" />
          </button>

          <AppPanelPopover
            v-model="showIconPopover"
            aria-label="アイコン選択"
            :anchor="iconButtonRef"
            :offset="12"
          >
            <input
              v-model="iconSearch"
              type="text"
              placeholder="Type a icon name…"
              aria-label="アイコンの検索"
              class="app_panelPopoverSearch w-full border-b border-slate-200 p-2 appearance-none focus:outline-none"
            />
            <div class="app_panelPopoverList max-h-48 overflow-y-auto">
              <div
                v-for="icon in filteredIcons"
                :key="icon"
                class="app_panelPopoverItem flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2"
                @click="
                  memoForm.icon = icon;
                  showIconPopover = false
                "
              >
                <div class="app_iconWrap">
                  <Icon :name="icon" size="20" aria-hidden="true" />
                </div>
                <div class="app_panelPopoverItemText">{{ icon }}</div>
              </div>
            </div>
          </AppPanelPopover>
        </div>
        <div class="app_panelMemoDetailSet flex flex-col flex-1 min-h-0 space-y-2 overflow-hidden">
          <div
            v-if="!isTitleEditing"
            class="app_panelMemoDetailTitleDisplay w-full border border-slate-200 rounded-lg p-2 cursor-text transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 overflow-x-auto"
            role="button"
            tabindex="0"
            aria-label="メモのタイトルを編集"
            @click="startTitleEditing"
            @keydown.enter.prevent="startTitleEditing"
            @keydown.space.prevent="startTitleEditing"
          >
            <template v-for="(segment, index) in highlightSegments(displayTitleText)" :key="`memo-display-title-${index}`">
              <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
              <span v-else>{{ segment.text }}</span>
            </template>
          </div>
          <input
            v-else
            ref="titleInputRef"
            v-model="memoForm.title"
            class="app_panelMemoDetailTitle w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-200 break-all"
            placeholder="メモのタイトル"
            @blur="finishTitleEditing"
            @keydown="handleTitleInputKeydown"
          />
          <div
            v-if="!isBodyEditing"
            class="app_panelMemoDetailParagraphDisplay w-full border border-slate-200 rounded-lg p-2 cursor-text whitespace-pre-wrap min-h-32 flex-1 min-h-0 overflow-y-auto transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 break-all"
            role="button"
            tabindex="0"
            aria-label="メモの内容を編集"
            @click="startBodyEditing"
            @keydown.enter.prevent="startBodyEditing"
            @keydown.space.prevent="startBodyEditing"
          >
            <template v-for="(segment, index) in highlightSegments(displayBodyText)" :key="`memo-display-body-${index}`">
              <mark v-if="segment.active" class="app_searchHighlight">{{ segment.text }}</mark>
              <span v-else>{{ segment.text }}</span>
            </template>
          </div>
          <textarea
            v-else
            ref="bodyTextareaRef"
            v-model="memoForm.body"
            rows="6"
            class="app_panelMemoDetailParagraph w-full border border-slate-200 rounded-lg p-2 flex-1 min-h-0 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="メモの内容"
            @blur="finishBodyEditing"
            @keydown="handleBodyInputKeydown"
          />
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 p-2">
        <AppPanelAutoSaveStatus :state="autoSaveState" :error-message="autoSaveError" @retry="handleRetry" />
        <button
          type="button"
          class="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 cursor-pointer"
          @click="completeAndReturn"
          :disabled="isSaving"
        >
          完了
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="text-rose-600">{{ errorMessage }}</p>


    <AppPanelModal v-model="showDeleteModal" title="メモを削除">
      <template #default>
        <p>この操作は取り消せません。削除してもよろしいですか？</p>
      </template>
      <template #footer>
        <button type="button" class="p-2 rounded-lg bg-white border border-slate-200 cursor-pointer" @click="showDeleteModal = false">キャンセル</button>
        <button
          type="button"
          class="p-2 rounded-lg bg-rose-600 text-white disabled:opacity-60 cursor-pointer"
          @click="confirmDeletion"
          :disabled="pending"
        >
          削除
        </button>
      </template>
    </AppPanelModal>
  </div>
</template>
