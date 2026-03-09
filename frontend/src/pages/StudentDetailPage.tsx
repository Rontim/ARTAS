import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { studentService } from '../services/studentService'
import { gradeService } from '../services/gradeService'

export default function StudentDetailPage() {
    const { id } = useParams<{ id: string }>()

    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ['student', id],
        queryFn: () => studentService.getStudent(id!),
        enabled: !!id,
    })

    const { data: results } = useQuery({
        queryKey: ['student-results', id],
        queryFn: () => studentService.getStudentResults(id!),
        enabled: !!id,
    })

    const { data: cumulative } = useQuery({
        queryKey: ['student-cumulative', id],
        queryFn: () => gradeService.getStudentCumulative(id!),
        enabled: !!id,
    })

    if (studentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        )
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Student not found</h3>
                <Link to="/students" className="text-primary-600 hover:text-primary-500">
                    Back to students
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <Link
                    to="/students"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Students
                </Link>
            </div>

            {/* Student Info Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Student Information
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Personal and academic details.
                        </p>
                    </div>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Generate Transcript
                    </button>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.reg_no}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Full name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.full_name}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Programme</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.programme_name}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Department</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.department_name}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Admission Year</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.admission_year}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">{student.is_module_based ? 'Current Module' : 'Year of Study'}</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{student.is_module_based ? (student.current_module || 'N/A') : (student.current_year_of_study || 'N/A')}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    {student.status}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Cumulative Summary */}
            {cumulative && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Academic Summary
                        </h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-blue-600">CGPA</dt>
                                <dd className="mt-1 text-3xl font-semibold text-blue-900">{cumulative.cgpa}</dd>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-green-600">Classification</dt>
                                <dd className="mt-1 text-xl font-semibold text-green-900">{cumulative.cumulative_grade}</dd>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-purple-600">Credits Earned</dt>
                                <dd className="mt-1 text-2xl font-semibold text-purple-900">{cumulative.cumulative_credits_earned}</dd>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-orange-600">Cumulative Avg</dt>
                                <dd className="mt-1 text-2xl font-semibold text-orange-900">{cumulative.cumulative_average}%</dd>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="mt-8">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Academic Results
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Code</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Name</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Marks</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {results && results.length > 0 ? (
                                results.map((result: { id: string; semester_name: string; unit_code: string; unit_name: string; credit_attempted: number; marks: number; grade: string }) => (
                                    <tr key={result.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{result.semester_name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{result.unit_code}</td>
                                        <td className="px-3 py-4 text-sm text-gray-500">{result.unit_name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.credit_attempted}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.marks}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{result.grade}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No results recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
