import {
    Field,
    Label,
    Checkbox as HuiCheckbox,
    Description,
} from '@headlessui/react'
import clsx from 'clsx'

interface CheckboxProps {
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export function Checkbox({
    label,
    description,
    checked,
    onChange,
    disabled,
    className,
}: CheckboxProps) {
    return (
        <Field className={clsx('flex items-start gap-3', className)}>
            <HuiCheckbox
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className={clsx(
                    'group h-4 w-4 rounded border border-gray-300 bg-white',
                    'flex items-center justify-center flex-shrink-0 mt-0.5',
                    'transition-colors duration-150 cursor-pointer',
                    'data-[checked]:bg-forest-700 data-[checked]:border-forest-700',
                    'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-1',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                {/* White checkmark — visible only when checked via group-data-[checked] */}
                <svg
                    className="hidden group-data-[checked]:block w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </HuiCheckbox>
            <div>
                <Label className="text-sm font-medium text-gray-700 cursor-pointer">
                    {label}
                </Label>
                {description && (
                    <Description className="text-xs text-gray-500">
                        {description}
                    </Description>
                )}
            </div>
        </Field>
    )
}
