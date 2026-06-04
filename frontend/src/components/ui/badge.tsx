import clsx from 'clsx'

type BadgeVariant =
    | 'active' | 'inactive'
    | 'pass' | 'fail'
    | 'pending'
    | 'grade-A' | 'grade-B' | 'grade-C' | 'grade-D' | 'grade-E'

interface BadgeProps {
    variant: BadgeVariant
    children: React.ReactNode
    className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
    active: 'bg-forest-100 text-forest-800',
    pass: 'bg-forest-100 text-forest-800',
    'grade-A': 'bg-forest-100 text-forest-800',
    inactive: 'bg-red-100 text-red-700',
    fail: 'bg-red-100 text-red-700',
    'grade-E': 'bg-red-100 text-red-700',
    pending: 'bg-gold-100 text-gold-700',
    'grade-C': 'bg-gold-100 text-gold-700',
    'grade-B': 'bg-blue-100 text-blue-700',
    'grade-D': 'bg-orange-100 text-orange-700',
}

export function Badge({ variant, children, className }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
