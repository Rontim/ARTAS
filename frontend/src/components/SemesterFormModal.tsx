import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Semester } from '../types'
import { SelectField } from './ui/SelectField'

export interface SemesterFormData {
    academic_year: string
    name: string
    semester_type: 'first' | 'second' | 'third' | 'supplementary'
    year: number
    start_date: string
    end_date: string
    registration_deadline?: string
    marks_submission_deadline?: string
    is_active: boolean
}

interface SemesterFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: SemesterFormData) => void
    semester?: Semester | null
    loading?: boolean
}

const SEMESTER_TYPE_OPTIONS = [
    { value: 'first', label: 'First Semester' },
    { value: 'second', label: 'Second Semester' },
    { value: 'third', label: 'Third Semester' },
    { value: 'supplementary', label: 'Supplementary' },
]

export default function SemesterFormModal({
    open, onClose, onSubmit, semester, loading = false
}: SemesterFormModalProps) {
    const isEdit = !!semester

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<SemesterFormData>({
        defaultValues: { semester_type: 'first', year: new Date().getFullYear(), is_active: true }
    })

    const { data: academicYears = [] } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => academicService.getAcademicYears(),
        enabled: open,
    })

    useEffect(() => {
        if (open) {
            reset(semester ? {
                academic_year: semester.academic_year, name: semester.name,
                semester_type: semester.semester_type, year: semester.year,
                start_date: semester.start_date, end_date: semester.end_date,
                registration_deadline: semester.registration_deadline || '',
                marks_submission_deadline: semester.marks_submission_deadline || '',
                is_active: semester.is_active,
            } : {
                academic_year: '', name: '', semester_type: 'first',
                year: new Date().getFullYear(), start_date: '', end_date: '',
                registration_deadline: '', marks_submission_deadline: '', is_active: true,
            })
        }
    }, [semester, reset, open])

    const inputCls = "mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Semester' : 'Add Semester'}
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
                                            name="academic_year"
                                            control={control}
                                            rules={{ required: 'Academic year is required' }}
                                            render={({ field }) => (
                                                <SelectField
                                                    label={<>Academic Year <span className="text-red-500">*</span></>}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select academic year…"
                                                    options={academicYears.map((ay: { id: string; name: string }) => ({
                                                        value: ay.id,
                                                        label: ay.name,
                                                    }))}
                                                />
                                            )}
                                        />
                                        {errors.academic_year && <p className="mt-1 text-sm text-red-600">{errors.academic_year.message}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('name', { required: 'Name is required' })} placeholder="e.g. Semester 1 2024/2025" className={inputCls} />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    <Controller
                                        name="semester_type"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectField
                                                label="Type"
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={SEMESTER_TYPE_OPTIONS}
                                            />
                                        )}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                                        <input type="number" {...register('year', { required: 'Year is required', valueAsNumber: true })} className={inputCls} />
                                        {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                                        <input type="date" {...register('start_date', { required: 'Start date is required' })} className={inputCls} />
                                        {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                                        <input type="date" {...register('end_date', { required: 'End date is required' })} className={inputCls} />
                                        {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                                        <input type="date" {...register('registration_deadline')} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Marks Deadline</label>
                                        <input type="date" {...register('marks_submission_deadline')} className={inputCls} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
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
