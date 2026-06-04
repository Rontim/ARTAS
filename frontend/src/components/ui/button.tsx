import { Button as HuiButton } from '@headlessui/react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    loading?: boolean
    children: React.ReactNode
    className?: string
}

const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'

const variants = {
    primary:
        'bg-forest-700 text-white hover:bg-forest-600 active:bg-forest-800 focus:ring-forest-500 shadow-sm',
    secondary:
        'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-400',
    ghost:
        'text-forest-700 hover:bg-forest-50 active:bg-forest-100 focus:ring-forest-500',
    danger:
        'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus:ring-red-500 shadow-sm',
}

const sizes = {
    md: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
}

function Spinner() {
    return (
        <svg
            className="animate-spin"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <HuiButton
            {...props}
            disabled={disabled || loading}
            className={clsx(base, variants[variant], sizes[size], className)}
        >
            {loading && <Spinner />}
            {children}
        </HuiButton>
    )
}
