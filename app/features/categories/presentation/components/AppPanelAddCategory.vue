<script setup lang="ts">
import { useRouter } from '#imports'

const router = useRouter()

const handleClick = () => {
  router.push('/categories/new')
}
</script>

<template>
  <div
    class="app_panelAddCategory p-2 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition duration-200 hover:bg-slate-100"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
  >
    <div class="app_iconWrap flex items-center bg-black rounded text-white">
      <Icon name="material-symbols:add-rounded" aria-hidden="true" />
    </div>
    <div class="app_panelAddCategoryTitle">
      <div class="app_panelAddCategoryText">カテゴリーを追加</div>
    </div>
  </div>
</template>
