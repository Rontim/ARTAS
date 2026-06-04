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

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar */}
            <div className={clsx(
                'fixed inset-0 z-50 lg:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 items-center justify-between px-4">
                        <span className="text-xl font-bold text-forest-600">ARTAS</span>
                        <button onClick={() => setSidebarOpen(false)}>
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    clsx(
                                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                        isActive
                                            ? 'bg-forest-100 text-forest-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    )
                                }
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex h-16 items-center px-4 border-b border-gray-200">
                        <span className="text-xl font-bold text-forest-600">ARTAS</span>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    clsx(
                                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                        isActive
                                            ? 'bg-forest-100 text-forest-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    )
                                }
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6">
                        <div className="flex items-center gap-x-4">
                            <span className="text-sm text-gray-700">
                                {user?.full_name}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-medium text-forest-800">
                                {user?.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
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
