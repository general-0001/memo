<script setup lang="ts">
import AppPanelSearch from '@/components/app/AppPanelSearch.vue'
import AppPanelAddCategory from '@/components/app/AppPanelAddCategory.vue'
import AppPanelMemoCatalog from '@/components/app/AppPanelMemoCatalog.vue'
import { useMemoAppStore } from '@/features/app/application/memoApp.store'

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
