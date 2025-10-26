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
  <div class="app_panelMemoCatalog">
    <template v-if="hasData">
      <div v-for="{ category, memos } in catalog" :key="category.id" class="app_panelMemoCatalogCategory">
        <div class="app_panelMemoCatalogHeader">
          <div class="app_iconWrap">
            <Icon :name="category.icon || 'material-symbols:folder-open-rounded'" size="20" aria-hidden="true" />
          </div>
          <div class="app_panelMemoCatalogHeaderSet">
            <div class="app_panelMemoCatalogTitle">
              {{ fallback(category.title, 'カテゴリーのタイトルが設定されていません') }}
            </div>
            <div class="app_panelMemoCatalogParagraph">
              {{ fallback(category.body, 'カテゴリーの内容が設定されていません') }}
            </div>
          </div>
        </div>

        <div class="app_panelMemoCatalogBody" v-if="memos.length">
          <div class="app_panelMemoCatalogBodyList">
            <div
              v-for="memo in memos"
              :key="memo.id"
              class="app_panelMemoCatalogBodyItem"
              @click="showMemo(memo.id)"
            >
              <div class="app_iconWrap">
                <Icon :name="memo.icon || 'material-symbols:note-alt-rounded'" size="20" aria-hidden="true" />
              </div>
              <div class="app_panelMemoCatalogBodySet">
                <div class="app_panelMemoCatalogBodyTitle">
                  {{ fallback(memo.title, 'メモのタイトルが設定されていません') }}
                </div>
                <div class="app_panelMemoCatalogBodyParagraph">
                  {{ fallback(memo.body, 'メモの内容が設定されていません') }}
                </div>
              </div>
              <div class="app_iconWrap">
                <Icon name="material-symbols:chevron-right-rounded" size="20" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-slate-500 px-2 py-1">このカテゴリーにはメモがありません</div>

        <div
          class="app_panelMemoCatalogFooter app_panelMemoCatalogBodyItem w-full cursor-pointer"
          role="button"
          tabindex="0"
          @click="router.push(`/memos/new?category=${category.id}`)"
          @keydown.enter.prevent="router.push(`/memos/new?category=${category.id}`)"
        >
          <div class="app_iconWrap">
            <Icon name="material-symbols:add-rounded" size="20" aria-hidden="true" />
          </div>
          <div>メモを追加</div>
        </div>
      </div>
    </template>
    <p v-else class="text-center text-slate-500 py-4">データがありません</p>
  </div>
</template>
