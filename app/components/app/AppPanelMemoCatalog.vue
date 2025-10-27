<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '#imports'
import { useMemoAppStore } from '@/features/app/application/memoApp.store'

const store = useMemoAppStore()
const router = useRouter()

const catalog = computed(() => store.filteredCategories)
const hasData = computed(() => catalog.value.length > 0)

const showMemo = (memoId: string) => {
  router.push(`/memos/${memoId}`)
}

const fallback = (value: string, empty: string) => {
  return value?.trim() ? value : empty
}
</script>

<template>
  <div class="app_panelMemoCatalog overflow-y-auto">
    <template v-if="hasData">
      <div v-for="{ category, memos } in catalog" :key="category.id">
        <div
          class="app_panelMemoCatalogHeader p-2 text-xs bg-white flex gap-2 cursor-pointer transition-colors duration-200 hover:bg-slate-100 group"
          @click="router.push(`/categories/${category.id}`)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="router.push(`/categories/${category.id}`)"
        >
          <div class="app_panelMemoCatalogHeaderSet flex flex-col gap-1">
            <div class="app_panelMemoCatalogTitle font-semibold">
              {{ fallback(category.title, 'カテゴリーのタイトルが設定されていません') }}
            </div>
            <div class="app_panelMemoCatalogParagraph opacity-50">
              {{ fallback(category.body, 'カテゴリーの内容が設定されていません') }}
            </div>
          </div>
          <div class="app_iconWrap ml-auto text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Icon name="material-symbols:edit-rounded" aria-hidden="true" class="opacity-50" />
          </div>
        </div>

        <div class="app_panelMemoCatalogBody" v-if="memos.length">
          <div class="app_panelMemoCatalogBodyList">
            <div
              v-for="memo in memos"
              :key="memo.id"
              class="app_panelMemoCatalogBodyItem p-2 transition-colors duration-200 bg-white hover:bg-slate-100 flex gap-2 cursor-pointer"
              @click="showMemo(memo.id)"
            >
              <div class="app_iconWrap opacity-40">
                <Icon :name="memo.icon || 'material-symbols:note-alt-rounded'" aria-hidden="true" />
              </div>
              <div class="app_panelMemoCatalogBodySet inline truncate">
                <div class="app_panelMemoCatalogBodyTitle mr-1 inline">
                  {{ fallback(memo.title, 'メモのタイトルが設定されていません') }}
                </div>
                <div class="app_panelMemoCatalogBodyParagraph inline opacity-50">
                  {{ fallback(memo.body, 'メモの内容が設定されていません') }}
                </div>
              </div>
              <div class="app_iconWrap ml-auto flex items-center opacity-40 text-sm">
                <Icon name="material-symbols:chevron-right-rounded" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="opacity-40 p-2">このカテゴリーにはメモがありません</div>

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
