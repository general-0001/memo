<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useMemoAppStore } from '@/features/app'

const store = useMemoAppStore()
const route = useRoute()
const router = useRouter()

const isCatalog = computed(() => route.path === '/')
const iconName = computed(() =>
  isCatalog.value ? 'material-symbols:search-rounded' : 'material-symbols:arrow-back-ios-new-rounded',
)

const query = computed({
  get: () => store.searchQuery,
  set: (value: string) => store.setSearch(value),
})

const handleIconClick = () => {
  if (isCatalog.value) {
    return
  }
  if (history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}
</script>

<template>
  <div
    class="app_panelSearch w-full bg-white border border-slate-200 rounded-xl shadow-sm relative flex items-center gap-2 p-2 sticky top-0 z-20 backdrop-blur"
  >
    <button type="button" class="app_iconWrap p-2 absolute flex items-center cursor-pointer" @click="handleIconClick" :aria-label="isCatalog ? '検索' : '戻る'">
      <Icon :name="iconName" class="text-2xl" />
    </button>
    <input
      v-model="query"
      type="text"
      placeholder="Type a search…"
      aria-label="検索"
      class="app_panelSearchForm w-full flex-1 py-4 pl-10 pr-4 text-ellipsis border-0 appearance-none focus:outline-none transition-colors bg-transparent"
    />
  </div>
</template>
