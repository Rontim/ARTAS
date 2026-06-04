import {
    Dialog,
    DialogPanel,
    DialogTitle,
    DialogBackdrop,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className,
}: ModalProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition duration-150 ease-out data-[closed]:opacity-0"
            />

            <DialogPanel
                transition
                className={clsx(
                    'relative bg-white rounded-2xl shadow-xl w-full flex flex-col',
                    'transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:scale-95',
                    sizeMap[size],
                    className
                )}
            >
                {/* Header */}
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <DialogTitle className="text-base font-semibold text-gray-900">
                        {title}
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={onClose}
                        className={clsx(
                            '-mr-2 p-1.5 rounded-lg text-gray-400',
                            'hover:bg-gray-100 hover:text-gray-600',
                            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-1',
                            'transition-colors duration-150'
                        )}
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto max-h-[70vh] flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </DialogPanel>
        </Dialog>
    )
}
