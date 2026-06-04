import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { studentService } from '../services/studentService'
import StudentFormModal from '../components/StudentFormModal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'
import type { StudentFormData } from '../components/StudentFormModal'
import type { Student } from '../types'

function studentStatusVariant(status: string): 'active' | 'inactive' | 'pass' | 'pending' {
    if (status === 'active') return 'active'
    if (status === 'graduated') return 'pass'
    if (status === 'pending') return 'pending'
    return 'inactive'
}

export default function StudentsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [formOpen, setFormOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)

    const { data, isLoading, error } = useQuery({
        queryKey: ['students', page, search],
        queryFn: () => studentService.getStudents({ page, search, page_size: 20 }),
    })

    const createMutation = useMutation({
        mutationFn: (data: StudentFormData) => studentService.createStudent(data),
        onSuccess: () => {
            toast.success('Student added successfully')
            queryClient.invalidateQueries({ queryKey: ['students'] })
            closeForm()
        },
        onError: (err: any) => {
            const msg = err.response?.data
            if (msg && typeof msg === 'object') {
                const firstError = Object.values(msg).flat()[0]
                toast.error(String(firstError))
            } else {
                toast.error('Failed to add student')
            }
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: StudentFormData }) =>
            studentService.updateStudent(id, data),
        onSuccess: () => {
            toast.success('Student updated successfully')
            queryClient.invalidateQueries({ queryKey: ['students'] })
            closeForm()
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
        mutationFn: (id: string) => studentService.deleteStudent(id),
        onSuccess: () => {
            toast.success('Student deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['students'] })
            setDeletingStudent(null)
        },
        onError: () => {
            toast.error('Failed to delete student')
        },
    })

    const closeForm = () => {
        setFormOpen(false)
        setEditingStudent(null)
    }

    const handleSubmit = (data: StudentFormData) => {
        if (editingStudent) {
            updateMutation.mutate({ id: editingStudent.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    const openEdit = (student: Student) => {
        setEditingStudent(student)
        setFormOpen(true)
    }

    const students = data?.results || []
    const totalPages = data?.total_pages || 1

    return (
        <div>
            <PageHeader
                title="Students"
                subtitle="A list of all students in the system including their registration number, name, and programme."
                action={
                    <Button
                        variant="primary"
                        onClick={() => { setEditingStudent(null); setFormOpen(true) }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Student
                    </Button>
                }
            />

            {/* Search */}
            <div className="mt-2 mb-6">
                <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students by name or registration number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forest-600 sm:text-sm sm:leading-6"
                    />
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                    <div className="text-red-500">Error loading students</div>
                </div>
            ) : students.length === 0 ? (
                <Table>
                    <TBody>
                        <Tr hoverable={false}>
                            <Td colSpan={6} className="py-0 px-0">
                                <EmptyState
                                    title="No students found"
                                    description="Add a student to get started."
                                />
                            </Td>
                        </Tr>
                    </TBody>
                </Table>
            ) : (
                <Table>
                    <THead>
                        <Tr hoverable={false}>
                            <Th>Reg. No</Th>
                            <Th>Name</Th>
                            <Th>Programme</Th>
                            <Th>Year / Module</Th>
                            <Th>Status</Th>
                            <Th><span className="sr-only">Actions</span></Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {students.map((student: Student) => (
                            <Tr key={student.id}>
                                <Td className="font-medium">{student.reg_no}</Td>
                                <Td className="text-gray-500">{student.full_name}</Td>
                                <Td className="text-gray-500">{student.programme_name}</Td>
                                <Td className="text-gray-500">
                                    {student.is_module_based ? (student.current_module || '-') : (student.current_year_of_study || '-')}
                                </Td>
                                <Td>
                                    <Badge variant={studentStatusVariant(student.status)}>
                                        {student.status}
                                    </Badge>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            to={`/students/${student.id}`}
                                            className="text-sm text-forest-600 hover:text-forest-900 font-medium"
                                        >
                                            View
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(student)}
                                            title="Edit"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingStudent(student)}
                                            title="Delete"
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <StudentFormModal
                open={formOpen}
                onClose={closeForm}
                onSubmit={handleSubmit}
                student={editingStudent}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingStudent}
                onClose={() => setDeletingStudent(null)}
                onConfirm={() => deletingStudent && deleteMutation.mutate(deletingStudent.id)}
                title="Delete Student"
                message={`Are you sure you want to delete ${deletingStudent?.full_name} (${deletingStudent?.reg_no})? This action cannot be undone.`}
                loading={deleteMutation.isPending}
            />
        </div>
    )
}
