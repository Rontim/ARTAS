import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    UsersIcon,
    AcademicCapIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    UserGroupIcon,
    PlusIcon,
    PencilSquareIcon,
    ArrowRightOnRectangleIcon,
    TrashIcon,
    ArrowPathIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'
import { dashboardService } from '../services/dashboardService'
import { useAuthStore } from '../stores/authStore'
import type { ActivityLog } from '../types'

const ACTION_ICONS: Record<string, React.ElementType> = {
    create: PlusIcon,
    update: PencilSquareIcon,
    delete: TrashIcon,
    login: ArrowRightOnRectangleIcon,
    logout: ArrowRightOnRectangleIcon,
    generate: DocumentTextIcon,
    approve: CheckCircleIcon,
    export: DocumentTextIcon,
}

const ACTION_COLORS: Record<string, string> = {
    create: 'text-green-600 bg-green-100',
    update: 'text-blue-600 bg-blue-100',
    delete: 'text-red-600 bg-red-100',
    login: 'text-indigo-600 bg-indigo-100',
    logout: 'text-gray-600 bg-gray-100',
    generate: 'text-orange-600 bg-orange-100',
    approve: 'text-teal-600 bg-teal-100',
    export: 'text-purple-600 bg-purple-100',
}

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500',
    graduated: 'bg-blue-500',
    suspended: 'bg-red-500',
    withdrawn: 'bg-gray-500',
    deferred: 'bg-yellow-500',
}

const GRADE_COLORS: Record<string, string> = {
    pass: 'bg-green-500',
    fail: 'bg-red-500',
    supplementary: 'bg-yellow-500',
    incomplete: 'bg-orange-400',
    exempted: 'bg-blue-400',
    withdrawn: 'bg-gray-400',
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="flex items-center gap-3">
            <span className="w-28 text-xs text-gray-600 capitalize truncate">{label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                />
            </div>
            <span className="w-10 text-xs font-semibold text-gray-700 text-right">{value}</span>
        </div>
    )
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats,
        refetchInterval: 30000,
    })

    const { data: extended, isLoading: extendedLoading } = useQuery({
        queryKey: ['dashboard-extended'],
        queryFn: dashboardService.getExtendedStats,
        refetchInterval: 60000,
    })

    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['dashboard-activities'],
        queryFn: () => dashboardService.getActivities({ page_size: 15 }),
        refetchInterval: 15000,
    })

    const statCards = [
        { name: 'Total Students', value: stats?.total_students ?? '—', icon: UsersIcon, color: 'bg-blue-500', link: '/students' },
        { name: 'Active Students', value: stats?.active_students ?? '—', icon: UsersIcon, color: 'bg-cyan-500', link: '/students' },
        { name: 'Programmes', value: stats?.total_programmes ?? '—', icon: AcademicCapIcon, color: 'bg-green-500', link: '/programmes' },
        { name: 'Units', value: stats?.total_units ?? '—', icon: BookOpenIcon, color: 'bg-purple-500', link: '/units' },
        { name: 'Transcripts', value: stats?.transcripts_generated ?? '—', icon: DocumentTextIcon, color: 'bg-orange-500', link: '/transcripts' },
        { name: 'Pending Requests', value: stats?.pending_requests ?? '—', icon: ClockIcon, color: 'bg-yellow-500', link: '/transcripts' },
        { name: 'Approved Today', value: stats?.approved_today ?? '—', icon: CheckCircleIcon, color: 'bg-teal-500', link: '/transcripts' },
        { name: 'Active Users', value: stats?.total_users ?? '—', icon: UserGroupIcon, color: 'bg-rose-500', link: '/users' },
    ]

    const quickActions = [
        { label: 'Add Student', desc: 'Create new student record', icon: UsersIcon, onClick: () => navigate('/students') },
        { label: 'Enter Marks', desc: 'Enter student grades', icon: ClockIcon, onClick: () => navigate('/grades') },
        { label: 'Generate Transcript', desc: 'Create new transcript', icon: DocumentTextIcon, onClick: () => navigate('/transcripts') },
        { label: 'Manage Programmes', desc: 'View & edit programmes', icon: AcademicCapIcon, onClick: () => navigate('/programmes') },
    ]

    // Computed values for extended widgets
    const statusMax = extended ? Math.max(...Object.values(extended.student_status), 1) : 1
    const progMax = extended?.top_programmes?.length ? extended.top_programmes[0].student_count : 1
    const gradeMax = extended ? Math.max(...Object.values(extended.grade_distribution), 1) : 1
    const trendMax = extended?.enrollment_trend?.length ? Math.max(...extended.enrollment_trend.map(e => e.count), 1) : 1

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome back, {user?.first_name}. Here&apos;s what&apos;s happening in ARTAS.
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <button
                        key={stat.name}
                        onClick={() => navigate(stat.link)}
                        className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow text-left sm:px-6"
                    >
                        <dt>
                            <div className={`absolute rounded-md p-3 ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">
                                {stat.name}
                            </p>
                        </dt>
                        <dd className="ml-16 flex items-baseline">
                            {statsLoading ? (
                                <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
                            ) : (
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stat.value}
                                </p>
                            )}
                        </dd>
                    </button>
                ))}
            </div>

            {/* Charts row: Student Status + Top Programmes + Grade Distribution */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Student Status Breakdown */}
                <div className="rounded-lg bg-white shadow p-5">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        Student Status
                    </h3>
                    <div className="mt-4 space-y-3">
                        {extendedLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="h-5 animate-pulse rounded bg-gray-100" />
                            ))
                        ) : extended?.student_status && Object.keys(extended.student_status).length ? (
                            Object.entries(extended.student_status).map(([status, count]) => (
                                <HorizontalBar
                                    key={status}
                                    label={status}
                                    value={count}
                                    max={statusMax}
                                    color={STATUS_COLORS[status] || 'bg-gray-400'}
                                />
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-4">No students yet</p>
                        )}
                    </div>
                </div>

                {/* Top Programmes */}
                <div className="rounded-lg bg-white shadow p-5">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                        Top Programmes
                    </h3>
                    <div className="mt-4 space-y-3">
                        {extendedLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="h-5 animate-pulse rounded bg-gray-100" />
                            ))
                        ) : extended?.top_programmes?.length ? (
                            extended.top_programmes.map((prog) => (
                                <HorizontalBar
                                    key={prog.code}
                                    label={prog.code}
                                    value={prog.student_count}
                                    max={progMax}
                                    color="bg-indigo-500"
                                />
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-4">No enrollment data</p>
                        )}
                    </div>
                </div>

                {/* Grade Distribution */}
                <div className="rounded-lg bg-white shadow p-5">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <ChartBarIcon className="h-4 w-4 text-gray-400" />
                        Grade Distribution
                    </h3>
                    <div className="mt-4 space-y-3">
                        {extendedLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="h-5 animate-pulse rounded bg-gray-100" />
                            ))
                        ) : extended?.grade_distribution && Object.keys(extended.grade_distribution).length ? (
                            Object.entries(extended.grade_distribution).map(([status, count]) => (
                                <HorizontalBar
                                    key={status}
                                    label={status}
                                    value={count}
                                    max={gradeMax}
                                    color={GRADE_COLORS[status] || 'bg-gray-400'}
                                />
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-4">No results recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Enrollment Trend */}
            <div className="mt-6 rounded-lg bg-white shadow p-5">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4 text-gray-400" />
                    Enrollment Trend (Last 5 Years)
                </h3>
                <div className="mt-4 flex items-end gap-3 h-40">
                    {extendedLoading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full animate-pulse rounded bg-gray-100 h-20" />
                                <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
                            </div>
                        ))
                    ) : extended?.enrollment_trend?.length ? (
                        extended.enrollment_trend.map((entry) => {
                            const pct = trendMax > 0 ? (entry.count / trendMax) * 100 : 0
                            return (
                                <div key={entry.admission_year} className="flex-1 flex flex-col items-center justify-end h-full">
                                    <span className="text-xs font-semibold text-gray-700 mb-1">{entry.count}</span>
                                    <div
                                        className="w-full bg-primary-500 rounded-t transition-all duration-500"
                                        style={{ height: `${Math.max(pct, 4)}%` }}
                                    />
                                    <span className="text-xs text-gray-500 mt-1">{entry.admission_year}</span>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-xs text-gray-400 text-center w-full py-8">No enrollment data available</p>
                    )}
                </div>
            </div>

            {/* Bottom row: Quick Actions + Recent Students + Activity Feed */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                    <div className="mt-4 space-y-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className="w-full relative rounded-lg border border-gray-300 bg-white px-4 py-4 shadow-sm flex items-center space-x-3 hover:border-primary-400 hover:shadow transition-all"
                            >
                                <div className="flex-shrink-0">
                                    <action.icon className="h-6 w-6 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                                    <p className="text-xs text-gray-500">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Students */}
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-medium text-gray-900">Recent Students</h2>
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow">
                        {extendedLoading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
                                ))}
                            </div>
                        ) : extended?.recent_students?.length ? (
                            <ul className="divide-y divide-gray-100">
                                {extended.recent_students.map((s) => (
                                    <li
                                        key={s.id}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/students/${s.id}`)}
                                    >
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {s.first_name} {s.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {s.reg_no} &middot; {s.programme__name}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6">
                                <p className="text-center text-xs text-gray-400">No students yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                        {user?.role === 'admin' && (
                            <span className="text-xs text-gray-400">All users</span>
                        )}
                    </div>
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow">
                        {activitiesLoading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3">
                                        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                                            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activities?.results?.length ? (
                            <ul className="divide-y divide-gray-100">
                                {activities.results.map((activity: ActivityLog) => {
                                    const Icon = ACTION_ICONS[activity.action] || ArrowPathIcon
                                    const colorClass = ACTION_COLORS[activity.action] || 'text-gray-600 bg-gray-100'
                                    return (
                                        <li key={activity.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                                            <div className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${colorClass}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    {activity.description || `${activity.action} ${activity.entity_type}`}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {activity.user_name} &middot; {timeAgo(activity.created_at)}
                                                </p>
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-medium text-gray-400 capitalize">
                                                {activity.entity_type}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="p-6">
                                <p className="text-center text-gray-500">
                                    No recent activity. Start by adding students and entering grades.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
