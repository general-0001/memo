export type PanelView = 'catalog' | 'memoDetail' | 'categoryDetail'

export interface MemoCategory {
  id: string
  title: string
  body: string
  icon: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoEntry {
  id: string
  categoryId: string
  title: string
  body: string
  icon: string
  tags: string[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  id: 'app'
  sampleSeeded: boolean
  lastSync?: string
}
