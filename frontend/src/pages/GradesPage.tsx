import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import { gradeService } from '../services/gradeService'

export default function GradesPage() {
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['results', page],
        queryFn: () => gradeService.getResults({ page }),
    })

    const results = data?.results || []
    const totalPages = data?.total_pages || 1

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Grades</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Student marks and grades management.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-2">
                    <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Bulk Upload
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                        <PlusIcon className="inline h-5 w-5 mr-1" />
                        Add Result
                    </button>
                </div>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64 bg-white">
                                    <div className="text-gray-500">Loading...</div>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="flex items-center justify-center h-64 bg-white">
                                    <div className="text-gray-500">No results found</div>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Reg No</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Semester</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Marks</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {results.map((result) => (
                                            <tr key={result.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{result.student_reg_no}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.student_name}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.unit_code}</td>
                                                <td className="px-3 py-4 text-sm text-gray-500">{result.semester_name}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.marks}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{result.grade}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {result.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
