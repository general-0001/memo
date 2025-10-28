<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { usePanelLayer } from '@/shared/composables/usePanelLayer'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    ariaLabel?: string
    style?: CSSProperties
    draggable?: boolean
  }>(),
  {
    draggable: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const active = computed(() => props.modelValue)
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const { panelRef, layerStyle, handleKeydown, handlePointerDown } = usePanelLayer({
  active,
  onClose: close,
  draggable: props.draggable,
  trapFocus: true,
  closeOnOutside: true,
})
</script>

<template>
  <transition name="app_fade">
    <div
      v-if="modelValue"
      ref="panelRef"
      class="app_panelPopover"
      role="dialog"
      :aria-label="ariaLabel"
      tabindex="-1"
      :style="[style, layerStyle]"
      @keydown="handleKeydown"
      @pointerdown="handlePointerDown"
    >
      <slot />
    </div>
  </transition>
</template>
