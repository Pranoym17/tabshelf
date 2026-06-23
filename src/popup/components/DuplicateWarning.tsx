interface Duplicate {
  title: string
  folderName: string
}

interface Props {
  duplicates: Duplicate[]
  onSaveAnyway: () => void
  onCancel: () => void
}

export default function DuplicateWarning({ duplicates, onSaveAnyway, onCancel }: Props) {
  // Group by folder name for a cleaner display
  const byFolder = duplicates.reduce<Record<string, string[]>>((acc, d) => {
    acc[d.folderName] = acc[d.folderName] ?? []
    acc[d.folderName].push(d.title)
    return acc
  }, {})

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-amber-500 text-xl mt-0.5" aria-hidden>⚠️</span>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              Duplicate tabs found
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Some tabs are already saved in another folder.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-5 max-h-40 overflow-y-auto">
          {Object.entries(byFolder).map(([folderName, titles]) => (
            <div key={folderName} className="text-xs">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                "{folderName}"
              </p>
              <ul className="mt-0.5 space-y-0.5 pl-3">
                {titles.map((title) => (
                  <li
                    key={title}
                    className="text-gray-500 dark:text-gray-400 truncate"
                  >
                    · {title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-medium py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSaveAnyway}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Save anyway
          </button>
        </div>
      </div>
    </div>
  )
}
