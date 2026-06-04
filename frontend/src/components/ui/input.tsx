import React from 'react'
import {
    Field,
    Label,
    Input as HuiInput,
    Description,
} from '@headlessui/react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    description?: string
    error?: string
    containerClassName?: string
}

const inputBase =
    'block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ' +
    'ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 shadow-sm ' +
    'focus:ring-2 focus:ring-inset focus:ring-forest-500 focus:outline-none ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ' +
    'transition-shadow duration-150'

const inputError =
    'ring-red-400 focus:ring-red-500 focus:ring-2 focus:ring-inset focus:outline-none'

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    function Input(
        { label, description, error, containerClassName, className, ...props },
        ref
    ) {
        return (
            <Field className={containerClassName}>
                {label && (
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        {label}
                    </Label>
                )}
                <HuiInput
                    ref={ref}
                    className={clsx(
                        inputBase,
                        error && inputError,
                        className
                    )}
                    {...props}
                />
                {description && !error && (
                    <Description className="text-xs text-gray-500 mt-1">
                        {description}
                    </Description>
                )}
                {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                )}
            </Field>
        )
    }
)
