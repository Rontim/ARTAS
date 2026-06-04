import clsx from 'clsx'

interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
    className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
    return (
        <div className={clsx('sm:flex sm:items-center sm:justify-between mb-6', className)}>
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {action && (
                <div className="mt-4 sm:mt-0 sm:ml-8 flex-shrink-0">{action}</div>
            )}
        </div>
    )
}
