import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import UnitFormModal, { type UnitFormData } from '../components/UnitFormModal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'
import type { Unit } from '../types'

export default function UnitsPage() {
    const queryClient = useQueryClient()
    const [formOpen, setFormOpen] = useState(false)
    const [editUnit, setEditUnit] = useState<Unit | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)

    const { data: units, isLoading } = useQuery({
        queryKey: ['units'],
        queryFn: () => academicService.getUnits(),
    })

    const createMutation = useMutation({
        mutationFn: (data: UnitFormData) => academicService.createUnit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            setFormOpen(false)
            toast.success('Unit created successfully')
        },
        onError: () => toast.error('Failed to create unit'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UnitFormData }) => academicService.updateUnit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            setEditUnit(null)
            toast.success('Unit updated successfully')
        },
        onError: () => toast.error('Failed to update unit'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteUnit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            setDeleteTarget(null)
            toast.success('Unit deleted successfully')
        },
        onError: () => toast.error('Failed to delete unit'),
    })

    const handleSubmit = (data: UnitFormData) => {
        if (editUnit) {
            updateMutation.mutate({ id: editUnit.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    return (
        <div>
            <PageHeader
                title="Units"
                subtitle="A list of all academic units/courses in the system."
                action={
                    <Button
                        variant="primary"
                        onClick={() => { setEditUnit(null); setFormOpen(true) }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Unit
                    </Button>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : !units || units.length === 0 ? (
                <Table>
                    <TBody>
                        <Tr hoverable={false}>
                            <Td colSpan={6} className="py-0 px-0">
                                <EmptyState
                                    title="No units found"
                                    description="Add a unit to get started."
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
                            <Th>Credits</Th>
                            <Th>Type</Th>
                            <Th>Status</Th>
                            <Th><span className="sr-only">Actions</span></Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {units.map((unit) => (
                            <Tr key={unit.id}>
                                <Td className="font-medium">{unit.code}</Td>
                                <Td className="text-gray-500">{unit.name}</Td>
                                <Td className="text-gray-500">{unit.credit_hours}</Td>
                                <Td className="text-gray-500 capitalize">{unit.unit_type}</Td>
                                <Td>
                                    <Badge variant={unit.is_active ? 'active' : 'inactive'}>
                                        {unit.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditUnit(unit); setFormOpen(true) }}
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteTarget(unit)}
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
            <UnitFormModal
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditUnit(null) }}
                onSubmit={handleSubmit}
                unit={editUnit}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="Delete Unit"
                message={`Are you sure you want to delete "${deleteTarget?.code} - ${deleteTarget?.name}"? This action cannot be undone.`}
                loading={deleteMutation.isPending}
            />
        </div>
    )
}
