import type { Folder } from '../../types'
import { sortFolders } from '../../shared/utils'
import FolderCard from './FolderCard'

interface Props {
  folders: Folder[]
  onSelectFolder: (id: string) => void
  onSaveClick: () => void
}

export default function FolderList({ folders, onSelectFolder, onSaveClick }: Props) {
  const sorted = sortFolders(folders)

  if (sorted.length === 0) {
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
          <button
            onClick={onSaveClick}
            className="text-indigo-500 hover:underline"
          >
            Save current tabs
          </button>{' '}
          to turn this window into a folder.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sorted.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onClick={() => onSelectFolder(folder.id)}
        />
      ))}
    </div>
  )
}
