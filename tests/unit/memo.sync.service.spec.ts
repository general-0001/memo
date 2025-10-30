import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoSyncChannel, type MemoBroadcastEvent } from '@/features/app/application/services/memoSync.service'

const STORAGE_KEY = 'memo-app-sync-event'

describe('createMemoSyncChannel', () => {
  const originalBroadcastChannel = window.BroadcastChannel

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    window.BroadcastChannel = originalBroadcastChannel
    localStorage.removeItem(STORAGE_KEY)
  })

  it('falls back to storage channel when BroadcastChannel is unavailable', () => {
    Reflect.deleteProperty(window, 'BroadcastChannel')
    const channel = createMemoSyncChannel()

    expect(channel).not.toBeNull()
    expect(typeof channel?.publish).toBe('function')
    expect(typeof channel?.subscribe).toBe('function')

    const event: MemoBroadcastEvent = { type: 'memos-updated', payload: { ids: ['a'] } }
    const subscribeSpy = vi.fn()

    const unsubscribe = channel?.subscribe(subscribeSpy)
    expect(typeof unsubscribe).toBe('function')

    // StorageEvent は他タブでのみ発火するため、手動でディスパッチしてシリアライズ処理を確認
    const payload = JSON.stringify({
      id: 'test-id',
      event,
      timestamp: Date.now(),
    })

    const storageEvent = new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: payload,
    })
    window.dispatchEvent(storageEvent)

    expect(subscribeSpy).toHaveBeenCalledWith(event)

    unsubscribe?.()
  })
})
