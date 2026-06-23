interface Props {
  allTags: string[]
  activeTag: string | null
  onToggle: (tag: string) => void
}

export default function TagFilter({ allTags, activeTag, onToggle }: Props) {
  if (allTags.length === 0) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`shrink-0 text-[10px] px-2 py-1 rounded-full border transition-colors ${
            activeTag === tag
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
