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
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'
import type { StudentFormData } from '../components/StudentFormModal'
import { gradeVariant } from '../utils/gradeVariant'

function studentStatusVariant(status: string): 'active' | 'inactive' | 'pass' | 'pending' {
    if (status === 'active') return 'active'
    if (status === 'graduated') return 'pass'
    if (status === 'pending') return 'pending'
    return 'inactive'
}

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
                        <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)}>
                            <PencilIcon className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                            <TrashIcon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button variant="primary" size="sm">
                            <DocumentTextIcon className="h-4 w-4" />
                            Generate Transcript
                        </Button>
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
                                <Badge variant={studentStatusVariant(student.status)}>
                                    {student.status}
                                </Badge>
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
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setEditRegistration(null); setSemesterFormOpen(true) }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Register Semester
                    </Button>
                </div>
                <div className="border-t border-gray-200 overflow-x-auto">
                    <Table>
                        <THead>
                            <Tr hoverable={false}>
                                <Th>Semester</Th>
                                <Th>Year</Th>
                                <Th>Units</Th>
                                <Th>Grade / GPA</Th>
                                <Th>Registered</Th>
                                <Th className="text-right">Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
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
                                <Tr hoverable={false}>
                                    <Td colSpan={6} className="py-0 px-0">
                                        <EmptyState
                                            title="No semester registrations yet"
                                            description="Register the student for a semester to get started."
                                        />
                                    </Td>
                                </Tr>
                            )}
                        </TBody>
                    </Table>
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
                            <Table>
                                <THead>
                                    <Tr hoverable={false}>
                                        <Th>Semester</Th>
                                        <Th className="text-center">Grade</Th>
                                        <Th className="text-center">Term Avg</Th>
                                        <Th className="text-center">GPA</Th>
                                        <Th className="text-center">Units</Th>
                                        <Th className="text-center">Passed</Th>
                                        <Th className="text-center">Failed</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {semesterAggregates.map((agg) => (
                                        <Tr key={agg.id}>
                                            <Td>{agg.semester_name}</Td>
                                            <Td className="text-center">
                                                {agg.semester_grade ? (
                                                    <Badge variant={gradeVariant(agg.semester_grade)}>
                                                        {agg.semester_grade}
                                                    </Badge>
                                                ) : <span className="text-gray-300">—</span>}
                                            </Td>
                                            <Td className="text-center text-gray-700">{agg.term_average}%</Td>
                                            <Td className="text-center font-semibold">{agg.gpa}</Td>
                                            <Td className="text-center text-gray-500">{agg.units_taken}</Td>
                                            <Td className="text-center text-green-700 font-medium">{agg.units_passed}</Td>
                                            <Td className="text-center">
                                                <span className={agg.units_failed > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                                                    {agg.units_failed}
                                                </span>
                                            </Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Results Table */}
            <div className="mt-8">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Academic Results
                </h3>
                {results && results.length > 0 ? (
                    <Table>
                        <THead>
                            <Tr hoverable={false}>
                                <Th>Period</Th>
                                <Th>Unit Code</Th>
                                <Th>Unit Name</Th>
                                <Th>Credits</Th>
                                <Th>Marks</Th>
                                <Th>Grade</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {results.map((result: { id: string; semester_name?: string; module_name?: string; unit_code: string; unit_name: string; credit_attempted: number; marks: number; grade: string }) => (
                                <Tr key={result.id}>
                                    <Td>{result.semester_name || result.module_name || '-'}</Td>
                                    <Td className="font-medium">{result.unit_code}</Td>
                                    <Td className="text-gray-500 whitespace-normal">{result.unit_name}</Td>
                                    <Td className="text-gray-500">{result.credit_attempted}</Td>
                                    <Td className="text-gray-500">{result.marks}</Td>
                                    <Td>
                                        <Badge variant={gradeVariant(result.grade)}>
                                            {result.grade}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                ) : (
                    <Table>
                        <TBody>
                            <Tr hoverable={false}>
                                <Td colSpan={6} className="py-0 px-0">
                                    <EmptyState
                                        title="No results recorded yet"
                                        description="Enter marks for semester registrations to see results here."
                                    />
                                </Td>
                            </Tr>
                        </TBody>
                    </Table>
                )}
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

function SemesterRegistrationRow({ registration, semesterAggregate, hasResults, onEdit, onEnterMarks }: RowProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const grade = semesterAggregate?.semester_grade

    return (
        <>
            <Tr className={isExpanded ? 'bg-gray-50' : undefined}>
                <Td className="font-medium">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mr-2 inline-flex items-center text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </button>
                    {registration.semester_name}
                </Td>
                <Td className="text-gray-500">Year {registration.year_of_study}</Td>
                <Td>
                    <Badge variant="pending">
                        {registration.units?.length || 0} units
                    </Badge>
                </Td>
                <Td>
                    {grade ? (
                        <div className="flex items-center gap-2">
                            <Badge variant={gradeVariant(grade)}>
                                {grade}
                            </Badge>
                            <span className="text-gray-400 text-xs">GPA {semesterAggregate.gpa}</span>
                        </div>
                    ) : (
                        <span className="text-gray-300 text-xs">No results yet</span>
                    )}
                </Td>
                <Td className="text-gray-500">{new Date(registration.registration_date).toLocaleDateString()}</Td>
                <Td className="text-right">
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
                </Td>
            </Tr>
            {isExpanded && (
                <Tr hoverable={false}>
                    <Td colSpan={6} className="bg-gray-50 border-t border-gray-100">
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
                    </Td>
                </Tr>
            )}
        </>
    )
}
