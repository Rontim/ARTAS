import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Unit } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { SelectField } from './ui/SelectField'

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

const UNIT_TYPE_OPTIONS = [
    { value: 'core', label: 'Core' },
    { value: 'elective', label: 'Elective' },
    { value: 'common', label: 'Common Course' },
]

const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Year ${i + 1}`,
}))

const SEMESTER_OPTIONS = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
]

export default function UnitFormModal({
    open, onClose, onSubmit, unit, loading = false
}: UnitFormModalProps) {
    const isEdit = !!unit

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UnitFormData>({
        defaultValues: { unit_type: 'core', credit_hours: 3, recommended_year: 1, recommended_semester: 1, is_active: true }
    })

    useEffect(() => {
        if (open) {
            reset(unit ? {
                code: unit.code, name: unit.name, description: unit.description || '',
                credit_hours: unit.credit_hours, unit_type: unit.unit_type,
                recommended_year: unit.recommended_year, recommended_semester: unit.recommended_semester,
                is_active: unit.is_active,
            } : { code: '', name: '', description: '', credit_hours: 3, unit_type: 'core', recommended_year: 1, recommended_semester: 1, is_active: true })
        }
    }, [unit, reset, open])

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Unit' : 'Add Unit'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="unit-form" loading={loading}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="unit-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                            label="Code *"
                            type="text"
                            {...register('code', { required: 'Code is required' })}
                            placeholder="e.g. CS101"
                            error={errors.code?.message}
                        />

                        <Input
                            label="Name *"
                            type="text"
                            {...register('name', { required: 'Name is required' })}
                            error={errors.name?.message}
                        />

                        <Input
                            label="Credit Hours *"
                            type="number"
                            {...register('credit_hours', { required: 'Credit hours required', valueAsNumber: true, min: 1 })}
                            error={errors.credit_hours?.message}
                        />

                        <Controller
                            name="unit_type"
                            control={control}
                            render={({ field }) => (
                                <SelectField
                                    label="Type"
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={UNIT_TYPE_OPTIONS}
                                />
                            )}
                        />

                        <Controller
                            name="recommended_year"
                            control={control}
                            render={({ field }) => (
                                <SelectField
                                    label="Recommended Year"
                                    value={String(field.value)}
                                    onChange={(v) => field.onChange(Number(v))}
                                    options={YEAR_OPTIONS}
                                />
                            )}
                        />

                        <Controller
                            name="recommended_semester"
                            control={control}
                            render={({ field }) => (
                                <SelectField
                                    label="Recommended Semester"
                                    value={String(field.value)}
                                    onChange={(v) => field.onChange(Number(v))}
                                    options={SEMESTER_OPTIONS}
                                />
                            )}
                        />

                        <div className="sm:col-span-2">
                            <Textarea
                                label="Description"
                                {...register('description')}
                                rows={3}
                            />
                        </div>

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
