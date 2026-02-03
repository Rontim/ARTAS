import { PlusIcon } from '@heroicons/react/24/outline'

export default function UsersPage() {
    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        System users and their roles.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                        <PlusIcon className="inline h-5 w-5 mr-1" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <p className="text-center text-gray-500">
                        User management will be displayed here. This feature allows administrators to manage system users and their access roles.
                    </p>
                </div>
            </div>
        </div>
    )
}
