<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import { usePanelLayer } from '@/shared/composables/usePanelLayer'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    ariaLabel?: string
    style?: CSSProperties
    draggable?: boolean
    anchor?: HTMLElement | null
    offset?: number
  }>(),
  {
    draggable: false,
    offset: 8,
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

const shouldTeleport = computed(() => Boolean(props.anchor))
const placement = ref<'top' | 'bottom'>('bottom')
const positionStyle = ref<CSSProperties | undefined>()

const updatePosition = () => {
  if (typeof window === 'undefined' || !props.anchor || !panelRef.value) {
    positionStyle.value = undefined
    return
  }

  const anchorRect = props.anchor.getBoundingClientRect()
  const popoverRect = panelRef.value.getBoundingClientRect()
  const spacing = props.offset ?? 8
  const margin = 12

  let top = anchorRect.bottom + spacing
  let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2
  let currentPlacement: 'top' | 'bottom' = 'bottom'

  if (top + popoverRect.height > window.innerHeight - margin && anchorRect.top - spacing - popoverRect.height > margin) {
    top = anchorRect.top - spacing - popoverRect.height
    currentPlacement = 'top'
  }

  left = Math.min(Math.max(left, margin), Math.max(margin, window.innerWidth - popoverRect.width - margin))
  top = Math.max(margin, top)

  placement.value = currentPlacement
  positionStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '60',
  }
}

const addPositionListeners = () => {
  if (typeof window === 'undefined') {
    return
  }
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
}

const removePositionListeners = () => {
  if (typeof window === 'undefined') {
    return
  }
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      removePositionListeners()
      positionStyle.value = undefined
      return
    }
    nextTick(() => {
      updatePosition()
      if (props.anchor) {
        addPositionListeners()
      }
    })
  },
)

watch(
  () => props.anchor,
  () => {
    if (props.modelValue) {
      nextTick(() => updatePosition())
    }
  },
)

onBeforeUnmount(() => {
  removePositionListeners()
})
</script>

<template>
  <Teleport v-if="shouldTeleport" to="body">
    <transition name="app_fade">
      <div
        v-if="modelValue"
        ref="panelRef"
        class="app_panelPopover bg-white border border-slate-300 shadow-xl rounded-xl overflow-hidden"
        role="dialog"
        :aria-label="ariaLabel"
        tabindex="-1"
        :data-placement="placement"
        :style="[positionStyle, style, layerStyle]"
        @keydown="handleKeydown"
        @pointerdown="handlePointerDown"
      >
        <slot />
      </div>
    </transition>
  </Teleport>
  <transition v-else name="app_fade">
    <div
      v-if="modelValue"
      ref="panelRef"
      class="app_panelPopover bg-white border border-slate-300 shadow-xl rounded-xl p-2 overflow-hidden"
      role="dialog"
      :aria-label="ariaLabel"
      tabindex="-1"
      :data-placement="placement"
      :style="[style, layerStyle]"
      @keydown="handleKeydown"
      @pointerdown="handlePointerDown"
    >
      <slot />
    </div>
  </transition>
</template>
