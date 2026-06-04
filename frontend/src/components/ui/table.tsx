import clsx from 'clsx'

interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Table({ className, children, ...props }: TableProps) {
    return (
        <div
            className={clsx('overflow-hidden rounded-xl shadow-sm bg-white', className)}
            {...props}
        >
            <table className="min-w-full divide-y divide-gray-200">{children}</table>
        </div>
    )
}

export function THead({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className={clsx('bg-gray-50', className)} {...props}>
            {children}
        </thead>
    )
}

export function TBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={clsx('divide-y divide-gray-100 bg-white', className)} {...props}>
            {children}
        </tbody>
    )
}

interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
    hoverable?: boolean
}

export function Tr({ className, hoverable = true, children, ...props }: TrProps) {
    return (
        <tr
            className={clsx(
                'transition-colors duration-100',
                hoverable && 'hover:bg-forest-50/40',
                className
            )}
            {...props}
        >
            {children}
        </tr>
    )
}

export function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={clsx(
                'py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap',
                className
            )}
            {...props}
        >
            {children}
        </th>
    )
}

export function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td
            className={clsx('py-3 px-4 text-sm text-gray-900 whitespace-nowrap', className)}
            {...props}
        >
            {children}
        </td>
    )
}
