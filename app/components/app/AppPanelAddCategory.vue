<script setup lang="ts">
import { useRouter } from '#imports'

const router = useRouter()

const handleClick = () => {
  router.push('/categories/new')
}
</script>

<template>
  <div class="app_panelAddCategory" role="button" tabindex="0" @click="handleClick" @keydown.enter.prevent="handleClick">
    <div class="app_iconWrap">
      <Icon name="material-symbols:add-rounded" size="20" aria-hidden="true" />
    </div>
    <div class="app_panelAddCategoryTitle">
      <div class="app_panelAddCategoryText">カテゴリーを追加</div>
    </div>
  </div>
</template>
