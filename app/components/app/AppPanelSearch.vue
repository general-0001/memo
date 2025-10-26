<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useMemoAppStore } from '@/features/app/application/memoApp.store'

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
  <div class="app_panelSearch">
    <button type="button" class="app_iconWrap" @click="handleIconClick" :aria-label="isCatalog ? '検索' : '戻る'">
      <Icon :name="iconName" size="20" />
    </button>
    <input
      v-model="query"
      type="text"
      placeholder="Type a search…"
      aria-label="検索"
      class="app_panelSearchForm"
    />
  </div>
</template>
