import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Semester } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Semester' : 'Add Semester'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="semester-form" loading={loading}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="semester-form" onSubmit={handleSubmit((data) => onSubmit({
                ...data,
                registration_deadline: data.registration_deadline || undefined,
                marks_submission_deadline: data.marks_submission_deadline || undefined,
            }))} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                            {errors.academic_year && <p className="mt-1 text-xs text-red-600">{errors.academic_year.message}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <Input
                                label="Name *"
                                type="text"
                                {...register('name', { required: 'Name is required' })}
                                placeholder="e.g. Semester 1 2024/2025"
                                error={errors.name?.message}
                            />
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

                        <Input
                            label="Year *"
                            type="number"
                            {...register('year', { required: 'Year is required', valueAsNumber: true })}
                            error={errors.year?.message}
                        />

                        <Input
                            label="Start Date *"
                            type="date"
                            {...register('start_date', { required: 'Start date is required' })}
                            error={errors.start_date?.message}
                        />

                        <Input
                            label="End Date *"
                            type="date"
                            {...register('end_date', { required: 'End date is required' })}
                            error={errors.end_date?.message}
                        />

                        <Input
                            label="Registration Deadline"
                            type="date"
                            {...register('registration_deadline')}
                        />

                        <Input
                            label="Marks Deadline"
                            type="date"
                            {...register('marks_submission_deadline')}
                        />

                        <div className="sm:col-span-2">
                            <Controller
                                control={control}
                                name="is_active"
                                render={({ field }) => (
                                    <Checkbox
                                        label="Active"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
