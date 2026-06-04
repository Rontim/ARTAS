import type { ReactNode } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export interface SelectOption {
    value: string
    label: string
    description?: string
    badge?: string
}

interface SelectFieldProps {
    label?: ReactNode
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select…',
    className,
    disabled,
}: SelectFieldProps) {
    const selected = options.find((o) => o.value === value)

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <ListboxButton
                        className={clsx(
                            'relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left',
                            'border border-gray-300 shadow-sm text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
                            !selected && 'text-gray-400'
                        )}
                    >
                        <span className="flex items-center gap-2 truncate">
                            {selected ? (
                                <>
                                    <span className="truncate">{selected.label}</span>
                                    {selected.badge && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 flex-shrink-0">
                                            {selected.badge}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-400">{placeholder}</span>
                            )}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </span>
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className={clsx(
                            'absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1',
                            'shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm',
                            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 data-[enter]:data-[closed]:opacity-0'
                        )}
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={option.value}
                                value={option.value}
                                className="group relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 data-[focus]:bg-primary-600 data-[focus]:text-white"
                            >
                                <div>
                                    <span className="flex items-center gap-2 truncate font-normal group-data-[selected]:font-semibold">
                                        <span className="truncate">{option.label}</span>
                                        {option.badge && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 group-data-[focus]:bg-primary-500 group-data-[focus]:text-white flex-shrink-0">
                                                {option.badge}
                                            </span>
                                        )}
                                    </span>
                                    {option.description && (
                                        <span className="block text-xs text-gray-400 group-data-[focus]:text-primary-200 truncate mt-0.5">
                                            {option.description}
                                        </span>
                                    )}
                                </div>
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                                    <CheckIcon className="h-4 w-4" />
                                </span>
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    )
}
