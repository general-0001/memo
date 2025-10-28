import { seedSampleDataIfNeeded } from '@/features/app/infrastructure/sample-data'

export const seedMemoWorkspaceData = async () => {
  await seedSampleDataIfNeeded()
}
