<script setup lang="ts">
import { computed } from 'vue'
import { usePanelLayer } from '@/shared/composables/usePanelLayer'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    draggable?: boolean
  }>(),
  {
    draggable: true,
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

const instanceId = `app-panel-modal-${Math.random().toString(36).slice(2)}`
const titleId = computed(() => `${instanceId}-title`)

const { panelRef, layerStyle, handleKeydown, handlePointerDown } = usePanelLayer({
  active,
  onClose: close,
  draggable: props.draggable,
  trapFocus: true,
  closeOnOutside: true,
})
</script>

<template>
  <Teleport to="body">
    <transition name="app_fade">
      <div v-if="modelValue" class="app_panelModal" role="presentation">
        <section
          ref="panelRef"
          class="app_panelModalBody space-y-4 w-full max-w-md focus:outline-none"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          :style="layerStyle"
          @keydown="handleKeydown"
        >
          <header
            class="app_panelModalHeader flex justify-between items-center cursor-move select-none"
            @pointerdown="handlePointerDown"
          >
            <div class="app_panelModalHeaderTitle" :id="titleId">
              <slot name="title">
                {{ title }}
              </slot>
            </div>
            <button class="app_iconWrap" type="button" aria-label="閉じる" @click="close">
              <Icon name="material-symbols:close-rounded" size="20" aria-hidden="true" />
            </button>
          </header>
          <div class="app_panelModalBody">
            <slot />
          </div>
          <footer class="app_panelModalFooter flex justify-end gap-2">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </transition>
  </Teleport>
</template>
