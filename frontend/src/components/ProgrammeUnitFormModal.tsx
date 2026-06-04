import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { ProgrammeUnit, Programme } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
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

    const { handleSubmit, reset, control, formState: { errors } } = useForm<ProgrammeUnitFormData>({
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
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Curriculum Unit' : 'Add Unit to Curriculum'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="programme-unit-form" loading={loading}>
                        {isEdit ? 'Update' : 'Add to Curriculum'}
                    </Button>
                </>
            }
        >
            <form id="programme-unit-form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
                <div className="space-y-5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isSemesterBased ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {isSemesterBased ? 'Semester-Based' : 'Module-Based'} Programme
                    </span>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            <Controller
                                control={control}
                                name="is_mandatory"
                                render={({ field }) => (
                                    <Checkbox
                                        label="Mandatory unit"
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
