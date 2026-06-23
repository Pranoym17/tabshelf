import { useMemo, useState } from 'react'
import type { Folder } from '../../types'
import { sortFolders } from '../../shared/utils'
import FolderCard from './FolderCard'
import SearchBar from './SearchBar'
import TagFilter from './TagFilter'
import StatusFilter, { type StatusFilterValue } from './StatusFilter'

interface Props {
  folders: Folder[]
  onSelectFolder: (id: string) => void
  onSaveClick: () => void
}

export default function FolderList({ folders, onSelectFolder, onSaveClick }: Props) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<StatusFilterValue>('all')

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

  const hasFilters = query || activeTag || activeStatus !== 'all'

  function toggleTag(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag))
  }

  function clearFilters() {
    setQuery('')
    setActiveTag(null)
    setActiveStatus('all')
  }

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
          <span className="text-2xl">📂</span>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          No saved projects yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[220px]">
          Click{' '}
          <button onClick={onSaveClick} className="text-indigo-500 hover:underline">
            Save current tabs
          </button>{' '}
          to turn this window into a folder.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Filter bar */}
      <div className="px-3 pt-2 pb-2 space-y-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <SearchBar value={query} onChange={setQuery} />
        <div className="flex items-center gap-2">
          <StatusFilter value={activeStatus} onChange={setActiveStatus} />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto shrink-0 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <TagFilter allTags={allTags} activeTag={activeTag} onToggle={toggleTag} />
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No folders match</p>
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {hasFilters && (
            <p className="px-4 pt-2 pb-1 text-[10px] text-gray-400 dark:text-gray-500">
              {filtered.length} of {folders.length} folders
            </p>
          )}
          {filtered.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => onSelectFolder(folder.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
