import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import SemesterFormModal, { type SemesterFormData } from '../components/SemesterFormModal'
import ModuleFormModal, { type ModuleFormData } from '../components/ModuleFormModal'
import AcademicYearFormModal, { type AcademicYearFormData } from '../components/AcademicYearFormModal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import type { Semester, Module, AcademicYear } from '../types'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'

type Tab = 'years' | 'semesters' | 'modules'

export default function SemestersPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<Tab>('years')

    // Academic Year state
    const [yearFormOpen, setYearFormOpen] = useState(false)
    const [editYear, setEditYear] = useState<AcademicYear | null>(null)
    const [deleteYearTarget, setDeleteYearTarget] = useState<AcademicYear | null>(null)

    // Semester state
    const [semFormOpen, setSemFormOpen] = useState(false)
    const [editSemester, setEditSemester] = useState<Semester | null>(null)
    const [deleteSemTarget, setDeleteSemTarget] = useState<Semester | null>(null)

    // Module state
    const [modFormOpen, setModFormOpen] = useState(false)
    const [editModule, setEditModule] = useState<Module | null>(null)
    const [deleteModTarget, setDeleteModTarget] = useState<Module | null>(null)

    // Queries
    const { data: academicYears, isLoading: yearsLoading } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => academicService.getAcademicYears(),
    })

    const { data: semesters, isLoading: semLoading } = useQuery({
        queryKey: ['semesters'],
        queryFn: () => academicService.getSemesters(),
    })

    const { data: modules, isLoading: modLoading } = useQuery({
        queryKey: ['modules'],
        queryFn: () => academicService.getModules(),
    })

    // Academic Year mutations
    const createYearMutation = useMutation({
        mutationFn: (data: AcademicYearFormData) => academicService.createAcademicYear(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
            setYearFormOpen(false)
            toast.success('Academic year created successfully')
        },
        onError: () => toast.error('Failed to create academic year'),
    })

    const updateYearMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: AcademicYearFormData }) => academicService.updateAcademicYear(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
            setEditYear(null)
            setYearFormOpen(false)
            toast.success('Academic year updated successfully')
        },
        onError: () => toast.error('Failed to update academic year'),
    })

    const deleteYearMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteAcademicYear(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
            setDeleteYearTarget(null)
            toast.success('Academic year deleted successfully')
        },
        onError: () => toast.error('Failed to delete academic year'),
    })

    // Semester mutations
    const createSemMutation = useMutation({
        mutationFn: (data: SemesterFormData) => academicService.createSemester(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semesters'] })
            setSemFormOpen(false)
            toast.success('Semester created successfully')
        },
        onError: () => toast.error('Failed to create semester'),
    })

    const updateSemMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SemesterFormData }) => academicService.updateSemester(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semesters'] })
            setEditSemester(null)
            setSemFormOpen(false)
            toast.success('Semester updated successfully')
        },
        onError: () => toast.error('Failed to update semester'),
    })

    const deleteSemMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteSemester(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semesters'] })
            setDeleteSemTarget(null)
            toast.success('Semester deleted successfully')
        },
        onError: () => toast.error('Failed to delete semester'),
    })

    // Module mutations
    const createModMutation = useMutation({
        mutationFn: (data: ModuleFormData) => academicService.createModule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules'] })
            setModFormOpen(false)
            toast.success('Module created successfully')
        },
        onError: () => toast.error('Failed to create module'),
    })

    const updateModMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ModuleFormData }) => academicService.updateModule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules'] })
            setEditModule(null)
            setModFormOpen(false)
            toast.success('Module updated successfully')
        },
        onError: () => toast.error('Failed to update module'),
    })

    const deleteModMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteModule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules'] })
            setDeleteModTarget(null)
            toast.success('Module deleted successfully')
        },
        onError: () => toast.error('Failed to delete module'),
    })

    const handleYearSubmit = (data: AcademicYearFormData) => {
        if (editYear) {
            updateYearMutation.mutate({ id: editYear.id, data })
        } else {
            createYearMutation.mutate(data)
        }
    }

    const handleSemSubmit = (data: SemesterFormData) => {
        if (editSemester) {
            updateSemMutation.mutate({ id: editSemester.id, data })
        } else {
            createSemMutation.mutate(data)
        }
    }

    const handleModSubmit = (data: ModuleFormData) => {
        if (editModule) {
            updateModMutation.mutate({ id: editModule.id, data })
        } else {
            createModMutation.mutate(data)
        }
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'years', label: 'Academic Years' },
        { key: 'semesters', label: 'Semesters' },
        { key: 'modules', label: 'Modules' },
    ]

    return (
        <div>
            {/* Header */}
            <PageHeader
                title="Semesters & Modules"
                subtitle="Manage academic years, semesters and programme modules."
                action={
                    activeTab === 'years' ? (
                        <Button variant="primary" onClick={() => { setEditYear(null); setYearFormOpen(true) }}>
                            Add Year
                        </Button>
                    ) : activeTab === 'semesters' ? (
                        <Button variant="primary" onClick={() => { setEditSemester(null); setSemFormOpen(true) }}>
                            Add Semester
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={() => { setEditModule(null); setModFormOpen(true) }}>
                            Add Module
                        </Button>
                    )
                }
            />

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={clsx(
                                'px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors duration-150',
                                activeTab === tab.key
                                    ? 'text-forest-700 border-forest-700'
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Academic Years Tab */}
            {activeTab === 'years' && (
                yearsLoading ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : (
                    <Table>
                        <THead>
                            <Tr hoverable={false}>
                                <Th>Name</Th>
                                <Th>Year</Th>
                                <Th>Dates</Th>
                                <Th>Semesters</Th>
                                <Th>Status</Th>
                                <Th><span className="sr-only">Actions</span></Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {(!academicYears || academicYears.length === 0) ? (
                                <Tr hoverable={false}>
                                    <Td colSpan={6} className="py-0 px-0">
                                        <EmptyState title="No academic years found" description="Add your first academic year to get started." />
                                    </Td>
                                </Tr>
                            ) : (
                                academicYears.map((ay) => (
                                    <Tr key={ay.id}>
                                        <Td className="font-medium">{ay.name}</Td>
                                        <Td className="text-gray-500">{ay.year}</Td>
                                        <Td className="text-gray-500">{ay.start_date} — {ay.end_date}</Td>
                                        <Td className="text-gray-500">{ay.semester_count}</Td>
                                        <Td>
                                            <Badge variant={ay.is_current ? 'active' : 'inactive'}>
                                                {ay.is_current ? 'Current' : 'Inactive'}
                                            </Badge>
                                        </Td>
                                        <Td className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditYear(ay); setYearFormOpen(true) }} title="Edit">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteYearTarget(ay)} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-1">
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                )
            )}

            {/* Semesters Tab */}
            {activeTab === 'semesters' && (
                semLoading ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : (
                    <Table>
                        <THead>
                            <Tr hoverable={false}>
                                <Th>Name</Th>
                                <Th>Type</Th>
                                <Th>Year</Th>
                                <Th>Dates</Th>
                                <Th>Status</Th>
                                <Th><span className="sr-only">Actions</span></Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {(!semesters || semesters.length === 0) ? (
                                <Tr hoverable={false}>
                                    <Td colSpan={6} className="py-0 px-0">
                                        <EmptyState title="No semesters found" description="Add your first semester to get started." />
                                    </Td>
                                </Tr>
                            ) : (
                                semesters.map((sem) => (
                                    <Tr key={sem.id}>
                                        <Td className="font-medium">{sem.name}</Td>
                                        <Td className="capitalize text-gray-500">{sem.semester_type}</Td>
                                        <Td className="text-gray-500">{sem.academic_year_name}</Td>
                                        <Td className="text-gray-500">{sem.start_date} — {sem.end_date}</Td>
                                        <Td>
                                            <Badge variant={sem.is_active ? 'active' : 'inactive'}>
                                                {sem.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </Td>
                                        <Td className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditSemester(sem); setSemFormOpen(true) }} title="Edit">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteSemTarget(sem)} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-1">
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                )
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
                modLoading ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : (
                    <Table>
                        <THead>
                            <Tr hoverable={false}>
                                <Th>Name</Th>
                                <Th>Programme</Th>
                                <Th>Module #</Th>
                                <Th>Status</Th>
                                <Th><span className="sr-only">Actions</span></Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {(!modules || modules.length === 0) ? (
                                <Tr hoverable={false}>
                                    <Td colSpan={5} className="py-0 px-0">
                                        <EmptyState title="No modules found" description="Add your first module to get started." />
                                    </Td>
                                </Tr>
                            ) : (
                                modules.map((mod) => (
                                    <Tr key={mod.id}>
                                        <Td className="font-medium">{mod.name}</Td>
                                        <Td className="text-gray-500">{mod.programme_name}</Td>
                                        <Td className="text-gray-500">{mod.module_number}</Td>
                                        <Td>
                                            <Badge variant={mod.is_active ? 'active' : 'inactive'}>
                                                {mod.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </Td>
                                        <Td className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditModule(mod); setModFormOpen(true) }} title="Edit">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteModTarget(mod)} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-1">
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                )
            )}

            {/* Academic Year Modals */}
            <AcademicYearFormModal
                open={yearFormOpen}
                onClose={() => { setYearFormOpen(false); setEditYear(null) }}
                onSubmit={handleYearSubmit}
                academicYear={editYear}
                loading={createYearMutation.isPending || updateYearMutation.isPending}
            />
            <ConfirmDialog
                open={!!deleteYearTarget}
                onClose={() => setDeleteYearTarget(null)}
                onConfirm={() => deleteYearTarget && deleteYearMutation.mutate(deleteYearTarget.id)}
                title="Delete Academic Year"
                message={`Are you sure you want to delete "${deleteYearTarget?.name}"? This action cannot be undone.`}
                loading={deleteYearMutation.isPending}
            />

            {/* Semester Modals */}
            <SemesterFormModal
                open={semFormOpen}
                onClose={() => { setSemFormOpen(false); setEditSemester(null) }}
                onSubmit={handleSemSubmit}
                semester={editSemester}
                loading={createSemMutation.isPending || updateSemMutation.isPending}
            />
            <ConfirmDialog
                open={!!deleteSemTarget}
                onClose={() => setDeleteSemTarget(null)}
                onConfirm={() => deleteSemTarget && deleteSemMutation.mutate(deleteSemTarget.id)}
                title="Delete Semester"
                message={`Are you sure you want to delete "${deleteSemTarget?.name}"? This action cannot be undone.`}
                loading={deleteSemMutation.isPending}
            />

            {/* Module Modals */}
            <ModuleFormModal
                open={modFormOpen}
                onClose={() => { setModFormOpen(false); setEditModule(null) }}
                onSubmit={handleModSubmit}
                module={editModule}
                loading={createModMutation.isPending || updateModMutation.isPending}
            />
            <ConfirmDialog
                open={!!deleteModTarget}
                onClose={() => setDeleteModTarget(null)}
                onConfirm={() => deleteModTarget && deleteModMutation.mutate(deleteModTarget.id)}
                title="Delete Module"
                message={`Are you sure you want to delete "${deleteModTarget?.name}"? This action cannot be undone.`}
                loading={deleteModMutation.isPending}
            />
        </div>
    )
}
