import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Student } from '../types'
import { SelectField } from './ui/SelectField'
import { ComboboxField } from './ui/ComboboxField'

export interface StudentFormData {
    reg_no: string
    first_name: string
    middle_name?: string
    last_name: string
    email?: string
    phone_number?: string
    address?: string
    date_of_birth?: string
    gender?: string
    nationality?: string
    national_id?: string
    programme: string
    admission_year: number
    status: 'active' | 'graduated' | 'suspended' | 'withdrawn' | 'deferred'
}

interface StudentFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: StudentFormData) => void
    student?: Student | null
    loading?: boolean
}

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'deferred', label: 'Deferred' },
]

export default function StudentFormModal({
    open, onClose, onSubmit, student, loading = false
}: StudentFormModalProps) {
    const isEdit = !!student

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<StudentFormData>({
        defaultValues: { status: 'active', admission_year: new Date().getFullYear() }
    })

    const { data: programmes = [] } = useQuery({
        queryKey: ['programmes'],
        queryFn: () => academicService.getProgrammes(),
        enabled: open,
    })

    useEffect(() => {
        if (open) {
            reset(student ? {
                reg_no: student.reg_no,
                first_name: student.first_name,
                middle_name: student.middle_name || '',
                last_name: student.last_name,
                email: student.email || '',
                phone_number: student.phone_number || '',
                address: student.address || '',
                date_of_birth: student.date_of_birth || '',
                gender: student.gender || '',
                nationality: student.nationality || '',
                national_id: student.national_id || '',
                programme: student.programme,
                admission_year: student.admission_year,
                status: student.status,
            } : {
                reg_no: '', first_name: '', middle_name: '', last_name: '',
                email: '', phone_number: '', address: '', date_of_birth: '',
                gender: '', nationality: '', national_id: '', programme: '',
                admission_year: new Date().getFullYear(), status: 'active',
            })
        }
    }, [student, reset, open])

    const inputCls = "mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forest-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Student' : 'Add Student'}
                            </DialogTitle>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Registration Number <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('reg_no', { required: 'Registration number is required' })} disabled={isEdit} className={inputCls} />
                                        {errors.reg_no && <p className="mt-1 text-sm text-red-600">{errors.reg_no.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('first_name', { required: 'First name is required' })} className={inputCls} />
                                        {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                                        <input type="text" {...register('middle_name')} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('last_name', { required: 'Last name is required' })} className={inputCls} />
                                        {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input type="email" {...register('email')} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                        <input type="tel" {...register('phone_number')} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                        <input type="date" {...register('date_of_birth')} className={inputCls} />
                                    </div>

                                    <Controller
                                        name="gender"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectField
                                                label="Gender"
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                placeholder="Select gender…"
                                                options={GENDER_OPTIONS}
                                            />
                                        )}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nationality</label>
                                        <input type="text" {...register('nationality')} className={inputCls} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">National ID</label>
                                        <input type="text" {...register('national_id')} className={inputCls} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Controller
                                            name="programme"
                                            control={control}
                                            rules={{ required: 'Programme is required' }}
                                            render={({ field }) => (
                                                <ComboboxField
                                                    label={<>Programme <span className="text-red-500">*</span></>}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Search programme…"
                                                    options={programmes.map(p => ({
                                                        value: p.id,
                                                        label: p.name,
                                                        description: `${p.code} · ${p.programme_type}`,
                                                    }))}
                                                />
                                            )}
                                        />
                                        {errors.programme && <p className="mt-1 text-sm text-red-600">{errors.programme.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Admission Year <span className="text-red-500">*</span></label>
                                        <input type="number" {...register('admission_year', { required: 'Admission year is required', valueAsNumber: true, min: { value: 2000, message: 'Year must be 2000 or later' } })} className={inputCls} />
                                        {errors.admission_year && <p className="mt-1 text-sm text-red-600">{errors.admission_year.message}</p>}
                                    </div>

                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectField
                                                label="Status"
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={STATUS_OPTIONS}
                                            />
                                        )}
                                    />

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <textarea rows={2} {...register('address')} className={inputCls} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                                <button type="button" onClick={onClose} disabled={loading} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="rounded-md bg-forest-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-500 disabled:opacity-50">
                                    {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
