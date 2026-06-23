// Chrome Tab Group color palette
export const FOLDER_COLORS = [
  { label: 'Blue',   value: '#1A73E8' },
  { label: 'Red',    value: '#D93025' },
  { label: 'Yellow', value: '#F29900' },
  { label: 'Green',  value: '#1E8E3E' },
  { label: 'Pink',   value: '#D01884' },
  { label: 'Purple', value: '#A142F4' },
  { label: 'Cyan',   value: '#007B83' },
  { label: 'Grey',   value: '#5F6368' },
]

export const DEFAULT_COLOR = FOLDER_COLORS[0].value

interface Props {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FOLDER_COLORS.map(({ label, value: color }) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={label}
          aria-pressed={value === color}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ${
            value === color
              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110'
              : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
