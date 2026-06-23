import type { Folder } from '../../types'
import { relativeTime } from '../../shared/utils'

const STATUS_LABEL: Record<Folder['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
  completed: 'Completed',
}

const STATUS_CLASS: Record<Folder['status'], string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  archived: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  completed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

interface Props {
  folder: Folder
  onClick: () => void
}

export default function FolderCard({ folder, onClick }: Props) {
  const firstLineOfNotes = folder.notes.split('\n')[0].trim()

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 group"
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <span
          className="mt-1 shrink-0 w-3 h-3 rounded-full"
          style={{ backgroundColor: folder.color }}
        />

        <div className="flex-1 min-w-0">
          {/* Top row: name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {folder.name}
            </span>
            {folder.isFavorite && (
              <span className="text-amber-400 text-xs" aria-label="Favorited">
                ★
              </span>
            )}
            <span
              className={`ml-auto shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_CLASS[folder.status]}`}
            >
              {STATUS_LABEL[folder.status]}
            </span>
          </div>

          {/* Notes preview */}
          {firstLineOfNotes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {firstLineOfNotes}
            </p>
          )}

          {/* Meta row: tab count + last opened */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {folder.tabs.length} {folder.tabs.length === 1 ? 'tab' : 'tabs'}
            </span>
            <span className="text-gray-300 dark:text-gray-700 text-xs">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {relativeTime(folder.lastOpenedAt)}
            </span>
          </div>

          {/* Tags */}
          {folder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {folder.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
              {folder.tags.length > 4 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 py-0.5">
                  +{folder.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
