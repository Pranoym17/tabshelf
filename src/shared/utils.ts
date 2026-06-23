export function relativeTime(timestamp: number | null): string {
  if (timestamp === null) return 'never opened'

  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  paused: 1,
  archived: 2,
  completed: 3,
}

export function sortFolders<T extends { isFavorite: boolean; status: string; lastOpenedAt: number | null; createdAt: number }>(
  folders: T[],
): T[] {
  return [...folders].sort((a, b) => {
    // Favorites always first
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    // Then by status order
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    // Within same status: most recently opened first, then newest created
    const aTime = a.lastOpenedAt ?? a.createdAt
    const bTime = b.lastOpenedAt ?? b.createdAt
    return bTime - aTime
  })
}
