<script setup lang="ts">
import { AppPanelSearch, useMemoAppStore } from '@/features/app'
import { AppPanelAddCategory } from '@/features/categories'
import { AppPanelMemoCatalog } from '@/features/memos'

const store = useMemoAppStore()
</script>

<template>
  <div class="app_display flex flex-col gap-2 p-2 min-h-0 text-sm flex-1">
    <AppPanelSearch />
    <AppPanelAddCategory />
    <ClientOnly>
      <template #placeholder>
        <div class="app_panelMemoCatalog flex-1 min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4 p-4 text-slate-500">
          <div class="flex items-center gap-3 animate-pulse">
            <div class="h-10 w-10 rounded-full bg-slate-200" />
            <div class="flex-1 h-4 rounded bg-slate-200" />
          </div>
          <div class="grid gap-3">
            <div v-for="index in 3" :key="index" class="flex items-center gap-3 animate-pulse">
              <div class="h-10 w-10 rounded-lg bg-slate-200" />
              <div class="flex-1 h-4 rounded bg-slate-200" />
            </div>
          </div>
          <div class="flex items-center gap-2 animate-pulse">
            <div class="h-5 w-5 rounded-full bg-slate-200" />
            <div class="flex-1 h-4 rounded bg-slate-200" />
          </div>
          <div class="flex justify-center text-xs tracking-wide uppercase">
            ローカルデータを読み込んでいます…
          </div>
        </div>
      </template>
      <AppPanelMemoCatalog v-if="store.initialized" />
    </ClientOnly>
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
