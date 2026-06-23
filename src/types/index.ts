export type FolderStatus = 'active' | 'paused' | 'archived' | 'completed'

export interface Tab {
  id: string
  url: string
  title: string
  faviconUrl: string | null
}

export interface Folder {
  id: string
  name: string
  color: string
  notes: string
  tags: string[]
  status: FolderStatus
  isFavorite: boolean
  createdAt: number
  lastOpenedAt: number | null
  openCount: number
  tabs: Tab[]
}

export type PartialFolder = Partial<Omit<Folder, 'id'>> & { id: string }
