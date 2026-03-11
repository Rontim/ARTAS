import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import type { Unit } from '../types'

export interface UnitFormData {
    code: string
    name: string
    description?: string
    credit_hours: number
    unit_type: 'core' | 'elective' | 'common'
    recommended_year: number
    recommended_semester: number
    is_active: boolean
}

interface UnitFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: UnitFormData) => void
    unit?: Unit | null
    loading?: boolean
}

export default function UnitFormModal({
    open, onClose, onSubmit, unit, loading = false
}: UnitFormModalProps) {
    const isEdit = !!unit

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UnitFormData>({
        defaultValues: {
            unit_type: 'core',
            credit_hours: 3,
            recommended_year: 1,
            recommended_semester: 1,
            is_active: true,
        }
    })

    useEffect(() => {
        if (unit) {
            reset({
                code: unit.code,
                name: unit.name,
                description: unit.description || '',
                credit_hours: unit.credit_hours,
                unit_type: unit.unit_type,
                recommended_year: unit.recommended_year,
                recommended_semester: unit.recommended_semester,
                is_active: unit.is_active,
            })
        } else {
            reset({
                code: '',
                name: '',
                description: '',
                credit_hours: 3,
                unit_type: 'core',
                recommended_year: 1,
                recommended_semester: 1,
                is_active: true,
            })
        }
    }, [unit, reset, open])

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Unit' : 'Add Unit'}
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
                                            placeholder="e.g. CS101"
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

                                    {/* Credit Hours */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Credit Hours <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            {...register('credit_hours', { required: 'Credit hours required', valueAsNumber: true, min: 1 })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                        {errors.credit_hours && <p className="mt-1 text-sm text-red-600">{errors.credit_hours.message}</p>}
                                    </div>

                                    {/* Unit Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <select
                                            {...register('unit_type')}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        >
                                            <option value="core">Core</option>
                                            <option value="elective">Elective</option>
                                            <option value="common">Common</option>
                                        </select>
                                    </div>

                                    {/* Recommended Year */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Recommended Year</label>
                                        <input
                                            type="number"
                                            {...register('recommended_year', { valueAsNumber: true, min: 1 })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
                                    </div>

                                    {/* Recommended Semester */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Recommended Semester</label>
                                        <input
                                            type="number"
                                            {...register('recommended_semester', { valueAsNumber: true, min: 1 })}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        />
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

                            {/* Footer */}
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
