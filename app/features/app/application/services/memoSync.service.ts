import {
  createMemoBroadcastChannel,
  type MemoBroadcastEvent,
} from '@/features/app/infrastructure/memoBroadcast.channel'

export type MemoSyncChannel = ReturnType<typeof createMemoBroadcastChannel>
export type { MemoBroadcastEvent }

export const createMemoSyncChannel = () => createMemoBroadcastChannel()
