import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { AcademicYear } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'

export interface AcademicYearFormData {
    year: number
    name: string
    start_date: string
    end_date: string
    is_current: boolean
}

interface AcademicYearFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: AcademicYearFormData) => void
    academicYear?: AcademicYear | null
    loading?: boolean
}

export default function AcademicYearFormModal({
    open, onClose, onSubmit, academicYear, loading = false
}: AcademicYearFormModalProps) {
    const isEdit = !!academicYear

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AcademicYearFormData>({
        defaultValues: { year: new Date().getFullYear(), is_current: false }
    })

    useEffect(() => {
        if (open) {
            reset(academicYear ? {
                year: academicYear.year, name: academicYear.name,
                start_date: academicYear.start_date, end_date: academicYear.end_date,
                is_current: academicYear.is_current,
            } : {
                year: new Date().getFullYear(), name: '', start_date: '', end_date: '', is_current: false,
            })
        }
    }, [academicYear, reset, open])

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Academic Year' : 'Add Academic Year'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="academic-year-form" loading={loading}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="academic-year-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <Input
                                label="Name *"
                                type="text"
                                {...register('name', { required: 'Name is required' })}
                                placeholder="e.g. 2024/2025"
                                error={errors.name?.message}
                            />
                        </div>

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

                        <div className="sm:col-span-2">
                            <Controller
                                control={control}
                                name="is_current"
                                render={({ field }) => (
                                    <Checkbox
                                        label="Set as Current Year"
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
