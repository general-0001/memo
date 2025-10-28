<script setup lang="ts">
import { AppPanelSearch, useMemoAppStore } from '@/features/app'
import { AppPanelAddCategory } from '@/features/categories'
import { AppPanelMemoCatalog } from '@/features/memos'

const store = useMemoAppStore()
</script>

<template>
  <div class="app_display flex flex-col min-h-0 text-sm">
    <AppPanelSearch />
    <AppPanelAddCategory />
    <AppPanelMemoCatalog />
  </div>

  <transition name="app_fade">
    <div v-if="store.errorMessage" class="app_panelError" role="alert">
      <div class="app_iconWrap">
        <Icon name="material-symbols:error-outline-rounded" size="20" aria-hidden="true" />
      </div>
      <div class="app_panelErrorText">{{ store.errorMessage }}</div>
    </div>
  </transition>
</template>
