import type { MemoBroadcastEvent } from './memoBroadcast.channel'

interface StorageChannel {
  publish: (event: MemoBroadcastEvent) => void
  subscribe: (handler: (event: MemoBroadcastEvent) => void) => () => void
  close: () => void
}

const STORAGE_KEY = 'memo-app-sync-event'

const safeJsonParse = (value: string | null) => {
  if (!value) {
    return null
  }
  try {
    return JSON.parse(value) as { id: string; event: MemoBroadcastEvent; timestamp: number }
  } catch {
    return null
  }
}

export const createMemoStorageChannel = (): StorageChannel | null => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return null
  }
  const storage = window.localStorage
  if (!storage) {
    return null
  }

  const subscribe = (handler: (event: MemoBroadcastEvent) => void) => {
    const listener = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return
      }
      const payload = safeJsonParse(event.newValue ?? null)
      if (!payload?.event) {
        return
      }
      handler(payload.event)
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }

  const publish = (event: MemoBroadcastEvent) => {
    try {
      const payload = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        timestamp: Date.now(),
      })
      storage.setItem(STORAGE_KEY, payload)
      storage.removeItem(STORAGE_KEY)
    } catch {
      // ignore quota or access exceptions
    }
  }

  const close = () => {
    // no persistent resources to release
  }

  return { publish, subscribe, close }
}
