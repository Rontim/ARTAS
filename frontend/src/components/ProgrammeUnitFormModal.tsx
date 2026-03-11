import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { ProgrammeUnit, Programme } from '../types'

export interface ProgrammeUnitFormData {
    unit: string
    year_of_study?: number | null
    semester_number?: number | null
    module?: string | null
    is_mandatory: boolean
}

interface ProgrammeUnitFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: ProgrammeUnitFormData) => void
    programmeUnit?: ProgrammeUnit | null
    programme: Programme
    loading?: boolean
}

export default function ProgrammeUnitFormModal({
    open, onClose, onSubmit, programmeUnit, programme, loading = false
}: ProgrammeUnitFormModalProps) {
    const isEdit = !!programmeUnit
    const isSemesterBased = programme.structure === 'semester'

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProgrammeUnitFormData>({
        defaultValues: {
            is_mandatory: true,
        }
    })

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => academicService.getUnits(),
        enabled: open,
    })

    const { data: modules = [] } = useQuery({
        queryKey: ['modules', programme.id],
        queryFn: () => academicService.getModules(programme.id),
        enabled: open && !isSemesterBased,
    })

    useEffect(() => {
        if (programmeUnit) {
            reset({
                unit: programmeUnit.unit,
                year_of_study: programmeUnit.year_of_study ?? null,
                semester_number: programmeUnit.semester_number ?? null,
                module: programmeUnit.module ?? null,
                is_mandatory: programmeUnit.is_mandatory,
            })
        } else {
            reset({
                unit: '',
                year_of_study: isSemesterBased ? 1 : null,
                semester_number: isSemesterBased ? 1 : null,
                module: null,
                is_mandatory: true,
            })
        }
    }, [programmeUnit, reset, open, isSemesterBased])

    const onFormSubmit = (data: ProgrammeUnitFormData) => {
        // Clear irrelevant fields based on structure
        if (isSemesterBased) {
            data.module = null
        } else {
            data.year_of_study = null
            data.semester_number = null
        }
        onSubmit(data)
    }

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Curriculum Unit' : 'Add Unit to Curriculum'}
                            </DialogTitle>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Structure badge */}
                        <div className="px-6 pt-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isSemesterBased ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                {isSemesterBased ? 'Semester-Based' : 'Module-Based'} Programme
                            </span>
                        </div>

                        <form onSubmit={handleSubmit(onFormSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Unit */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Unit <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('unit', { required: 'Unit is required' })}
                                            disabled={isEdit}
                                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                                        >
                                            <option value="">Select unit...</option>
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>{u.code} - {u.name} ({u.credit_hours} cr)</option>
                                            ))}
                                        </select>
                                        {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                                    </div>

                                    {/* Semester-based fields */}
                                    {isSemesterBased && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Year of Study <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    {...register('year_of_study', { required: 'Year is required', valueAsNumber: true, min: 1 })}
                                                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                                />
                                                {errors.year_of_study && <p className="mt-1 text-sm text-red-600">{errors.year_of_study.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Semester Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    {...register('semester_number', { required: 'Semester is required', valueAsNumber: true, min: 1 })}
                                                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                                />
                                                {errors.semester_number && <p className="mt-1 text-sm text-red-600">{errors.semester_number.message}</p>}
                                            </div>
                                        </>
                                    )}

                                    {/* Module-based field */}
                                    {!isSemesterBased && (
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Module <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                {...register('module', { required: 'Module is required' })}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                            >
                                                <option value="">Select module...</option>
                                                {modules.map(m => (
                                                    <option key={m.id} value={m.id}>Module {m.module_number} - {m.name}</option>
                                                ))}
                                            </select>
                                            {errors.module && <p className="mt-1 text-sm text-red-600">{errors.module.message}</p>}
                                        </div>
                                    )}

                                    {/* Mandatory */}
                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input type="checkbox" {...register('is_mandatory')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                            Mandatory unit
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
                                    {loading ? 'Saving...' : isEdit ? 'Update' : 'Add to Curriculum'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
