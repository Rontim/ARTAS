import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import UnitFormModal, { type UnitFormData } from '../components/UnitFormModal'
import ConfirmDialog from '../components/ConfirmDialog'
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
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Units</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all academic units/courses in the system.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => { setEditUnit(null); setFormOpen(true) }}
                        className="block rounded-md bg-forest-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-forest-500"
                    >
                        <PlusIcon className="inline h-5 w-5 mr-1" />
                        Add Unit
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
                            ) : !units || units.length === 0 ? (
                                <div className="flex items-center justify-center h-64 bg-white">
                                    <div className="text-gray-500">No units found</div>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Code</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {units.map((unit) => (
                                            <tr key={unit.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{unit.code}</td>
                                                <td className="px-3 py-4 text-sm text-gray-500">{unit.name}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{unit.credit_hours}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{unit.unit_type}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${unit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {unit.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                    <button onClick={() => { setEditUnit(unit); setFormOpen(true) }} className="text-forest-600 hover:text-forest-900 mr-3" title="Edit">
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(unit)} className="text-red-600 hover:text-red-900" title="Delete">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
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
