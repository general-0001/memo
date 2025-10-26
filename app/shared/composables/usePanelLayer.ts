import { computed, nextTick, onBeforeUnmount, reactive, ref, watch, type CSSProperties, type Ref } from 'vue'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface PanelLayerOptions {
  active: Ref<boolean>
  onClose?: () => void
  draggable?: boolean
  trapFocus?: boolean
  closeOnOutside?: boolean
}

export const usePanelLayer = (options: PanelLayerOptions) => {
  const panelRef = ref<HTMLElement | null>(null)
  const dragState = reactive({
    dragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  let lastFocusedElement: HTMLElement | null = null

  const trapFocusEnabled = options.trapFocus ?? true
  const draggable = options.draggable ?? false
  const closeOnOutside = options.closeOnOutside ?? false

  const getFocusableElements = () => {
    if (!panelRef.value) {
      return [] as HTMLElement[]
    }
    return Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
    )
  }

  const focusFirstElement = () => {
    if (!trapFocusEnabled) {
      return
    }
    const focusables = getFocusableElements()
    const target = focusables[0] ?? panelRef.value
    target?.focus?.()
  }

  const restoreFocus = () => {
    if (!trapFocusEnabled) {
      return
    }
    lastFocusedElement?.focus?.()
    lastFocusedElement = null
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      options.onClose?.()
      return
    }
    if (!trapFocusEnabled || event.key !== 'Tab') {
      return
    }
    const focusables = getFocusableElements()
    if (!focusables.length) {
      event.preventDefault()
      panelRef.value?.focus()
      return
    }
    const currentIndex = focusables.indexOf(document.activeElement as HTMLElement)
    if (event.shiftKey) {
      if (currentIndex <= 0) {
        focusables[focusables.length - 1]?.focus()
        event.preventDefault()
      }
      return
    }
    if (currentIndex === focusables.length - 1) {
      focusables[0]?.focus()
      event.preventDefault()
    }
  }

  const pointerMove = (event: PointerEvent) => {
    if (!dragState.dragging) {
      return
    }
    dragState.offsetX = event.clientX - dragState.startX
    dragState.offsetY = event.clientY - dragState.startY
  }

  const endDrag = () => {
    if (!dragState.dragging) {
      return
    }
    dragState.dragging = false
    window.removeEventListener('pointermove', pointerMove)
    window.removeEventListener('pointerup', endDrag)
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!draggable || !panelRef.value) {
      return
    }
    dragState.dragging = true
    dragState.startX = event.clientX - dragState.offsetX
    dragState.startY = event.clientY - dragState.offsetY
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', endDrag)
  }

  const layerStyle = computed<CSSProperties | undefined>(() => {
    if (!draggable) {
      return undefined
    }
    return {
      transform: `translate(${dragState.offsetX}px, ${dragState.offsetY}px)`,
    }
  })

  const handleOutsidePointer = (event: PointerEvent) => {
    if (!closeOnOutside || !options.active.value || !panelRef.value) {
      return
    }
    const target = event.target as Node | null
    if (panelRef.value.contains(target)) {
      return
    }
    options.onClose?.()
  }

  const cleanupOutsideListener = () => {
    window.removeEventListener('pointerdown', handleOutsidePointer, true)
  }

  watch(
    options.active,
    (isActive) => {
      if (typeof window === 'undefined') {
        return
      }
      if (isActive) {
        lastFocusedElement = document.activeElement as HTMLElement
        nextTick(() => focusFirstElement())
        if (closeOnOutside) {
          window.addEventListener('pointerdown', handleOutsidePointer, true)
        }
      } else {
        restoreFocus()
        endDrag()
        if (closeOnOutside) {
          cleanupOutsideListener()
        }
      }
    },
    { immediate: false },
  )

  onBeforeUnmount(() => {
    endDrag()
    cleanupOutsideListener()
  })

  return {
    panelRef,
    layerStyle,
    handleKeydown,
    handlePointerDown,
  }
}
