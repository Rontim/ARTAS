import {
    Tab as HuiTab,
    TabGroup,
    TabList as HuiTabList,
    TabPanel,
    TabPanels,
} from '@headlessui/react'
import clsx from 'clsx'

export { TabGroup, TabPanels, TabPanel }

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function TabList({ className, children, ...props }: TabListProps) {
    return (
        <HuiTabList className={clsx('flex border-b border-gray-200', className)} {...props}>
            {children}
        </HuiTabList>
    )
}

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
    children: React.ReactNode
}

export function Tab({ className, children, ...props }: TabProps) {
    return (
        <HuiTab
            className={clsx(
                'px-4 py-2.5 text-sm font-medium -mb-px border-b-2 border-transparent',
                'text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'data-[selected]:text-forest-700 data-[selected]:border-forest-700',
                'focus:outline-none transition-colors duration-150 whitespace-nowrap',
                className
            )}
            {...props}
        >
            {children}
        </HuiTab>
    )
}
