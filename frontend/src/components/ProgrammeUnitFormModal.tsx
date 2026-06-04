import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { ProgrammeUnit, Programme } from '../types'
import { SelectField } from './ui/SelectField'
import { ComboboxField } from './ui/ComboboxField'

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

const SEMESTER_OPTIONS = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
]

export default function ProgrammeUnitFormModal({
    open, onClose, onSubmit, programmeUnit, programme, loading = false
}: ProgrammeUnitFormModalProps) {
    const isEdit = !!programmeUnit
    const isSemesterBased = programme.structure === 'semester'

    // Year options based on programme duration
    const yearOptions = Array.from({ length: programme.duration_years }, (_, i) => ({
        value: String(i + 1),
        label: `Year ${i + 1}`,
    }))

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProgrammeUnitFormData>({
        defaultValues: { is_mandatory: true }
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
        if (open) {
            reset(programmeUnit ? {
                unit: programmeUnit.unit,
                year_of_study: programmeUnit.year_of_study ?? null,
                semester_number: programmeUnit.semester_number ?? null,
                module: programmeUnit.module ?? null,
                is_mandatory: programmeUnit.is_mandatory,
            } : {
                unit: '',
                year_of_study: isSemesterBased ? 1 : null,
                semester_number: isSemesterBased ? 1 : null,
                module: null,
                is_mandatory: true,
            })
        }
    }, [programmeUnit, reset, open, isSemesterBased])

    const onFormSubmit = (data: ProgrammeUnitFormData) => {
        if (isSemesterBased) data.module = null
        else { data.year_of_study = null; data.semester_number = null }
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

                        <div className="px-6 pt-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isSemesterBased ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                {isSemesterBased ? 'Semester-Based' : 'Module-Based'} Programme
                            </span>
                        </div>

                        <form onSubmit={handleSubmit(onFormSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Controller
                                            name="unit"
                                            control={control}
                                            rules={{ required: 'Unit is required' }}
                                            render={({ field }) => (
                                                <ComboboxField
                                                    label={<>Unit <span className="text-red-500">*</span></>}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Search unit by code or name…"
                                                    disabled={isEdit}
                                                    options={units.map(u => ({
                                                        value: u.id,
                                                        label: u.name,
                                                        description: `${u.code} · ${u.credit_hours} cr`,
                                                        badge: u.unit_type,
                                                    }))}
                                                />
                                            )}
                                        />
                                        {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
                                    </div>

                                    {isSemesterBased && (
                                        <>
                                            <Controller
                                                name="year_of_study"
                                                control={control}
                                                rules={{ required: 'Year is required' }}
                                                render={({ field }) => (
                                                    <SelectField
                                                        label={<>Year of Study <span className="text-red-500">*</span></>}
                                                        value={field.value ? String(field.value) : ''}
                                                        onChange={(v) => field.onChange(Number(v))}
                                                        placeholder="Select year…"
                                                        options={yearOptions}
                                                    />
                                                )}
                                            />
                                            {errors.year_of_study && <p className="mt-1 text-sm text-red-600">{errors.year_of_study.message}</p>}

                                            <Controller
                                                name="semester_number"
                                                control={control}
                                                rules={{ required: 'Semester is required' }}
                                                render={({ field }) => (
                                                    <SelectField
                                                        label={<>Semester Number <span className="text-red-500">*</span></>}
                                                        value={field.value ? String(field.value) : ''}
                                                        onChange={(v) => field.onChange(Number(v))}
                                                        placeholder="Select semester…"
                                                        options={SEMESTER_OPTIONS}
                                                    />
                                                )}
                                            />
                                            {errors.semester_number && <p className="mt-1 text-sm text-red-600">{errors.semester_number.message}</p>}
                                        </>
                                    )}

                                    {!isSemesterBased && (
                                        <div className="sm:col-span-2">
                                            <Controller
                                                name="module"
                                                control={control}
                                                rules={{ required: 'Module is required' }}
                                                render={({ field }) => (
                                                    <SelectField
                                                        label={<>Module <span className="text-red-500">*</span></>}
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        placeholder="Select module…"
                                                        options={modules.map(m => ({
                                                            value: m.id,
                                                            label: m.name,
                                                            description: `Module ${m.module_number}`,
                                                        }))}
                                                    />
                                                )}
                                            />
                                            {errors.module && <p className="mt-1 text-sm text-red-600">{errors.module.message}</p>}
                                        </div>
                                    )}

                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input type="checkbox" {...register('is_mandatory')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                            Mandatory unit
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
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
