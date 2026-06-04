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
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-forest-50">
                                <AcademicCapIcon className="h-6 w-6 text-forest-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">{programme.code} - {programme.name}</h1>
                                <p className="text-sm text-gray-500">{programme.department_name}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="inactive" className="capitalize">
                                {programme.programme_type}
                            </Badge>
                            <Badge variant={isSemesterBased ? 'pending' : 'grade-B'}>
                                {isSemesterBased ? 'Semester-Based' : 'Module-Based'}
                            </Badge>
                            <Badge variant="inactive">
                                {programme.duration_years} years · {programme.total_credits_required} credits required
                            </Badge>
                            <Badge variant={programme.is_active ? 'active' : 'inactive'}>
                                {programme.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Button
                            variant="primary"
                            onClick={() => { setEditPU(null); setFormOpen(true) }}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Unit to Curriculum
                        </Button>
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
                    <div className="flex items-center justify-center h-40 bg-white rounded-xl shadow-sm">
                        <div className="text-gray-500">Loading curriculum...</div>
                    </div>
                ) : curriculumUnits.length === 0 ? (
                    <Table>
                        <TBody>
                            <Tr hoverable={false}>
                                <Td colSpan={5} className="py-0 px-0">
                                    <EmptyState
                                        title="No units in curriculum yet"
                                        description="Add the first unit to build this programme's curriculum."
                                        action={
                                            <Button variant="primary" size="sm" onClick={() => { setEditPU(null); setFormOpen(true) }}>
                                                Add the first unit
                                            </Button>
                                        }
                                    />
                                </Td>
                            </Tr>
                        </TBody>
                    </Table>
                ) : (
                    <div className="space-y-6">
                        {groupedUnits.map(group => (
                            <div key={group.label} className="overflow-hidden rounded-xl shadow-sm bg-white">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                                </div>
                                <Table>
                                    <THead>
                                        <Tr hoverable={false}>
                                            <Th>Code</Th>
                                            <Th>Unit Name</Th>
                                            <Th>Credits</Th>
                                            <Th>Type</Th>
                                            <Th><span className="sr-only">Actions</span></Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {group.items.map(pu => (
                                            <Tr key={pu.id}>
                                                <Td className="font-medium">{pu.unit_code}</Td>
                                                <Td className="text-gray-500 whitespace-normal">{pu.unit_name}</Td>
                                                <Td className="text-gray-500">{pu.credit_hours}</Td>
                                                <Td>
                                                    <Badge variant={pu.is_mandatory ? 'grade-D' : 'inactive'}>
                                                        {pu.is_mandatory ? 'Mandatory' : 'Elective'}
                                                    </Badge>
                                                </Td>
                                                <Td className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { setEditPU(pu); setFormOpen(true) }}
                                                            title="Edit"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteTarget(pu)}
                                                            title="Remove"
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
