<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { AppPanelSearch, useMemoAppStore } from '@/features/app'
import { AppPanelModal, AppPanelPopover } from '@/shared/presentation'
import type { MemoCategory } from '@/shared/types/memo'

const store = useMemoAppStore()
const router = useRouter()
const route = useRoute()

const categoryId = computed(() => route.params.id as string)
const isNew = computed(() => categoryId.value === 'new')

const iconCandidates = [
  'material-symbols:folder-open-rounded',
  'material-symbols:calendar-add-on-rounded',
  'material-symbols:compost-rounded',
  'material-symbols:hotel-class-rounded',
  'material-symbols:lab-profile-rounded',
  'material-symbols:psychiatry-rounded',
  'material-symbols:star-rounded',
]

const categoryForm = reactive({
  title: '',
  body: '',
  icon: 'material-symbols:folder-open-rounded',
})

const createdAt = ref<string | null>(null)
const updatedAt = ref<string | null>(null)
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const showIconPopover = ref(false)
const iconSearch = ref('')
const showDeleteModal = ref(false)

const filteredIcons = computed(() => {
  const query = iconSearch.value.trim().toLowerCase()
  if (!query) {
    return iconCandidates
  }
  return iconCandidates.filter((name) => name.includes(query))
})

const currentCategory = computed<MemoCategory | null>(() => {
  if (isNew.value) {
    return null
  }
  return store.findCategory(categoryId.value) ?? null
})

const populate = (category: MemoCategory | null) => {
  if (category) {
    categoryForm.title = category.title
    categoryForm.body = category.body
    categoryForm.icon = category.icon
    createdAt.value = category.createdAt
    updatedAt.value = category.updatedAt
    return
  }
  categoryForm.title = ''
  categoryForm.body = ''
  categoryForm.icon = 'material-symbols:folder-open-rounded'
  createdAt.value = null
  updatedAt.value = null
}

watch(
  () => currentCategory.value,
  (category) => populate(category),
  { immediate: true },
)

const formatDate = (value: string | null) => {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(value))
}

const saveCategory = async () => {
  pending.value = true
  errorMessage.value = null
  try {
    if (isNew.value) {
      const category = await store.addCategory({
        title: categoryForm.title,
        body: categoryForm.body,
        icon: categoryForm.icon,
      })
      await router.replace(`/categories/${category.id}`)
    } else {
      await store.editCategory(categoryId.value, {
        title: categoryForm.title,
        body: categoryForm.body,
        icon: categoryForm.icon,
      })
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
  }
}

const confirmDeletion = async () => {
  if (isNew.value || !currentCategory.value) {
    router.push('/')
    return
  }
  pending.value = true
  errorMessage.value = null
  try {
    await store.removeCategory(currentCategory.value.id)
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="app_display flex flex-col min-h-0 text-sm">
    <AppPanelSearch />

    <div class="app_panelCategoryDetail overflow-y-auto">
      <div class="app_panelCategoryDetailHeader flex gap-4 p-2 border-b border-slate-200 opacity-50">
        <div class="app_panelCategoryDetailHeaderTitle flex items-center gap-2">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:folder-open-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelCategoryDetailHeaderTitleText">
            {{ isNew ? 'カテゴリーの作成' : 'カテゴリーの詳細・編集' }}
          </div>
        </div>
        <div class="app_panelCategoryDetailHeaderRegistration items-center flex gap-2">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:event-available-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelCategoryDetailHeaderRegistrationText">{{ formatDate(createdAt) }}</div>
        </div>
        <div class="app_panelCategoryDetailHeaderUpdate items-center flex gap-2">
          <div class="app_iconWrap flex items-center">
            <Icon name="material-symbols:update-rounded" aria-hidden="true" />
          </div>
          <div class="app_panelCategoryDetailHeaderUpdateText">{{ formatDate(updatedAt) }}</div>
        </div>
        <button class="app_memoDelete app_iconWrap ml-auto flex items-center cursor-pointer opacity-50" type="button" @click="showDeleteModal = true">
          <Icon name="material-symbols:delete-outline-rounded" aria-hidden="true" />
        </button>
      </div>

      <div class="app_panelCategoryDetailBody bg-white p-2 flex gap-2 border-b border-slate-200">
        <div class="relative">
          <button class="app_memoIconEdit app_iconWrap py-1.5 text-2xl cursor-pointer flex items-center" type="button" @click="showIconPopover = !showIconPopover">
            <Icon :name="categoryForm.icon" aria-hidden="true" />
          </button>
          <AppPanelPopover
            v-model="showIconPopover"
            aria-label="カテゴリーアイコン選択"
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
                  categoryForm.icon = icon;
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
        <div class="app_panelCategoryDetailSet w-full space-y-2">
          <input
            v-model="categoryForm.title"
            class="app_panelCategoryDetailTitle w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="カテゴリーのタイトル"
          />
          <textarea
            v-model="categoryForm.body"
            rows="6"
            class="app_panelCategoryDetailParagraph w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="カテゴリーの内容"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 p-2">
        <button type="button" class="p-2 rounded-lg bg-white border border-slate-200 cursor-pointer" @click="router.push('/')" :disabled="pending">
          キャンセル
        </button>
        <button
          type="button"
          class="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 cursor-pointer"
          @click="saveCategory"
          :disabled="pending"
        >
          {{ isNew ? '作成' : '更新' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="text-rose-600">{{ errorMessage }}</p>

    <AppPanelModal v-model="showDeleteModal" title="カテゴリーを削除">
      <template #default>
        <p>カテゴリーを削除すると所属するメモも削除されます。続行しますか？</p>
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
