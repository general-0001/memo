<script setup lang="ts">
import { AppPanelSearch, useMemoAppStore } from '@/features/app'
import { AppPanelAddCategory } from '@/features/categories'
import { AppPanelMemoCatalog } from '@/features/memos'

const store = useMemoAppStore()
</script>

<template>
  <div class="app_display flex flex-col gap-2 p-2 min-h-0 text-sm">
    <AppPanelSearch />
    <AppPanelAddCategory />
    <AppPanelMemoCatalog />
  </div>

  <transition name="app_fade">
    <div
      v-if="store.errorMessage"
      class="app_panelError fixed bottom-2 right-2 flex items-center gap-2 p-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg shadow-sm"
      role="alert"
    >
      <div class="app_iconWrap">
        <Icon name="material-symbols:error-outline-rounded" size="20" aria-hidden="true" />
      </div>
      <div class="app_panelErrorText">{{ store.errorMessage }}</div>
    </div>
  </transition>
</template>
