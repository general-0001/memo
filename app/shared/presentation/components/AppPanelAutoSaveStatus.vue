<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  state: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  (event: 'retry'): void
}>()

const status = computed(() => {
  switch (props.state) {
    case 'saving':
      return { label: '保存中…', className: 'text-slate-600', icon: 'material-symbols:sync-rounded' }
    case 'saved':
      return { label: '保存済み', className: 'text-emerald-600', icon: 'material-symbols:check-circle-rounded' }
    case 'error':
      return {
        label: props.errorMessage ?? '保存エラー',
        className: 'text-rose-600',
        icon: 'material-symbols:error-outline-rounded',
      }
    default:
      return { label: '編集中', className: 'text-slate-500', icon: 'material-symbols:edit-rounded' }
  }
})

const showRetry = computed(() => props.state === 'error')
</script>

<template>
  <div class="flex items-center gap-2 text-xs" :class="status.className">
    <div class="flex items-center gap-1">
      <Icon :name="status.icon" class="text-base" aria-hidden="true" />
      <span>{{ status.label }}</span>
    </div>
    <button
      v-if="showRetry"
      type="button"
      class="underline decoration-dotted underline-offset-4 text-current hover:opacity-80"
      @click="emit('retry')"
    >
      再試行
    </button>
  </div>
</template>
