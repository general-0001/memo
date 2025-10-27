<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import AppPanelSearch from '@/components/app/AppPanelSearch.vue'
import { useMemoAppStore } from '@/features/app/application/memoApp.store'
import type { MemoEntry } from '@/shared/types/memo'

const store = useMemoAppStore()
const router = useRouter()
const route = useRoute()

const memoId = computed(() => route.params.id as string)
const isNew = computed(() => memoId.value === 'new')
const queryCategory = computed(() => (route.query.category as string) ?? null)

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
const iconSearch = ref('')
const showDeleteModal = ref(false)
const pending = ref(false)
const errorMessage = ref<string | null>(null)

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

const populateFromMemo = (memo: MemoEntry | null) => {
  if (memo) {
    memoForm.title = memo.title
    memoForm.body = memo.body
    memoForm.icon = memo.icon
    memoForm.categoryId = memo.categoryId
    createdAt.value = memo.createdAt
    updatedAt.value = memo.updatedAt
    return
  }
  memoForm.title = ''
  memoForm.body = ''
  memoForm.icon = 'material-symbols:note-alt-rounded'
  memoForm.categoryId = queryCategory.value ?? store.categories[0]?.id ?? ''
  createdAt.value = null
  updatedAt.value = null
}

watch(
  () => currentMemo.value,
  (memo) => populateFromMemo(memo),
  { immediate: true },
)

onMounted(() => {
  if (isNew.value && !memoForm.categoryId && store.categories.length) {
    memoForm.categoryId = queryCategory.value ?? store.categories[0]?.id ?? ''
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

const saveMemo = async () => {
  ensureCategory()
  if (!memoForm.categoryId) {
    errorMessage.value = 'カテゴリーを選択してください'
    return
  }
  pending.value = true
  errorMessage.value = null
  try {
    if (isNew.value) {
      const memo = await store.addMemo({
        title: memoForm.title,
        body: memoForm.body,
        icon: memoForm.icon,
        categoryId: memoForm.categoryId,
      })
      await router.replace(`/memos/${memo.id}`)
    } else {
      await store.editMemo(memoId.value, {
        title: memoForm.title,
        body: memoForm.body,
        icon: memoForm.icon,
        categoryId: memoForm.categoryId,
      })
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
  }
}

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
</script>

<template>
  <div class="app_display flex flex-col min-h-0 text-sm">
    <AppPanelSearch />

    <div class="app_panelMemoDetail overflow-y-auto">
      <div class="app_panelMemoDetailHeader flex gap-4 p-2 border-b border-slate-200 opacity-50">
        <div class="app_panelMemoDetailHeaderTitle flex items-center gap-2">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:edit-note-rounded" size="20" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderTitleText">
            {{ isNew ? 'メモの作成' : 'メモの詳細・編集' }}
          </div>
        </div>
        <div class="relative">
          <button class="app_panelMemoDetailHeaderCategory flex items-center gap-2" type="button" @click="showCategoryPopover = !showCategoryPopover">
            <div class="app_iconWrap flex items-center">
              <Icon :name="selectedCategory?.icon || 'material-symbols:folder-open-rounded'" aria-hidden="true" />
            </div>
            <div class="app_panelMemoDetailHeaderCategoryText">
              {{ selectedCategory?.title || 'カテゴリー' }}
            </div>
          </button>

          <AppPanelPopover
            v-model="showCategoryPopover"
            aria-label="カテゴリー選択"
            :style="{ top: 'calc(100% + 0.5rem)', left: '0' }"
          >
            <div class="app_panelPopoverList space-y-1">
              <div
                v-for="category in store.categories"
                :key="category.id"
                class="app_panelPopoverItem flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded-lg"
                @click="
                  memoForm.categoryId = category.id;
                  showCategoryPopover = false
                "
              >
                <div class="app_iconWrap">
                  <Icon :name="category.icon" size="20" aria-hidden="true" />
                </div>
                <div class="app_panelPopoverItemText">{{ category.title || '名称未設定' }}</div>
              </div>
            </div>
          </AppPanelPopover>
        </div>
        <div class="app_panelMemoDetailHeaderRegistration items-center flex gap-2">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:event-available-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderRegistrationText">{{ formatDate(createdAt) }}</div>
        </div>
        <div class="app_panelMemoDetailHeaderUpdate flex items-center">
          <div class="app_iconWrap">
            <Icon name="material-symbols:update-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelMemoDetailHeaderUpdateText">{{ formatDate(updatedAt) }}</div>
        </div>
        <button class="app_memoDelete app_iconWrap ml-auto flex items-center cursor-pointer opacity-50" type="button" @click="showDeleteModal = true">
          <Icon name="material-symbols:delete-outline-rounded" aria-hidden="true" />
        </button>
      </div>

      <div class="app_panelMemoDetailBody bg-white p-2 flex gap-2 border-b border-slate-200">
        <div class="relative">
          <button class="app_memoIconEdit app_iconWrap py-1.5 text-2xl cursor-pointer flex items-center" type="button" @click="showIconPopover = !showIconPopover">
            <Icon :name="memoForm.icon" aria-hidden="true" />
          </button>

          <AppPanelPopover
            v-model="showIconPopover"
            aria-label="アイコン選択"
            :style="{ top: 'calc(100% + 0.5rem)', left: '0' }"
          >
            <input
              v-model="iconSearch"
              type="text"
              placeholder="Type a icon name…"
              aria-label="アイコンの検索"
              class="app_panelPopoverSearch w-full border border-slate-200 rounded-lg p-2"
            />
            <div class="app_panelPopoverList space-y-1 max-h-48 overflow-y-auto mt-2">
              <div
                v-for="icon in filteredIcons"
                :key="icon"
                class="app_panelPopoverItem flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded-lg"
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
        <div class="app_panelMemoDetailSet w-full space-y-2">
          <input
            v-model="memoForm.title"
            class="app_panelMemoDetailTitle w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="メモのタイトル"
          />
          <textarea
            v-model="memoForm.body"
            rows="6"
            class="app_panelMemoDetailParagraph w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="メモの内容"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 p-2">
        <button
          type="button"
          class="p-2 rounded-lg bg-white border border-slate-200 cursor-pointer"
          @click="router.push('/')"
          :disabled="pending"
        >
          キャンセル
        </button>
        <button
          type="button"
          class="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 cursor-pointer"
          @click="saveMemo"
          :disabled="pending"
        >
          {{ isNew ? '作成' : '更新' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="text-rose-600">{{ errorMessage }}</p>


    <AppPanelModal v-model="showDeleteModal" title="メモを削除">
      <template #default>
        <p>この操作は取り消せません。削除してもよろしいですか？</p>
      </template>
      <template #footer>
        <button type="button" class="px-4 py-2 rounded-lg border" @click="showDeleteModal = false">キャンセル</button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-60"
          @click="confirmDeletion"
          :disabled="pending"
        >
          削除
        </button>
      </template>
    </AppPanelModal>
  </div>
</template>
