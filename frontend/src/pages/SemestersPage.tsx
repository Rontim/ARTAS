import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { academicService } from '../services/academicService'
import SemesterFormModal, { type SemesterFormData } from '../components/SemesterFormModal'
import ModuleFormModal, { type ModuleFormData } from '../components/ModuleFormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Semester, Module } from '../types'

type Tab = 'semesters' | 'modules'

export default function SemestersPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<Tab>('semesters')

    // Semester state
    const [semFormOpen, setSemFormOpen] = useState(false)
    const [editSemester, setEditSemester] = useState<Semester | null>(null)
    const [deleteSemTarget, setDeleteSemTarget] = useState<Semester | null>(null)

    // Module state
    const [modFormOpen, setModFormOpen] = useState(false)
    const [editModule, setEditModule] = useState<Module | null>(null)
    const [deleteModTarget, setDeleteModTarget] = useState<Module | null>(null)

    // Queries
    const { data: semesters, isLoading: semLoading } = useQuery({
        queryKey: ['semesters'],
        queryFn: () => academicService.getSemesters(),
    })

    const { data: modules, isLoading: modLoading } = useQuery({
        queryKey: ['modules'],
        queryFn: () => academicService.getModules(),
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
        { key: 'semesters', label: 'Semesters' },
        { key: 'modules', label: 'Modules' },
    ]

    return (
        <div>
            {/* Header */}
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Semesters & Modules</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage academic semesters and programme modules.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    {activeTab === 'semesters' ? (
                        <button
                            type="button"
                            onClick={() => { setEditSemester(null); setSemFormOpen(true) }}
                            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                        >
                            <PlusIcon className="inline h-5 w-5 mr-1" />
                            Add Semester
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setEditModule(null); setModFormOpen(true) }}
                            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                        >
                            <PlusIcon className="inline h-5 w-5 mr-1" />
                            Add Module
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${activeTab === tab.key
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Semesters Tab */}
            {activeTab === 'semesters' && (
                <div className="mt-6 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                {semLoading ? (
                                    <div className="flex items-center justify-center h-64 bg-white">
                                        <div className="text-gray-500">Loading...</div>
                                    </div>
                                ) : !semesters || semesters.length === 0 ? (
                                    <div className="flex items-center justify-center h-64 bg-white">
                                        <div className="text-gray-500">No semesters found</div>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Year</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dates</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                                <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {semesters.map((sem) => (
                                                <tr key={sem.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{sem.name}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{sem.semester_type}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{sem.year}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {sem.start_date} — {sem.end_date}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {sem.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                        <button onClick={() => { setEditSemester(sem); setSemFormOpen(true) }} className="text-primary-600 hover:text-primary-900 mr-3" title="Edit">
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => setDeleteSemTarget(sem)} className="text-red-600 hover:text-red-900" title="Delete">
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
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
                <div className="mt-6 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                {modLoading ? (
                                    <div className="flex items-center justify-center h-64 bg-white">
                                        <div className="text-gray-500">Loading...</div>
                                    </div>
                                ) : !modules || modules.length === 0 ? (
                                    <div className="flex items-center justify-center h-64 bg-white">
                                        <div className="text-gray-500">No modules found</div>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Programme</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Module #</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                                <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {modules.map((mod) => (
                                                <tr key={mod.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{mod.name}</td>
                                                    <td className="px-3 py-4 text-sm text-gray-500">{mod.programme_name}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{mod.module_number}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${mod.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {mod.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                        <button onClick={() => { setEditModule(mod); setModFormOpen(true) }} className="text-primary-600 hover:text-primary-900 mr-3" title="Edit">
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => setDeleteModTarget(mod)} className="text-red-600 hover:text-red-900" title="Delete">
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
            )}

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
