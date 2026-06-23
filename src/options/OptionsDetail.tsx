import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Folder, FolderStatus, Tab } from '../types'
import { updateFolder, deleteFolder, recordFolderOpened } from '../storage/folders'
import { openUrls } from '../shared/messaging'
import { relativeTime } from '../shared/utils'
import ColorPicker from '../popup/components/ColorPicker'

const STATUS_OPTIONS: { value: FolderStatus; label: string }[] = [
  { value: 'active',    label: '🟢 Active' },
  { value: 'paused',    label: '🟡 Paused' },
  { value: 'archived',  label: '🔵 Archived' },
  { value: 'completed', label: '✅ Completed' },
]

interface Props {
  folder: Folder
  onUpdate: (folder: Folder) => void
  onDelete: (id: string) => void
}

export default function OptionsDetail({ folder, onUpdate, onDelete }: Props) {
  const [name, setName] = useState(folder.name)
  const [color, setColor] = useState(folder.color)
  const [notes, setNotes] = useState(folder.notes)
  const [tags, setTags] = useState<string[]>(folder.tags)
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<FolderStatus>(folder.status)
  const [isFavorite, setIsFavorite] = useState(folder.isFavorite)
  const [tabs, setTabs] = useState<Tab[]>(folder.tabs)

  const [nameError, setNameError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [opening, setOpening] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set())

  // Reset all local state when navigating to a different folder
  useEffect(() => {
    setName(folder.name)
    setColor(folder.color)
    setNotes(folder.notes)
    setTags(folder.tags)
    setTagInput('')
    setStatus(folder.status)
    setIsFavorite(folder.isFavorite)
    setTabs(folder.tabs)
    setNameError(false)
    setDirty(false)
    setConfirmDelete(false)
    setSelectedTabIds(new Set())
  }, [folder.id])

  function mark() { setDirty(true) }

  function commitTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((p) => { mark(); return [...p, t] })
    setTagInput('')
  }

  function toggleTab(id: string) {
    setSelectedTabIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedTabIds(
      selectedTabIds.size === tabs.length
        ? new Set()
        : new Set(tabs.map((t) => t.id)),
    )
  }

  async function handleSave() {
    if (!name.trim()) { setNameError(true); return }
    setSaving(true)
    try {
      const updated: Folder = { ...folder, name: name.trim(), color, notes, tags, status, isFavorite, tabs }
      await updateFolder(updated)
      onUpdate(updated)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleOpen(openTabs: Tab[], newWindow = false) {
    if (openTabs.length === 0) return
    setOpening(true)
    try {
      await recordFolderOpened(folder.id)
      await openUrls(openTabs.map((t) => t.url), newWindow)
      onUpdate({ ...folder, lastOpenedAt: Date.now(), openCount: folder.openCount + 1 })
    } finally {
      setOpening(false)
    }
  }

  async function handleDelete() {
    await deleteFolder(folder.id)
    onDelete(folder.id)
  }

  const selectedCount = selectedTabIds.size

  return (
    <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
      {/* Folder identity */}
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false); mark() }}
              placeholder="Folder name"
              className={`w-full text-xl font-bold bg-transparent border-b-2 pb-1 text-gray-900 dark:text-white focus:outline-none transition-colors ${
                nameError
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400'
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">Name is required</p>}
          </div>

          {/* Meta controls row */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as FolderStatus); mark() }}
              className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => { setIsFavorite(e.target.checked); mark() }}
                className="accent-indigo-600"
              />
              <span>Favorite ★</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Color</span>
              <ColorPicker value={color} onChange={(c) => { setColor(c); mark() }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{folder.tabs.length} tabs</span>
            <span>·</span>
            <span>opened {folder.openCount} times</span>
            <span>·</span>
            <span>last {relativeTime(folder.lastOpenedAt)}</span>
            <span>·</span>
            <span>created {new Date(folder.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); mark() }}
          placeholder="What's this project about? Goals, context, links to remember…"
          rows={5}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[40px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
            >
              {tag}
              <button
                type="button"
                onClick={() => { setTags((p) => p.filter((t) => t !== tag)); mark() }}
                className="hover:text-indigo-900 dark:hover:text-indigo-200 leading-none"
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
              if (e.key === 'Enter') { e.preventDefault(); commitTag() }
              else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                setTags((p) => p.slice(0, -1)); mark()
              }
            }}
            onBlur={commitTag}
            placeholder={tags.length === 0 ? 'Add tags…' : ''}
            className="flex-1 min-w-[80px] text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tabs ({tabs.length})
          </label>
          <div className="flex items-center gap-3">
            {tabs.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                {selectedCount === tabs.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
            <button
              onClick={() => handleOpen(tabs)}
              disabled={opening || tabs.length === 0}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
            >
              {opening ? 'Opening…' : 'Open All'}
            </button>
            <button
              onClick={() => handleOpen(tabs.filter((t) => selectedTabIds.has(t.id)))}
              disabled={opening || selectedCount === 0}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Open Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>
            <button
              onClick={() => handleOpen(tabs, true)}
              disabled={opening || tabs.length === 0}
              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-40"
            >
              New window →
            </button>
          </div>
        </div>

        {tabs.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            No tabs in this folder.
          </p>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-900 group"
              >
                <input
                  type="checkbox"
                  checked={selectedTabIds.has(tab.id)}
                  onChange={() => toggleTab(tab.id)}
                  className="accent-indigo-600 shrink-0"
                />
                {tab.faviconUrl && (
                  <img
                    src={tab.faviconUrl}
                    alt=""
                    className="w-4 h-4 shrink-0 rounded-sm"
                    onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{tab.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tab.url}</p>
                </div>
                <button
                  onClick={() => { setTabs((p) => p.filter((t) => t.id !== tab.id)); mark() }}
                  className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${tab.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save + Delete row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Delete this folder?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="text-sm font-medium text-red-500 hover:text-red-700"
            >
              Yes, delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Delete folder
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="text-sm font-medium px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-default text-white transition-colors"
        >
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
        </button>
      </div>
    </div>
  )
}
