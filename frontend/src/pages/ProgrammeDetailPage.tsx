import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeftIcon, PlusIcon, PencilSquareIcon, TrashIcon,
    AcademicCapIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import ProgrammeUnitFormModal, { type ProgrammeUnitFormData } from '../components/ProgrammeUnitFormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { ProgrammeUnit } from '../types'

export default function ProgrammeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()

    const [formOpen, setFormOpen] = useState(false)
    const [editPU, setEditPU] = useState<ProgrammeUnit | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<ProgrammeUnit | null>(null)

    const { data: programme, isLoading: progLoading } = useQuery({
        queryKey: ['programme', id],
        queryFn: () => academicService.getProgramme(id!),
        enabled: !!id,
    })

    const { data: curriculumUnits = [], isLoading: cuLoading } = useQuery({
        queryKey: ['programme-units', id],
        queryFn: () => academicService.getProgrammeUnits(id!),
        enabled: !!id,
    })

    const toPayload = (data: ProgrammeUnitFormData) => ({
        programme: id,
        unit: data.unit,
        year_of_study: data.year_of_study ?? undefined,
        semester_number: data.semester_number ?? undefined,
        module: data.module ?? undefined,
        is_mandatory: data.is_mandatory,
    })

    const createMutation = useMutation({
        mutationFn: (data: ProgrammeUnitFormData) =>
            academicService.createProgrammeUnit(toPayload(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programme-units', id] })
            setFormOpen(false)
            toast.success('Unit added to curriculum')
        },
        onError: () => toast.error('Failed to add unit'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ puId, data }: { puId: string; data: ProgrammeUnitFormData }) =>
            academicService.updateProgrammeUnit(puId, toPayload(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programme-units', id] })
            setEditPU(null)
            setFormOpen(false)
            toast.success('Curriculum unit updated')
        },
        onError: () => toast.error('Failed to update curriculum unit'),
    })

    const deleteMutation = useMutation({
        mutationFn: (puId: string) => academicService.deleteProgrammeUnit(puId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programme-units', id] })
            setDeleteTarget(null)
            toast.success('Unit removed from curriculum')
        },
        onError: () => toast.error('Failed to remove unit'),
    })

    const handleSubmit = (data: ProgrammeUnitFormData) => {
        if (editPU) {
            updateMutation.mutate({ puId: editPU.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    if (progLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading programme...</div>
            </div>
        )
    }

    if (!programme) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Programme not found</div>
            </div>
        )
    }

    const isSemesterBased = programme.structure === 'semester'

    // Group units by period for display
    const groupedUnits = isSemesterBased
        ? groupBySemester(curriculumUnits)
        : groupByModule(curriculumUnits)

    return (
        <div>
            {/* Back link + header */}
            <div className="mb-6">
                <Link to="/programmes" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Programmes
                </Link>

                <div className="sm:flex sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                                <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">{programme.code} - {programme.name}</h1>
                                <p className="text-sm text-gray-500">{programme.department_name}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 capitalize">
                                {programme.programme_type}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isSemesterBased ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                {isSemesterBased ? 'Semester-Based' : 'Module-Based'}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {programme.duration_years} years · {programme.total_credits_required} credits required
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${programme.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {programme.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            type="button"
                            onClick={() => { setEditPU(null); setFormOpen(true) }}
                            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                        >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Add Unit to Curriculum
                        </button>
                    </div>
                </div>
            </div>

            {/* Curriculum Table */}
            <div className="mt-2">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Curriculum
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({curriculumUnits.length} unit{curriculumUnits.length !== 1 ? 's' : ''})
                    </span>
                </h2>

                {cuLoading ? (
                    <div className="flex items-center justify-center h-40 bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
                        <div className="text-gray-500">Loading curriculum...</div>
                    </div>
                ) : curriculumUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
                        <div className="text-gray-500">No units in curriculum yet</div>
                        <button
                            onClick={() => { setEditPU(null); setFormOpen(true) }}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-500"
                        >
                            Add the first unit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedUnits.map(group => (
                            <div key={group.label} className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                                </div>
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Name</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="relative py-3 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {group.items.map(pu => (
                                            <tr key={pu.id}>
                                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900">{pu.unit_code}</td>
                                                <td className="px-3 py-3 text-sm text-gray-500">{pu.unit_name}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{pu.credit_hours}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pu.is_mandatory ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {pu.is_mandatory ? 'Mandatory' : 'Elective'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium">
                                                    <button onClick={() => { setEditPU(pu); setFormOpen(true) }} className="text-primary-600 hover:text-primary-900 mr-3" title="Edit">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(pu)} className="text-red-600 hover:text-red-900" title="Remove">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {programme && (
                <ProgrammeUnitFormModal
                    open={formOpen}
                    onClose={() => { setFormOpen(false); setEditPU(null) }}
                    onSubmit={handleSubmit}
                    programmeUnit={editPU}
                    programme={programme}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            )}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="Remove Unit from Curriculum"
                message={`Remove "${deleteTarget?.unit_code} - ${deleteTarget?.unit_name}" from this programme's curriculum?`}
                loading={deleteMutation.isPending}
            />
        </div>
    )
}

// Helpers to group curriculum units for display

interface CurriculumGroup {
    label: string
    items: ProgrammeUnit[]
}

function groupBySemester(units: ProgrammeUnit[]): CurriculumGroup[] {
    const map = new Map<string, ProgrammeUnit[]>()
    for (const pu of units) {
        const key = `Year ${pu.year_of_study ?? '?'}, Semester ${pu.semester_number ?? '?'}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(pu)
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items }))
}

function groupByModule(units: ProgrammeUnit[]): CurriculumGroup[] {
    const map = new Map<string, ProgrammeUnit[]>()
    for (const pu of units) {
        const key = pu.module_name ?? 'Unassigned'
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(pu)
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items }))
}
