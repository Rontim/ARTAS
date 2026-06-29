import React, { forwardRef, useMemo } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, parse, isValid } from 'date-fns'
import { Field, Label, Description } from '@headlessui/react'
import { CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const DATE_VALUE_FORMAT = 'yyyy-MM-dd'
const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function parseValue(value: string | null | undefined): Date | null {
    if (!value) return null
    const parsed = parse(value, DATE_VALUE_FORMAT, new Date())
    return isValid(parsed) ? parsed : null
}

function getYearOptions(): number[] {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = currentYear + 10; y >= currentYear - 100; y--) years.push(y)
    return years
}

const YEAR_OPTIONS = getYearOptions()

const triggerBase =
    'flex w-full items-center justify-between rounded-lg border-0 py-2 px-3 text-sm text-left text-gray-900 ' +
    'ring-1 ring-inset ring-gray-300 shadow-sm cursor-pointer ' +
    'focus:ring-2 focus:ring-inset focus:ring-forest-500 focus:outline-none ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ' +
    'transition-shadow duration-150'

const triggerError = 'ring-red-400 focus:ring-red-500'

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    displayValue?: string
    placeholder?: string
    error?: boolean
    onClear?: () => void
}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
    { displayValue, placeholder = 'Select date', error, onClear, className, ...props },
    ref
) {
    return (
        <button
            type="button"
            ref={ref}
            className={clsx(triggerBase, error && triggerError, className)}
            {...props}
        >
            <span className={clsx(!displayValue && 'text-gray-400')}>
                {displayValue || placeholder}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                {displayValue && onClear && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation()
                            onClear()
                        }}
                        className="text-gray-300 hover:text-gray-500 transition-colors duration-150"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </span>
                )}
                <CalendarIcon className="h-4 w-4 text-gray-400" />
            </span>
        </button>
    )
})

interface DatePickerProps {
    label?: string
    value: string | null | undefined
    onChange: (value: string) => void
    error?: string
    description?: string
    placeholder?: string
    minDate?: string
    maxDate?: string
    disabled?: boolean
    className?: string
}

export function DatePicker({
    label,
    value,
    onChange,
    error,
    description,
    placeholder,
    minDate,
    maxDate,
    disabled,
    className,
}: DatePickerProps) {
    const selected = useMemo(() => parseValue(value), [value])
    const min = useMemo(() => parseValue(minDate), [minDate])
    const max = useMemo(() => parseValue(maxDate), [maxDate])

    return (
        <Field className={className}>
            {label && (
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                    {label}
                </Label>
            )}
            <ReactDatePicker
                selected={selected}
                onChange={(date: Date | null) => onChange(date ? format(date, DATE_VALUE_FORMAT) : '')}
                minDate={min ?? undefined}
                maxDate={max ?? undefined}
                disabled={disabled}
                dateFormat={DATE_DISPLAY_FORMAT}
                portalId="date-picker-portal"
                calendarClassName="rounded-xl shadow-xl border border-gray-100 p-2 font-sans"
                dayClassName={(date: Date) => {
                    if (selected && date.toDateString() === selected.toDateString()) {
                        return 'bg-forest-700 text-white rounded-full hover:bg-forest-700'
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        return 'font-semibold text-forest-700'
                    }
                    return ''
                }}
                renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="flex items-center justify-between px-2 py-1">
                        <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="p-1 rounded-lg text-forest-700 hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            <select
                                value={date.getMonth()}
                                onChange={(e) => changeMonth(Number(e.target.value))}
                                className="text-sm rounded-md ring-1 ring-gray-200 border-0 py-1 pl-2 pr-6 text-gray-700 focus:ring-2 focus:ring-forest-500 focus:outline-none"
                            >
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={name} value={i}>{name}</option>
                                ))}
                            </select>
                            <select
                                value={date.getFullYear()}
                                onChange={(e) => changeYear(Number(e.target.value))}
                                className="text-sm rounded-md ring-1 ring-gray-200 border-0 py-1 pl-2 pr-6 text-gray-700 focus:ring-2 focus:ring-forest-500 focus:outline-none"
                            >
                                {YEAR_OPTIONS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="p-1 rounded-lg text-forest-700 hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
                customInput={
                    <Trigger
                        displayValue={selected ? format(selected, DATE_DISPLAY_FORMAT) : ''}
                        placeholder={placeholder}
                        error={!!error}
                        onClear={() => onChange('')}
                    />
                }
            />
            {description && !error && (
                <Description className="text-xs text-gray-500 mt-1">
                    {description}
                </Description>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </Field>
    )
}
