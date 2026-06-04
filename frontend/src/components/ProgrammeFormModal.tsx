import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Programme } from '../types'
import { SelectField } from './ui/SelectField'
import { ComboboxField } from './ui/ComboboxField'

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

const PROGRAMME_TYPE_OPTIONS = [
    { value: 'certificate', label: 'Certificate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'phd', label: 'Doctor of Philosophy' },
]

const STRUCTURE_OPTIONS = [
    { value: 'semester', label: 'Semester Based' },
    { value: 'module', label: 'Module Based' },
]

export default function ProgrammeFormModal({
    open, onClose, onSubmit, programme, loading = false
}: ProgrammeFormModalProps) {
    const isEdit = !!programme

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProgrammeFormData>({
        defaultValues: { programme_type: 'bachelors', structure: 'semester', duration_years: 4, total_credits_required: 120, is_active: true }
    })

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => academicService.getDepartments(),
        enabled: open,
    })

    useEffect(() => {
        if (open) {
            reset(programme ? {
                name: programme.name, code: programme.code, department: programme.department,
                programme_type: programme.programme_type, structure: programme.structure,
                duration_years: programme.duration_years, total_credits_required: programme.total_credits_required,
                description: programme.description || '', is_active: programme.is_active,
            } : {
                name: '', code: '', department: '', programme_type: 'bachelors',
                structure: 'semester', duration_years: 4, total_credits_required: 120,
                description: '', is_active: true,
            })
        }
    }, [programme, reset, open])

    const inputCls = "mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forest-600 sm:text-sm sm:leading-6"

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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('code', { required: 'Code is required' })} placeholder="e.g. BSC-CS" className={inputCls} />
                                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('name', { required: 'Name is required' })} className={inputCls} />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Controller
                                            name="department"
                                            control={control}
                                            rules={{ required: 'Department is required' }}
                                            render={({ field }) => (
                                                <ComboboxField
                                                    label={<>Department <span className="text-red-500">*</span></>}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Search department…"
                                                    options={departments.map(d => ({
                                                        value: d.id,
                                                        label: d.name,
                                                        description: d.code,
                                                    }))}
                                                />
                                            )}
                                        />
                                        {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                                    </div>

                                    <Controller
                                        name="programme_type"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectField
                                                label="Programme Type"
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={PROGRAMME_TYPE_OPTIONS}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="structure"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectField
                                                label="Structure"
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={STRUCTURE_OPTIONS}
                                            />
                                        )}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Duration (years) <span className="text-red-500">*</span></label>
                                        <input type="number" {...register('duration_years', { required: 'Duration is required', valueAsNumber: true, min: 1 })} className={inputCls} />
                                        {errors.duration_years && <p className="mt-1 text-sm text-red-600">{errors.duration_years.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Total Credits Required <span className="text-red-500">*</span></label>
                                        <input type="number" {...register('total_credits_required', { required: 'Credits required', valueAsNumber: true, min: 1 })} className={inputCls} />
                                        {errors.total_credits_required && <p className="mt-1 text-sm text-red-600">{errors.total_credits_required.message}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea rows={3} {...register('description')} className={inputCls} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-forest-600 focus:ring-forest-600" />
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="rounded-md bg-forest-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-500 disabled:opacity-50">
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
