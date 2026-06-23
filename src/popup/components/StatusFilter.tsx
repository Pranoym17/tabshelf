import type { FolderStatus } from '../../types'

export type StatusFilterValue = 'all' | FolderStatus

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'paused',    label: 'Paused' },
  { value: 'archived',  label: 'Archived' },
  { value: 'completed', label: 'Done' },
]

interface Props {
  value: StatusFilterValue
  onChange: (status: StatusFilterValue) => void
}

export default function StatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors ${
            value === opt.value
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
