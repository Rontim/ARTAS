import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Semester } from '../types'
import UnitSelectionComponent from './UnitSelectionComponent'
import { SelectField } from './ui/SelectField'

export interface SemesterRegistrationFormData {
    semester: string
    year_of_study: number
    is_repeat: boolean
    unit_ids: string[]
}

interface SemesterRegistrationFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: SemesterRegistrationFormData) => void
    programmeId: string
    programmeDuration?: number
    registration?: any
    loading?: boolean
}

export default function SemesterRegistrationFormModal({
    open, onClose, onSubmit, programmeId, programmeDuration = 8, registration, loading = false,
}: SemesterRegistrationFormModalProps) {
    const { handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<SemesterRegistrationFormData>({
        defaultValues: { semester: '', year_of_study: 1, is_repeat: false, unit_ids: [] },
    })

    const selectedSemester = watch('semester')
    const selectedUnitIds = watch('unit_ids') || []

    const { data: semesters = [] } = useQuery({
        queryKey: ['semesters'],
        queryFn: () => academicService.getSemesters(),
        enabled: open,
    })

    const yearOptions = Array.from({ length: programmeDuration }, (_, i) => ({
        value: String(i + 1),
        label: `Year ${i + 1}`,
    }))

    useEffect(() => {
        if (open) {
            reset(registration ? {
                semester: registration.semester,
                year_of_study: registration.year_of_study,
                is_repeat: registration.is_repeat,
                unit_ids: registration.units?.map((u: any) => u.unit) || [],
            } : { semester: '', year_of_study: 1, is_repeat: false, unit_ids: [] })
        }
    }, [open, registration, reset])

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {registration ? 'Manage Units & Registration' : 'Register for Semester'}
                            </DialogTitle>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Controller
                                            name="semester"
                                            control={control}
                                            rules={{ required: 'Semester is required' }}
                                            render={({ field }) => (
                                                <SelectField
                                                    label={<>Semester <span className="text-red-500">*</span></>}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select a semester…"
                                                    options={semesters.map((s: Semester) => ({
                                                        value: s.id,
                                                        label: s.name,
                                                        description: s.academic_year_name,
                                                        badge: s.is_active ? 'Active' : undefined,
                                                    }))}
                                                />
                                            )}
                                        />
                                        {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>}
                                    </div>

                                    <Controller
                                        name="year_of_study"
                                        control={control}
                                        rules={{ required: 'Year of study is required' }}
                                        render={({ field }) => (
                                            <SelectField
                                                label={<>Year of Study <span className="text-red-500">*</span></>}
                                                value={String(field.value)}
                                                onChange={(v) => field.onChange(Number(v))}
                                                options={yearOptions}
                                            />
                                        )}
                                    />

                                    <div className="flex items-center gap-2 pt-6">
                                        <Controller
                                            name="is_repeat"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                                />
                                            )}
                                        />
                                        <label className="text-sm font-medium text-gray-700">Repeat semester</label>
                                    </div>

                                    {selectedSemester && (
                                        <div className="sm:col-span-2">
                                            <UnitSelectionComponent
                                                semesterId={selectedSemester}
                                                programmeId={programmeId}
                                                selectedUnitIds={selectedUnitIds}
                                                onChange={(ids) => setValue('unit_ids', ids)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 px-6 py-4 sm:flex sm:flex-row-reverse">
                                <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                                    {loading ? 'Registering...' : 'Register'}
                                </button>
                                <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
