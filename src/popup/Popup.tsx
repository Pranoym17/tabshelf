import { useEffect, useState } from 'react'
import type { Folder } from '../types'
import { getAllFolders } from '../storage/folders'
import { sortFolders } from '../shared/utils'
import FolderList from './components/FolderList'
import SaveFlow from './components/SaveFlow'
import FolderDetail from './components/FolderDetail'

type View = 'list' | 'save' | 'detail'

function SkeletonCards() {
  return (
    <div className="flex-1 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-start gap-3">
          <div className="mt-1 w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-2.5 w-1/3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Popup() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getAllFolders()
      .then((f) => {
        setFolders(sortFolders(f))
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  // Keep extension icon badge in sync with folder count
  useEffect(() => {
    if (loading) return
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' })
    chrome.action.setBadgeText({
      text: folders.length > 0 ? String(folders.length) : '',
    })
  }, [folders.length, loading])

  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null

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

  function handleSaved(folder: Folder) {
    setFolders((prev) => sortFolders([...prev, folder]))
    setView('list')
  }

  function handleFolderUpdate(updated: Folder) {
    setFolders((prev) => sortFolders(prev.map((f) => (f.id === updated.id ? updated : f))))
  }

  function handleFolderDelete(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setSelectedId(null)
    setView('list')
  }

  return (
    <div className="w-[400px] h-[560px] flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        {view !== 'list' ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              className="shrink-0 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <span aria-hidden>←</span>
              <span>Back</span>
            </button>
            {view === 'detail' && selectedFolder && (
              <>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {selectedFolder.name}
                </span>
              </>
            )}
            {view === 'save' && (
              <>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Save tabs
                </span>
              </>
            )}
          </div>
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
          <SkeletonCards />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Could not open storage. Try reloading the extension.
            </p>
            <button
              onClick={() => { setLoadError(false); setLoading(true); getAllFolders().then((f) => { setFolders(sortFolders(f)); setLoading(false) }).catch(() => { setLoadError(true); setLoading(false) }) }}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Retry
            </button>
          </div>
        ) : view === 'list' ? (
          <FolderList
            folders={folders}
            onSelectFolder={handleSelectFolder}
            onSaveClick={handleSaveClick}
          />
        ) : view === 'save' ? (
          <SaveFlow
            existingFolders={folders}
            onSaved={handleSaved}
            onCancel={handleBack}
            onFolderUpdate={handleFolderUpdate}
          />
        ) : view === 'detail' && selectedFolder ? (
          <FolderDetail
            folder={selectedFolder}
            onUpdate={handleFolderUpdate}
            onDelete={handleFolderDelete}
          />
        ) : null}
      </main>
    </div>
  )
}
