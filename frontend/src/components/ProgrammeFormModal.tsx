import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Programme } from '../types'

export interface ProgrammeFormData {
    name: string
    code: string
    department: string
    programme_type: 'certificate' | 'diploma' | 'bachelors' | 'masters' | 'phd'
    structure: 'semester' | 'module'
    duration_years: number
    total_credits_required: number
    description?: string
    is_active: boolean
}

interface ProgrammeFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: ProgrammeFormData) => void
    programme?: Programme | null
    loading?: boolean
}

export default function ProgrammeFormModal({
    open, onClose, onSubmit, programme, loading = false
}: ProgrammeFormModalProps) {
    const isEdit = !!programme

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProgrammeFormData>({
        defaultValues: {
            programme_type: 'bachelors',
            structure: 'semester',
            duration_years: 4,
            total_credits_required: 120,
            is_active: true,
        }
    })

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => academicService.getDepartments(),
        enabled: open,
    })

    useEffect(() => {
        if (programme) {
            reset({
                name: programme.name,
                code: programme.code,
                department: programme.department,
                programme_type: programme.programme_type,
                structure: programme.structure,
                duration_years: programme.duration_years,
                total_credits_required: programme.total_credits_required,
                description: programme.description || '',
                is_active: programme.is_active,
            })
        } else {
            reset({
                name: '',
                code: '',
                department: '',
                programme_type: 'bachelors',
                structure: 'semester',
                duration_years: 4,
                total_credits_required: 120,
                description: '',
                is_active: true,
            })
        }
    }, [programme, reset, open])

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Programme' : 'Add Programme'}
                            </DialogTitle>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('code', { required: 'Code is required' })}
                                            placeholder="e.g. BSC-CS"
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name', { required: 'Name is required' })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    {/* Department */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('department', { required: 'Department is required' })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        >
                                            <option value="">Select department...</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                                            ))}
                                        </select>
                                        {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                                    </div>

                                    {/* Programme Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Programme Type</label>
                                        <select
                                            {...register('programme_type')}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        >
                                            <option value="certificate">Certificate</option>
                                            <option value="diploma">Diploma</option>
                                            <option value="bachelors">Bachelor's Degree</option>
                                            <option value="masters">Master's Degree</option>
                                            <option value="phd">Doctor of Philosophy</option>
                                        </select>
                                    </div>

                                    {/* Structure */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Structure</label>
                                        <select
                                            {...register('structure')}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        >
                                            <option value="semester">Semester Based</option>
                                            <option value="module">Module Based</option>
                                        </select>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Duration (years) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            {...register('duration_years', { required: 'Duration is required', valueAsNumber: true, min: 1 })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                        {errors.duration_years && <p className="mt-1 text-sm text-red-600">{errors.duration_years.message}</p>}
                                    </div>

                                    {/* Total Credits Required */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Total Credits Required <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            {...register('total_credits_required', { required: 'Credits required', valueAsNumber: true, min: 1 })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                        {errors.total_credits_required && <p className="mt-1 text-sm text-red-600">{errors.total_credits_required.message}</p>}
                                    </div>

                                    {/* Description */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            rows={3}
                                            {...register('description')}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                    </div>

                                    {/* Active */}
                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
                                    {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
