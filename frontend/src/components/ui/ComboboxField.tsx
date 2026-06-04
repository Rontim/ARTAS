import type { ReactNode } from 'react'
import { useState } from 'react'
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export interface ComboboxOption {
    value: string
    label: string
    description?: string
    badge?: string
}

interface ComboboxFieldProps {
    label?: ReactNode
    value: string
    onChange: (value: string) => void
    options: ComboboxOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function ComboboxField({
    label,
    value,
    onChange,
    options,
    placeholder = 'Search…',
    className,
    disabled,
}: ComboboxFieldProps) {
    const [query, setQuery] = useState('')

    const filtered =
        query === ''
            ? options
            : options.filter((o) =>
                  o.label.toLowerCase().includes(query.toLowerCase()) ||
                  o.description?.toLowerCase().includes(query.toLowerCase())
              )

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}
            <Combobox
                value={value}
                onChange={(val) => {
                    onChange(val ?? '')
                    setQuery('')
                }}
                disabled={disabled}
            >
                <div className="relative">
                    <div
                        className={clsx(
                            'relative w-full flex items-center rounded-md bg-white border border-gray-300 shadow-sm',
                            'focus-within:ring-2 focus-within:ring-forest-500 focus-within:border-forest-500',
                            disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
                        )}
                    >
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />
                        <ComboboxInput
                            className="w-full py-2 pl-2 pr-10 text-sm bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                            displayValue={(val: string) =>
                                options.find((o) => o.value === val)?.label ?? ''
                            }
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </ComboboxButton>
                    </div>

                    <ComboboxOptions
                        transition
                        className={clsx(
                            'absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1',
                            'shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm',
                            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 data-[enter]:data-[closed]:opacity-0'
                        )}
                    >
                        {filtered.length === 0 ? (
                            <div className="py-3 px-4 text-sm text-gray-400">
                                {query ? `No results for "${query}"` : 'No options available'}
                            </div>
                        ) : (
                            filtered.map((option) => (
                                <ComboboxOption
                                    key={option.value}
                                    value={option.value}
                                    className="group relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 data-[focus]:bg-forest-600 data-[focus]:text-white"
                                >
                                    <div>
                                        <span className="flex items-center gap-2 truncate font-normal group-data-[selected]:font-semibold">
                                            <span className="truncate">{option.label}</span>
                                            {option.badge && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 group-data-[focus]:bg-forest-500 group-data-[focus]:text-white flex-shrink-0">
                                                    {option.badge}
                                                </span>
                                            )}
                                        </span>
                                        {option.description && (
                                            <span className="block text-xs text-gray-400 group-data-[focus]:text-forest-200 truncate mt-0.5">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-forest-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                                        <CheckIcon className="h-4 w-4" />
                                    </span>
                                </ComboboxOption>
                            ))
                        )}
                    </ComboboxOptions>
                </div>
            </Combobox>
        </div>
    )
}
