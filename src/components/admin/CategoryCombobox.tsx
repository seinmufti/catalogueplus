import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type CreatableComboboxProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  disabled?: boolean
  required?: boolean
}

function normalizeOption(value: string): string {
  return value.trim()
}

function CreatableCombobox({
  id: idProp,
  label,
  value,
  onChange,
  options,
  disabled,
  required,
}: CreatableComboboxProps) {
  const generatedId = useId()
  const inputId = idProp ?? generatedId
  const listboxId = `${inputId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [localOptions, setLocalOptions] = useState<string[]>([])

  const allOptions = useMemo(() => {
    const merged = [...options, ...localOptions]
    const unique = [...new Set(merged.map((c) => c.trim()).filter(Boolean))]
    unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return unique
  }, [options, localOptions])

  const trimmed = normalizeOption(value)
  const trimmedLower = trimmed.toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmed) return allOptions
    return allOptions.filter((c) => c.toLowerCase().includes(trimmedLower))
  }, [allOptions, trimmed, trimmedLower])

  const exactMatch = useMemo(
    () => allOptions.find((c) => c.toLowerCase() === trimmedLower),
    [allOptions, trimmedLower],
  )

  const showCreateOption = trimmed.length > 0 && !exactMatch

  const optionValues = useMemo(() => {
    const values = [...filtered]
    if (showCreateOption) values.push(trimmed)
    return values
  }, [filtered, showCreateOption, trimmed])

  const [highlightIndex, setHighlightIndex] = useState(-1)

  useEffect(() => {
    setHighlightIndex(-1)
  }, [trimmed, showCreateOption, filtered.length])

  function chooseOption(next: string) {
    const normalized = normalizeOption(next)
    if (!normalized) return
    onChange(normalized)
    setLocalOptions((prev) =>
      prev.some((c) => c.toLowerCase() === normalized.toLowerCase()) ||
      allOptions.some((c) => c.toLowerCase() === normalized.toLowerCase())
        ? prev
        : [...prev, normalized],
    )
    setOpen(false)
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const next = e.relatedTarget as Node | null
    if (rootRef.current?.contains(next)) return
    window.setTimeout(() => setOpen(false), 0)
  }

  function pickFromKeyboard() {
    if (highlightIndex >= 0 && highlightIndex < optionValues.length) {
      chooseOption(optionValues[highlightIndex]!)
      return
    }
    if (exactMatch) {
      chooseOption(exactMatch)
      return
    }
    if (showCreateOption) chooseOption(trimmed)
  }

  function moveHighlight(delta: number) {
    if (optionValues.length === 0) return
    setOpen(true)
    setHighlightIndex((prev) => {
      const next = prev + delta
      if (prev === -1) return delta > 0 ? 0 : optionValues.length - 1
      if (next < 0) return optionValues.length - 1
      if (next >= optionValues.length) return 0
      return next
    })
  }

  useEffect(() => {
    if (highlightIndex < 0 || !open) return
    const el = rootRef.current?.querySelector(
      `[data-combobox-option-index="${highlightIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex, open])

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div ref={rootRef} className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          disabled={disabled}
          required={required}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setHighlightIndex(-1)
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              moveHighlight(1)
              return
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              moveHighlight(-1)
              return
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              pickFromKeyboard()
            }
          }}
          onBlur={handleInputBlur}
        />
        {open && (filtered.length > 0 || showCreateOption) && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-[100] mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-md"
          >
            {filtered.map((option, index) => {
              const highlighted = index === highlightIndex
              return (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value || highlighted}
                >
                  <button
                    type="button"
                    data-combobox-option-index={index}
                    className={cn(
                      'flex w-full px-3 py-2 text-left hover:bg-muted',
                      (option === value || highlighted) && 'bg-muted/70',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      chooseOption(option)
                    }}
                    onMouseEnter={() => setHighlightIndex(index)}
                  >
                    {option}
                  </button>
                </li>
              )
            })}
            {showCreateOption && (
              <li role="option" aria-selected={highlightIndex === filtered.length}>
                <button
                  type="button"
                  data-combobox-option-index={filtered.length}
                  className={cn(
                    'flex w-full px-3 py-2 text-left font-medium text-primary hover:bg-muted',
                    highlightIndex === filtered.length && 'bg-muted/70',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    chooseOption(trimmed)
                  }}
                  onMouseEnter={() => setHighlightIndex(filtered.length)}
                >
                  Create: {trimmed}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

type CategoryComboboxProps = Omit<CreatableComboboxProps, 'label' | 'options'> & {
  label?: string
  categories: string[]
}

export function CategoryCombobox({
  label = 'Category',
  categories,
  ...rest
}: CategoryComboboxProps) {
  return <CreatableCombobox label={label} options={categories} {...rest} />
}

type BrandComboboxProps = Omit<CreatableComboboxProps, 'label' | 'options'> & {
  label?: string
  brands: string[]
}

export function BrandCombobox({ label = 'Brand', brands, ...rest }: BrandComboboxProps) {
  return <CreatableCombobox label={label} options={brands} {...rest} />
}
