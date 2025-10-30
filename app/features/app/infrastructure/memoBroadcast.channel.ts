export type MemoBroadcastEvent =
  | { type: 'categories-updated'; payload?: { ids?: string[] } }
  | { type: 'memos-updated'; payload?: { ids?: string[] } }
  | {
      type: 'memos-reordered'
      payload?: { ids?: string[]; sourceCategoryId?: string; targetCategoryId?: string }
    }

export const createMemoBroadcastChannel = () => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null
  }

  const channel = new BroadcastChannel('memo-app-channel')

  const publish = (event: MemoBroadcastEvent) => {
    channel.postMessage(event)
  }

  const subscribe = (handler: (event: MemoBroadcastEvent) => void) => {
    const wrapped = (event: MessageEvent<MemoBroadcastEvent>) => handler(event.data)
    channel.addEventListener('message', wrapped)
    return () => channel.removeEventListener('message', wrapped)
  }

  const close = () => channel.close()

  return { publish, subscribe, close }
}
