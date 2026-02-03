import {
    UsersIcon,
    AcademicCapIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

const stats = [
    { name: 'Total Students', value: '0', icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Programmes', value: '0', icon: AcademicCapIcon, color: 'bg-green-500' },
    { name: 'Units', value: '0', icon: BookOpenIcon, color: 'bg-purple-500' },
    { name: 'Transcripts Generated', value: '0', icon: DocumentTextIcon, color: 'bg-orange-500' },
    { name: 'Pending Requests', value: '0', icon: ClockIcon, color: 'bg-yellow-500' },
    { name: 'Approved Today', value: '0', icon: CheckCircleIcon, color: 'bg-teal-500' },
]

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
                Welcome to the Academic Records & Transcript Automation System
            </p>

            {/* Stats grid */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
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
                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <div className="flex-shrink-0">
                            <UsersIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="absolute inset-0" />
                            <p className="text-sm font-medium text-gray-900">Add Student</p>
                            <p className="text-sm text-gray-500">Create new student record</p>
                        </div>
                    </button>

                    <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="absolute inset-0" />
                            <p className="text-sm font-medium text-gray-900">Enter Marks</p>
                            <p className="text-sm text-gray-500">Enter student grades</p>
                        </div>
                    </button>

                    <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <div className="flex-shrink-0">
                            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="absolute inset-0" />
                            <p className="text-sm font-medium text-gray-900">Generate Transcript</p>
                            <p className="text-sm text-gray-500">Create new transcript</p>
                        </div>
                    </button>

                    <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="absolute inset-0" />
                            <p className="text-sm font-medium text-gray-900">Verify Transcript</p>
                            <p className="text-sm text-gray-500">Check transcript validity</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent activity placeholder */}
            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
                    <p className="text-center text-gray-500">
                        No recent activity to display. Start by adding students and entering grades.
                    </p>
                </div>
            </div>
        </div>
    )
}
