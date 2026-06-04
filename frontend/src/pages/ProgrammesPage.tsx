import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import ProgrammeFormModal, { type ProgrammeFormData } from '../components/ProgrammeFormModal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'
import type { Programme } from '../types'

export default function ProgrammesPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [formOpen, setFormOpen] = useState(false)
    const [editProg, setEditProg] = useState<Programme | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Programme | null>(null)

    const { data: programmes, isLoading } = useQuery({
        queryKey: ['programmes'],
        queryFn: () => academicService.getProgrammes(),
    })

    const createMutation = useMutation({
        mutationFn: (data: ProgrammeFormData) => academicService.createProgramme(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programmes'] })
            setFormOpen(false)
            toast.success('Programme created successfully')
        },
        onError: () => toast.error('Failed to create programme'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProgrammeFormData }) => academicService.updateProgramme(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programmes'] })
            setEditProg(null)
            setFormOpen(false)
            toast.success('Programme updated successfully')
        },
        onError: () => toast.error('Failed to update programme'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteProgramme(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programmes'] })
            setDeleteTarget(null)
            toast.success('Programme deleted successfully')
        },
        onError: () => toast.error('Failed to delete programme'),
    })

    const handleSubmit = (data: ProgrammeFormData) => {
        if (editProg) {
            updateMutation.mutate({ id: editProg.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    return (
        <div>
            <PageHeader
                title="Programmes"
                subtitle="A list of all academic programmes offered by the institution."
                action={
                    <Button
                        variant="primary"
                        onClick={() => { setEditProg(null); setFormOpen(true) }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Programme
                    </Button>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : !programmes || programmes.length === 0 ? (
                <Table>
                    <TBody>
                        <Tr hoverable={false}>
                            <Td colSpan={8} className="py-0 px-0">
                                <EmptyState
                                    title="No programmes found"
                                    description="Add a programme to get started."
                                />
                            </Td>
                        </Tr>
                    </TBody>
                </Table>
            ) : (
                <Table>
                    <THead>
                        <Tr hoverable={false}>
                            <Th>Code</Th>
                            <Th>Name</Th>
                            <Th>Department</Th>
                            <Th>Type</Th>
                            <Th>Students</Th>
                            <Th>Structure</Th>
                            <Th>Status</Th>
                            <Th><span className="sr-only">Actions</span></Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {programmes.map((prog) => (
                            <Tr key={prog.id}>
                                <Td className="font-medium">{prog.code}</Td>
                                <Td className="text-gray-500">{prog.name}</Td>
                                <Td className="text-gray-500">{prog.department_name}</Td>
                                <Td className="text-gray-500 capitalize">{prog.programme_type}</Td>
                                <Td className="text-gray-500">{prog.student_count}</Td>
                                <Td>
                                    <Badge variant={prog.structure === 'semester' ? 'pending' : 'grade-B'}>
                                        {prog.structure === 'semester' ? 'Semester' : 'Module'}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Badge variant={prog.is_active ? 'active' : 'inactive'}>
                                        {prog.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/programmes/${prog.id}`)}
                                            title="View Curriculum"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditProg(prog); setFormOpen(true) }}
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteTarget(prog)}
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

            {/* Form Modal */}
            <ProgrammeFormModal
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditProg(null) }}
                onSubmit={handleSubmit}
                programme={editProg}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="Delete Programme"
                message={`Are you sure you want to delete "${deleteTarget?.code} - ${deleteTarget?.name}"? This will also remove its curriculum. This action cannot be undone.`}
                loading={deleteMutation.isPending}
            />
        </div>
    )
}
