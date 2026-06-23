import { useState } from 'react'
import type { Folder, FolderStatus, Tab } from '../../types'
import { updateFolder, deleteFolder } from '../../storage/folders'
import { recordFolderOpened } from '../../storage/folders'
import { openUrls } from '../../shared/messaging'
import { relativeTime } from '../../shared/utils'
import ColorPicker, { FOLDER_COLORS } from './ColorPicker'

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

export default function FolderDetail({ folder, onUpdate, onDelete }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set())
  const [opening, setOpening] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit-mode state — initialised from folder, reset on cancel
  const [editName, setEditName] = useState(folder.name)
  const [editColor, setEditColor] = useState(folder.color)
  const [editNotes, setEditNotes] = useState(folder.notes)
  const [editTags, setEditTags] = useState<string[]>(folder.tags)
  const [editTagInput, setEditTagInput] = useState('')
  const [editStatus, setEditStatus] = useState<FolderStatus>(folder.status)
  const [editIsFavorite, setEditIsFavorite] = useState(folder.isFavorite)
  const [editTabs, setEditTabs] = useState<Tab[]>(folder.tabs)
  const [editNameError, setEditNameError] = useState(false)

  // ── tab selection ──────────────────────────────────────────────
  function toggleTab(id: string) {
    setSelectedTabIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedTabIds(
      selectedTabIds.size === folder.tabs.length
        ? new Set()
        : new Set(folder.tabs.map((t) => t.id)),
    )
  }

  // ── open actions ───────────────────────────────────────────────
  async function handleOpen(tabs: Tab[], newWindow = false) {
    if (tabs.length === 0) return
    setOpening(true)
    try {
      await recordFolderOpened(folder.id)
      await openUrls(tabs.map((t) => t.url), newWindow)
      onUpdate({
        ...folder,
        lastOpenedAt: Date.now(),
        openCount: folder.openCount + 1,
      })
    } finally {
      setOpening(false)
    }
  }

  // ── edit helpers ───────────────────────────────────────────────
  function enterEdit() {
    setEditName(folder.name)
    setEditColor(folder.color)
    setEditNotes(folder.notes)
    setEditTags(folder.tags)
    setEditTagInput('')
    setEditStatus(folder.status)
    setEditIsFavorite(folder.isFavorite)
    setEditTabs(folder.tabs)
    setEditNameError(false)
    setMode('edit')
  }

  function cancelEdit() {
    setMode('view')
  }

  function commitEditTag() {
    const trimmed = editTagInput.trim().toLowerCase()
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags((prev) => [...prev, trimmed])
    }
    setEditTagInput('')
  }

  async function saveEdit() {
    if (!editName.trim()) {
      setEditNameError(true)
      return
    }
    setSaving(true)
    try {
      const updated: Folder = {
        ...folder,
        name: editName.trim(),
        color: editColor,
        notes: editNotes,
        tags: editTags,
        status: editStatus,
        isFavorite: editIsFavorite,
        tabs: editTabs,
      }
      await updateFolder(updated)
      onUpdate(updated)
      setMode('view')
    } finally {
      setSaving(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────
  async function handleDelete() {
    await deleteFolder(folder.id)
    onDelete(folder.id)
  }

  const selectedCount = selectedTabIds.size
  const colorDot = FOLDER_COLORS.find((c) => c.value === folder.color)

  // ═══════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════
  if (mode === 'edit') {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Edit folder
          </p>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditNameError(false) }}
              className={`w-full text-sm px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                editNameError
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {editNameError && (
              <p className="text-xs text-red-500 mt-1">Name is required</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <ColorPicker value={editColor} onChange={setEditColor} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as FolderStatus)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Favorite */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editIsFavorite}
              onChange={(e) => setEditIsFavorite(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Pin to Favorites ★
            </span>
          </label>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What's this project about?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[36px]">
              {editTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setEditTags((p) => p.filter((t) => t !== tag))}
                    className="hover:text-indigo-900 dark:hover:text-indigo-200 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEditTag() }
                  else if (e.key === 'Backspace' && !editTagInput && editTags.length > 0) {
                    setEditTags((p) => p.slice(0, -1))
                  }
                }}
                onBlur={commitEditTag}
                placeholder={editTags.length === 0 ? 'Add tags…' : ''}
                className="flex-1 min-w-[80px] text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabs */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tabs ({editTabs.length})
            </p>
            {editTabs.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">No tabs.</p>
            ) : (
              <div className="space-y-0.5 max-h-40 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
                {editTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 group bg-white dark:bg-gray-900"
                  >
                    {tab.faviconUrl && (
                      <img src={tab.faviconUrl} alt="" className="w-3.5 h-3.5 shrink-0 rounded-sm" />
                    )}
                    <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">
                      {tab.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditTabs((p) => p.filter((t) => t.id !== tab.id))}
                      className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${tab.title}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={cancelEdit}
            className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={saving}
            className="flex-1 text-sm font-medium py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Folder identity header */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <span
              className="mt-1 shrink-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: folder.color }}
              title={colorDot?.label}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug break-words">
                {folder.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {folder.status}
                </span>
                {folder.isFavorite && (
                  <span className="text-amber-400 text-xs">★ Favorite</span>
                )}
              </div>
            </div>
            <button
              onClick={enterEdit}
              className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Edit
            </button>
          </div>

          {/* Notes */}
          {folder.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 whitespace-pre-wrap">
              {folder.notes}
            </p>
          )}

          {/* Tags */}
          {folder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {folder.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
            <span>{folder.tabs.length} {folder.tabs.length === 1 ? 'tab' : 'tabs'}</span>
            <span>·</span>
            <span>opened {folder.openCount} {folder.openCount === 1 ? 'time' : 'times'}</span>
            <span>·</span>
            <span>last {relativeTime(folder.lastOpenedAt)}</span>
          </div>
        </div>

        {/* Tab list */}
        <div className="px-4 pt-2">
          {folder.tabs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
              No tabs in this folder.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectedCount === folder.tabs.length && folder.tabs.length > 0}
                    onChange={toggleAll}
                    className="accent-indigo-600"
                  />
                  <span>
                    {selectedCount > 0
                      ? `${selectedCount} of ${folder.tabs.length} selected`
                      : 'Select all'}
                  </span>
                </label>
              </div>
              <div className="space-y-0.5 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                {folder.tabs.map((tab) => {
                  const checked = selectedTabIds.has(tab.id)
                  return (
                    <label
                      key={tab.id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50 dark:bg-gray-800/50 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTab(tab.id)}
                        className="accent-indigo-600 shrink-0"
                      />
                      {tab.faviconUrl && (
                        <img
                          src={tab.faviconUrl}
                          alt=""
                          className="w-3.5 h-3.5 shrink-0 rounded-sm"
                          onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {tab.title}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                          {tab.url}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleOpen(folder.tabs)}
            disabled={opening || folder.tabs.length === 0}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
          >
            {opening ? 'Opening…' : 'Open All'}
          </button>
          <button
            onClick={() => handleOpen(folder.tabs.filter((t) => selectedTabIds.has(t.id)))}
            disabled={opening || selectedCount === 0}
            className="flex-1 text-xs font-medium py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            Open Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => handleOpen(folder.tabs, true)}
            disabled={opening || folder.tabs.length === 0}
            className="text-[10px] text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-40"
          >
            Open in new window →
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Delete folder?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-[10px] font-medium text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Delete folder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
