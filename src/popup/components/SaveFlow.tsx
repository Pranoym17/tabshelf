import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Folder, Tab } from '../../types'
import { createFolder, updateFolder } from '../../storage/folders'
import { getCurrentTabs, closeTabs } from '../../shared/messaging'
import ColorPicker, { DEFAULT_COLOR } from './ColorPicker'
import DuplicateWarning from './DuplicateWarning'

interface Duplicate {
  title: string
  folderName: string
}

interface Props {
  existingFolders: Folder[]
  onSaved: (folder: Folder) => void
  onCancel: () => void
  onFolderUpdate?: (folder: Folder) => void
}

export default function SaveFlow({ existingFolders, onSaved, onCancel, onFolderUpdate }: Props) {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])
  const [loadingTabs, setLoadingTabs] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)

  const [saving, setSaving] = useState(false)
  const [duplicates, setDuplicates] = useState<Duplicate[] | null>(null)
  const [nameError, setNameError] = useState(false)
  const [addingToFolderTabId, setAddingToFolderTabId] = useState<number | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCurrentTabs()
      .then((chromeTabs) => {
        const usable = chromeTabs.filter(
          (t) => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'),
        )
        setTabs(usable)
        setSelectedIds(new Set(usable.map((t) => t.id!).filter(Boolean)))
      })
      .finally(() => setLoadingTabs(false))

    setTimeout(() => nameRef.current?.focus(), 50)
  }, [])

  function toggleTab(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === tabs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tabs.map((t) => t.id!).filter(Boolean)))
    }
  }

  function commitTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function findDuplicates(selectedTabs: chrome.tabs.Tab[]): Duplicate[] {
    const results: Duplicate[] = []
    for (const tab of selectedTabs) {
      if (!tab.url) continue
      for (const folder of existingFolders) {
        if (folder.tabs.some((t) => t.url === tab.url)) {
          results.push({ title: tab.title ?? tab.url, folderName: folder.name })
        }
      }
    }
    return results
  }

  async function handleAddToFolder(chromeTab: chrome.tabs.Tab, folder: Folder) {
    setAddingToFolderTabId(null)
    const newTab: Tab = {
      id: uuidv4(),
      url: chromeTab.url!,
      title: chromeTab.title ?? chromeTab.url!,
      faviconUrl: chromeTab.favIconUrl ?? null,
    }
    // Skip if URL already exists in the target folder
    const updatedTabs = folder.tabs.some((t) => t.url === newTab.url)
      ? folder.tabs
      : [...folder.tabs, newTab]
    const updatedFolder: Folder = { ...folder, tabs: updatedTabs }
    await updateFolder({ id: folder.id, tabs: updatedFolder.tabs })
    onFolderUpdate?.(updatedFolder)

    if (chromeTab.id != null) {
      await closeTabs([chromeTab.id])
    }
    setTabs((prev) => prev.filter((t) => t.id !== chromeTab.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (chromeTab.id != null) next.delete(chromeTab.id)
      return next
    })
  }

  async function performSave() {
    const selectedTabs = tabs.filter((t) => t.id != null && selectedIds.has(t.id))
    const tabsToSave: Tab[] = selectedTabs.map((t) => ({
      id: uuidv4(),
      url: t.url!,
      title: t.title ?? t.url!,
      faviconUrl: t.favIconUrl ?? null,
    }))

    setSaving(true)
    try {
      const folder = await createFolder({
        name: name.trim(),
        color,
        notes,
        tags,
        status: 'active',
        isFavorite: false,
        tabs: tabsToSave,
      })
      const tabIds = selectedTabs.map((t) => t.id!)
      await closeTabs(tabIds)
      onSaved(folder)
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      nameRef.current?.focus()
      return
    }

    const selectedTabs = tabs.filter((t) => t.id != null && selectedIds.has(t.id))
    const dupes = findDuplicates(selectedTabs)
    if (dupes.length > 0) {
      setDuplicates(dupes)
      return
    }

    performSave()
  }

  const selectedCount = selectedIds.size

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Save as project
          </p>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Folder name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false) }}
              placeholder="e.g. PC Build Research"
              className={`w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                nameError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">Name is required</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's this project about?"
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[36px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200 leading-none"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitTag()
                  } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                    setTags((prev) => prev.slice(0, -1))
                  }
                }}
                onBlur={commitTag}
                placeholder={tags.length === 0 ? 'Add tags…' : ''}
                className="flex-1 min-w-[80px] text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Press Enter to add a tag
            </p>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Tabs to save
              </label>
              {!loadingTabs && tabs.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[10px] text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  {selectedIds.size === tabs.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            {loadingTabs ? (
              <div className="flex items-center gap-2 py-3 text-xs text-gray-400 dark:text-gray-500">
                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading tabs…
              </div>
            ) : tabs.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                No saveable tabs in this window.
              </p>
            ) : (
              <div className="space-y-0.5 max-h-36 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
                {tabs.map((tab) => {
                  const id = tab.id!
                  const checked = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 transition-colors ${
                        checked
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTab(id)}
                        className="accent-indigo-600 shrink-0"
                      />
                      {tab.favIconUrl && (
                        <img
                          src={tab.favIconUrl}
                          alt=""
                          className="w-3.5 h-3.5 shrink-0 rounded-sm"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate min-w-0">
                        {tab.title ?? tab.url}
                      </span>
                      {existingFolders.length > 0 && (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddingToFolderTabId(addingToFolderTabId === id ? null : id)
                            }}
                            className="text-[10px] text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 px-1 py-0.5 rounded leading-none"
                            title="Add to existing folder"
                          >
                            +folder
                          </button>
                          {addingToFolderTabId === id && (
                            <div className="absolute right-0 bottom-full mb-1 z-20 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                              {existingFolders.map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => handleAddToFolder(tab, f)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: f.color }}
                                  />
                                  <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {!loadingTabs && selectedCount > 0 && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                {selectedCount} of {tabs.length} tab{tabs.length !== 1 ? 's' : ''} will be saved and closed
              </p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || selectedCount === 0}
            className="flex-1 text-sm font-medium py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {saving ? 'Saving…' : `Save & Close (${selectedCount})`}
          </button>
        </div>
      </form>

      {/* Duplicate warning overlay */}
      {duplicates && (
        <DuplicateWarning
          duplicates={duplicates}
          onCancel={() => setDuplicates(null)}
          onSaveAnyway={() => {
            setDuplicates(null)
            performSave()
          }}
        />
      )}
    </div>
  )
}
