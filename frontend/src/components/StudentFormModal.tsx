import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Student } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Student' : 'Add Student'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="student-form" loading={loading}>
                        {isEdit ? 'Update Student' : 'Add Student'}
                    </Button>
                </>
            }
        >
            <form id="student-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <Input
                                label="Registration Number *"
                                type="text"
                                {...register('reg_no', { required: 'Registration number is required' })}
                                disabled={isEdit}
                                error={errors.reg_no?.message}
                            />
                        </div>

                        <Input
                            label="First Name *"
                            type="text"
                            {...register('first_name', { required: 'First name is required' })}
                            error={errors.first_name?.message}
                        />

                        <Input
                            label="Middle Name"
                            type="text"
                            {...register('middle_name')}
                        />

                        <Input
                            label="Last Name *"
                            type="text"
                            {...register('last_name', { required: 'Last name is required' })}
                            error={errors.last_name?.message}
                        />

                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            {...register('phone_number')}
                        />

                        <Input
                            label="Date of Birth"
                            type="date"
                            {...register('date_of_birth')}
                        />

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

                        <Input
                            label="Nationality"
                            type="text"
                            {...register('nationality')}
                        />

                        <Input
                            label="National ID"
                            type="text"
                            {...register('national_id')}
                        />

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
                            {errors.programme && <p className="mt-1 text-xs text-red-600">{errors.programme.message}</p>}
                        </div>

                        <Input
                            label="Admission Year *"
                            type="number"
                            {...register('admission_year', {
                                required: 'Admission year is required',
                                valueAsNumber: true,
                                min: { value: 2000, message: 'Year must be 2000 or later' },
                            })}
                            error={errors.admission_year?.message}
                        />

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
                            <Textarea
                                label="Address"
                                {...register('address')}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
