import { useEffect, useState } from 'react'
import type { Folder } from '../types'
import { getAllFolders } from '../storage/folders'
import { sortFolders } from '../shared/utils'
import FolderList from './components/FolderList'

type View = 'list' | 'save' | 'detail'

export default function Popup() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getAllFolders().then((f) => {
      setFolders(sortFolders(f))
      setLoading(false)
    })
  }, [])

  function handleSelectFolder(id: string) {
    setSelectedId(id)
    setView('detail')
  }

  function handleSaveClick() {
    setView('save')
  }

  function handleBack() {
    setSelectedId(null)
    setView('list')
  }

  return (
    <div className="w-[400px] h-[560px] flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        {view !== 'list' ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>🗂️</span>
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">
              TabShelf
            </span>
            {!loading && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
              </span>
            )}
          </div>
        )}

        {view === 'list' && (
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <span aria-hidden>+</span>
            <span>Save tabs</span>
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Loading…</span>
            </div>
          </div>
        ) : view === 'list' ? (
          <FolderList
            folders={folders}
            onSelectFolder={handleSelectFolder}
            onSaveClick={handleSaveClick}
          />
        ) : view === 'save' ? (
          // Placeholder — wired in Step 6
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              Save flow coming in Step 6
            </p>
          </div>
        ) : view === 'detail' && selectedId ? (
          // Placeholder — wired in Step 7
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              Folder detail coming in Step 7
              <br />
              <span className="font-mono text-xs">{selectedId}</span>
            </p>
          </div>
        ) : null}
      </main>
    </div>
  )
}
