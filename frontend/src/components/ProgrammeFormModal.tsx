import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Programme } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Programme' : 'Add Programme'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="programme-form" loading={loading}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="programme-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                            label="Code *"
                            type="text"
                            {...register('code', { required: 'Code is required' })}
                            placeholder="e.g. BSC-CS"
                            error={errors.code?.message}
                        />

                        <Input
                            label="Name *"
                            type="text"
                            {...register('name', { required: 'Name is required' })}
                            error={errors.name?.message}
                        />

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
                            {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
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

                        <Input
                            label="Duration (years) *"
                            type="number"
                            {...register('duration_years', { required: 'Duration is required', valueAsNumber: true, min: 1 })}
                            error={errors.duration_years?.message}
                        />

                        <Input
                            label="Total Credits Required *"
                            type="number"
                            {...register('total_credits_required', { required: 'Credits required', valueAsNumber: true, min: 1 })}
                            error={errors.total_credits_required?.message}
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
