import {
  createMemoBroadcastChannel,
  type MemoBroadcastEvent,
} from '@/features/app/infrastructure/memoBroadcast.channel'
import { createMemoStorageChannel } from '@/features/app/infrastructure/memoStorage.channel'

type BroadcastChannelInstance = ReturnType<typeof createMemoBroadcastChannel>
type StorageChannelInstance = ReturnType<typeof createMemoStorageChannel>

export type MemoSyncChannel = NonNullable<BroadcastChannelInstance> | NonNullable<StorageChannelInstance> | null
export type { MemoBroadcastEvent }

export const createMemoSyncChannel = (): MemoSyncChannel => {
  const broadcastChannel = createMemoBroadcastChannel()
  if (broadcastChannel) {
    return broadcastChannel
  }

  const storageChannel = createMemoStorageChannel()
  if (storageChannel) {
    return storageChannel
  }

  return null
}
