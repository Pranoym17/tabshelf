import { useEffect, useMemo, useState } from 'react'
import type { Folder } from '../types'
import { getAllFolders } from '../storage/folders'
import { sortFolders, relativeTime } from '../shared/utils'
import SearchBar from '../popup/components/SearchBar'
import StatusFilter, { type StatusFilterValue } from '../popup/components/StatusFilter'
import TagFilter from '../popup/components/TagFilter'
import OptionsDetail from './OptionsDetail'

// ── Sidebar folder row ────────────────────────────────────────────
function SidebarRow({
  folder,
  selected,
  onClick,
}: {
  folder: Folder
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
        selected
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: folder.color }}
      />
      <span className="flex-1 text-sm truncate font-medium">{folder.name}</span>
      {folder.isFavorite && <span className="text-amber-400 text-xs shrink-0">★</span>}
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {folder.tabs.length}
      </span>
    </button>
  )
}

// ── Stats overview (shown when no folder selected) ────────────────
function StatsOverview({ folders }: { folders: Folder[] }) {
  const stats = useMemo(() => {
    const tagCounts = folders
      .flatMap((f) => f.tags)
      .reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1
        return acc
      }, {})
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    return {
      total: folders.length,
      tabs: folders.reduce((s, f) => s + f.tabs.length, 0),
      opens: folders.reduce((s, f) => s + f.openCount, 0),
      favorites: folders.filter((f) => f.isFavorite).length,
      byStatus: {
        active:    folders.filter((f) => f.status === 'active').length,
        paused:    folders.filter((f) => f.status === 'paused').length,
        archived:  folders.filter((f) => f.status === 'archived').length,
        completed: folders.filter((f) => f.status === 'completed').length,
      },
      topTags,
      mostOpened: [...folders].sort((a, b) => b.openCount - a.openCount).slice(0, 5),
    }
  }, [folders])

  const statCards = [
    { label: 'Folders',   value: stats.total },
    { label: 'Tabs saved', value: stats.tabs },
    { label: 'Total opens', value: stats.opens },
    { label: 'Favorites',  value: stats.favorites },
  ]

  const statusRows = [
    { label: '🟢 Active',    count: stats.byStatus.active },
    { label: '🟡 Paused',    count: stats.byStatus.paused },
    { label: '🔵 Archived',  count: stats.byStatus.archived },
    { label: '✅ Completed', count: stats.byStatus.completed },
  ]

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <span className="text-5xl">📂</span>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          No folders yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
          Open the TabShelf popup and click "Save tabs" to save your first project.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a folder on the left to view and edit it.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center"
          >
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          By status
        </h3>
        <div className="space-y-2">
          {statusRows.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-28 shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full bg-indigo-400 dark:bg-indigo-500 transition-all"
                  style={{
                    width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top tags */}
      {stats.topTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Top tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {tag}
                <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Most opened */}
      {stats.mostOpened.length > 0 && stats.opens > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Most opened
          </h3>
          <div className="space-y-2">
            {stats.mostOpened.filter((f) => f.openCount > 0).map((folder) => (
              <div key={folder.id} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {folder.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {folder.openCount}× · last {relativeTime(folder.lastOpenedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Options page ─────────────────────────────────────────────
export default function Options() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusFilterValue>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    getAllFolders().then((f) => {
      setFolders(sortFolders(f))
      setLoading(false)
    })
  }, [])

  const allTags = useMemo(
    () => [...new Set(folders.flatMap((f) => f.tags))].sort(),
    [folders],
  )

  const sorted = useMemo(() => sortFolders(folders), [folders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((folder) => {
      if (activeStatus !== 'all' && folder.status !== activeStatus) return false
      if (activeTag && !folder.tags.includes(activeTag)) return false
      if (q) {
        return (
          folder.name.toLowerCase().includes(q) ||
          folder.notes.toLowerCase().includes(q) ||
          folder.tags.some((t) => t.includes(q))
        )
      }
      return true
    })
  }, [sorted, query, activeTag, activeStatus])

  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null

  function handleUpdate(updated: Folder) {
    setFolders((prev) => sortFolders(prev.map((f) => (f.id === updated.id ? updated : f))))
  }

  function handleDelete(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setSelectedId(null)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🗂️</span>
            <span className="font-bold text-lg tracking-tight">TabShelf</span>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-3 py-3 space-y-2 border-b border-gray-100 dark:border-gray-800">
          <SearchBar value={query} onChange={setQuery} />
          <StatusFilter value={activeStatus} onChange={setActiveStatus} />
          {allTags.length > 0 && (
            <TagFilter
              allTags={allTags}
              activeTag={activeTag}
              onToggle={(tag) => setActiveTag((prev) => (prev === tag ? null : tag))}
            />
          )}
          {(query || activeTag || activeStatus !== 'all') && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {filtered.length} of {folders.length}
              </span>
              <button
                onClick={() => { setQuery(''); setActiveTag(null); setActiveStatus('all') }}
                className="text-[10px] text-indigo-500 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="space-y-1 px-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
              No folders match
            </p>
          ) : (
            filtered.map((folder) => (
              <SidebarRow
                key={folder.id}
                folder={folder}
                selected={folder.id === selectedId}
                onClick={() => setSelectedId(folder.id)}
              />
            ))
          )}
        </div>

        {/* Sidebar footer */}
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {folders.length} folders · {folders.reduce((s, f) => s + f.tabs.length, 0)} tabs saved
            </p>
          </div>
        )}
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto">
        {selectedFolder ? (
          <OptionsDetail
            key={selectedFolder.id}
            folder={selectedFolder}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <StatsOverview folders={folders} />
        )}
      </main>
    </div>
  )
}
