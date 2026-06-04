import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, DocumentTextIcon, PencilIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { studentService } from '../services/studentService'
import { gradeService } from '../services/gradeService'
import StudentFormModal from '../components/StudentFormModal'
import SemesterRegistrationFormModal, { type SemesterRegistrationFormData } from '../components/SemesterRegistrationFormModal'
import EnterMarksModal from '../components/EnterMarksModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { StudentFormData } from '../components/StudentFormModal'

export default function StudentDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [formOpen, setFormOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [semesterFormOpen, setSemesterFormOpen] = useState(false)
    const [editRegistration, setEditRegistration] = useState<any>(null)
    const [marksRegistration, setMarksRegistration] = useState<any>(null)

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

    const { data: semesterRegistrations = [] } = useQuery({
        queryKey: ['student-semester-registrations', id],
        queryFn: () => studentService.getSemesterRegistrations(id!),
        enabled: !!id,
    })

    const { data: cumulative } = useQuery({
        queryKey: ['student-cumulative', id],
        queryFn: () => gradeService.getStudentCumulative(id!),
        enabled: !!id,
    })

    const { data: semesterAggregates = [] } = useQuery({
        queryKey: ['student-semester-aggregates', id],
        queryFn: () => gradeService.getSemesterAggregates(id!),
        enabled: !!id,
    })

    const updateMutation = useMutation({
        mutationFn: (data: StudentFormData) => studentService.updateStudent(id!, data),
        onSuccess: () => {
            toast.success('Student updated successfully')
            queryClient.invalidateQueries({ queryKey: ['student', id] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
            setFormOpen(false)
        },
        onError: (err: any) => {
            const msg = err.response?.data
            if (msg && typeof msg === 'object') {
                const firstError = Object.values(msg).flat()[0]
                toast.error(String(firstError))
            } else {
                toast.error('Failed to update student')
            }
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => studentService.deleteStudent(id!),
        onSuccess: () => {
            toast.success('Student deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['students'] })
            navigate('/students')
        },
        onError: () => {
            toast.error('Failed to delete student')
        },
    })

    const createSemesterRegistrationMutation = useMutation({
        mutationFn: (data: SemesterRegistrationFormData) => {
            if (editRegistration) {
                return studentService.updateSemesterRegistration(editRegistration.id, data)
            }
            return studentService.createSemesterRegistration({ student: id!, ...data })
        },
        onSuccess: () => {
            toast.success(editRegistration ? 'Registration updated' : 'Student registered for semester')
            setSemesterFormOpen(false)
            setEditRegistration(null)
            queryClient.invalidateQueries({ queryKey: ['student-semester-registrations', id] })
            queryClient.invalidateQueries({ queryKey: ['student', id] })
        },
        onError: (err: any) => {
            const msg = err.response?.data
            if (msg && typeof msg === 'object') {
                const firstError = Object.values(msg).flat()[0]
                toast.error(String(firstError))
            } else {
                toast.error('Failed to save registration')
            }
        },
    })

    // Map semester UUID → aggregate for quick lookup in each row
    const aggBySemester = semesterAggregates.reduce<Record<string, (typeof semesterAggregates)[0]>>(
        (acc, agg) => { acc[agg.semester] = agg; return acc }, {}
    )

    // Set of SemesterRegistrationUnit IDs that already have a result entered
    const resultedUnitIds = new Set<string>(
        (results || []).map((r: any) => r.unit_registration)
    )

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
                <Link to="/students" className="text-forest-600 hover:text-forest-500">
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
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFormOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                        </button>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50"
                        >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-forest-600 hover:bg-forest-700">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Generate Transcript
                        </button>
                    </div>
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

            {/* Semester Registrations */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Semester Registrations</h3>
                        <p className="mt-1 text-sm text-gray-500">Manage semester enrollment and unit registrations for this student.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setEditRegistration(null); setSemesterFormOpen(true) }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-forest-600 hover:bg-forest-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Register Semester
                    </button>
                </div>
                <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Year</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Units</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade / GPA</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Registered</th>
                                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {semesterRegistrations.length > 0 ? (
                                    semesterRegistrations.map((registration: any) => {
                                        const agg = aggBySemester[registration.semester]
                                        const hasResults = registration.units?.some((u: any) => resultedUnitIds.has(u.id)) ?? false
                                        return (
                                            <SemesterRegistrationRow
                                                key={registration.id}
                                                registration={registration}
                                                semesterAggregate={agg}
                                                hasResults={hasResults}
                                                onEdit={() => { setEditRegistration(registration); setSemesterFormOpen(true) }}
                                                onEnterMarks={() => setMarksRegistration(registration)}
                                            />
                                        )
                                    })

                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No semester registrations yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Academic Summary */}
            {(cumulative || semesterAggregates.length > 0) && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Academic Summary</h3>
                    </div>

                    {/* Cumulative stats */}
                    {cumulative && (
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cumulative</p>
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
                    )}

                    {/* Per-semester breakdown */}
                    {semesterAggregates.length > 0 && (
                        <div className="border-t border-gray-200">
                            <div className="px-4 py-3 sm:px-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Semester Breakdown</p>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Semester</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Term Avg</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">GPA</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Units</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Passed</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Failed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {semesterAggregates.map((agg) => {
                                        const gradeColours: Record<string, string> = {
                                            A: 'bg-green-100 text-green-800',
                                            B: 'bg-blue-100 text-blue-800',
                                            C: 'bg-yellow-100 text-yellow-800',
                                            D: 'bg-orange-100 text-orange-800',
                                            E: 'bg-red-100 text-red-800',
                                        }
                                        const gc = agg.semester_grade ? (gradeColours[agg.semester_grade] || 'bg-gray-100 text-gray-700') : ''
                                        return (
                                            <tr key={agg.id}>
                                                <td className="px-6 py-3 text-sm text-gray-900">{agg.semester_name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {agg.semester_grade ? (
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${gc}`}>
                                                            {agg.semester_grade}
                                                        </span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700">{agg.term_average}%</td>
                                                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">{agg.gpa}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-500">{agg.units_taken}</td>
                                                <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">{agg.units_passed}</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <span className={agg.units_failed > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                                                        {agg.units_failed}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Period</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Code</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Name</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Marks</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {results && results.length > 0 ? (
                                results.map((result: { id: string; semester_name?: string; module_name?: string; unit_code: string; unit_name: string; credit_attempted: number; marks: number; grade: string }) => (
                                    <tr key={result.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{result.semester_name || result.module_name || '-'}</td>
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

            <SemesterRegistrationFormModal
                open={semesterFormOpen}
                onClose={() => { setSemesterFormOpen(false); setEditRegistration(null); }}
                onSubmit={(data) => createSemesterRegistrationMutation.mutate(data)}
                programmeId={student.programme}
                registration={editRegistration}
                loading={createSemesterRegistrationMutation.isPending}
            />

            {/* Edit Modal */}
            {student && (
                <StudentFormModal
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={(data) => updateMutation.mutate(data)}
                    student={student}
                    loading={updateMutation.isPending}
                />
            )}

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Student"
                message={`Are you sure you want to delete ${student.full_name}? This action cannot be undone.`}
                loading={deleteMutation.isPending}
            />

            {marksRegistration && (
                <EnterMarksModal
                    open={!!marksRegistration}
                    onClose={() => setMarksRegistration(null)}
                    studentId={id!}
                    studentName={student.full_name}
                    registration={marksRegistration}
                />
            )}
        </div>
    )
}

interface RowProps {
    registration: any
    semesterAggregate?: any
    hasResults: boolean
    onEdit: () => void
    onEnterMarks: () => void
}

const GRADE_BADGE: Record<string, string> = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    E: 'bg-red-100 text-red-800',
}

function SemesterRegistrationRow({ registration, semesterAggregate, hasResults, onEdit, onEnterMarks }: RowProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const grade = semesterAggregate?.semester_grade
    const gc = grade ? (GRADE_BADGE[grade] || 'bg-gray-100 text-gray-700') : ''

    return (
        <>
            <tr className={isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mr-2 inline-flex items-center text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </button>
                    {registration.semester_name}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">Year {registration.year_of_study}</td>
                <td className="px-3 py-4 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {registration.units?.length || 0} units
                    </span>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                    {grade ? (
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${gc}`}>
                                {grade}
                            </span>
                            <span className="text-gray-400 text-xs">GPA {semesterAggregate.gpa}</span>
                        </div>
                    ) : (
                        <span className="text-gray-300 text-xs">No results yet</span>
                    )}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">{new Date(registration.registration_date).toLocaleDateString()}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right sm:pr-6">
                    <div className="flex justify-end items-center gap-2">
                        <button
                            onClick={onEnterMarks}
                            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset transition-colors ${hasResults
                                    ? 'bg-white text-green-700 ring-green-300 hover:bg-green-50'
                                    : 'bg-green-600 text-white ring-green-600 hover:bg-green-700'
                                }`}
                        >
                            {hasResults ? 'Edit Marks' : 'Enter Marks'}
                        </button>
                        <button
                            onClick={onEdit}
                            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 shadow-sm ring-1 ring-inset ring-forest-300 hover:bg-forest-50 transition-colors"
                        >
                            Manage Units
                        </button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="pl-8 pb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registered Units</h4>
                            {registration.units && registration.units.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {registration.units.map((u: any) => (
                                        <div key={u.id} className="flex items-center text-sm text-gray-600">
                                            <div className="w-2 h-2 rounded-full bg-forest-400 mr-2"></div>
                                            <span className="font-medium mr-2">{u.unit_code}</span>
                                            <span>{u.unit_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No units registered for this semester.</p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}
