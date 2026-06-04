import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
    HomeIcon,
    UsersIcon,
    AcademicCapIcon,
    BookOpenIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import clsx from 'clsx'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Students', href: '/students', icon: UsersIcon },
    { name: 'Programmes', href: '/programmes', icon: AcademicCapIcon },
    { name: 'Units', href: '/units', icon: BookOpenIcon },
    { name: 'Semesters', href: '/semesters', icon: CalendarIcon },
    { name: 'Semester Offerings', href: '/semester-offerings', icon: ClipboardDocumentListIcon },
    { name: 'Grades', href: '/grades', icon: DocumentTextIcon },
    { name: 'Transcripts', href: '/transcripts', icon: AcademicCapIcon },
    { name: 'Users', href: '/users', icon: UserGroupIcon },
]

function NavItems({ onItemClick }: { onItemClick?: () => void }) {
    return (
        <div className="space-y-0.5">
            {navigation.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                        clsx(
                            'group flex items-center gap-3 px-3 py-2 text-sm rounded-r-lg border-l-2',
                            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-forest-500',
                            isActive
                                ? 'bg-forest-50 text-forest-700 font-medium border-forest-700'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        )
                    }
                    onClick={onItemClick}
                >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                </NavLink>
            ))}
        </div>
    )
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <div className={clsx(
                'fixed inset-0 z-50 lg:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 items-center justify-between px-4">
                        <span className="text-xl font-black tracking-tight text-forest-700">ARTAS</span>
                        <button onClick={() => setSidebarOpen(false)}>
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 px-3 py-4">
                        <NavItems onItemClick={() => setSidebarOpen(false)} />
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex h-16 items-center px-4 border-b border-gray-200">
                        <span className="text-xl font-black tracking-tight text-forest-700">ARTAS</span>
                    </div>
                    <nav className="flex-1 px-3 py-4">
                        <NavItems />
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6">
                        <div className="flex items-center gap-x-4">
                            <span className="text-sm font-medium text-gray-700">
                                {user?.full_name}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
                                {user?.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
