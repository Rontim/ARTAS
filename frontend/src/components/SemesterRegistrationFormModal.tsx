import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Semester } from '../types'
import UnitSelectionComponent from './UnitSelectionComponent'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
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
        <Modal
            open={open}
            onClose={onClose}
            title={registration ? 'Manage Units & Registration' : 'Register for Semester'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="semester-registration-form" loading={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </>
            }
        >
            <form id="semester-registration-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

                        <div className="flex items-center pt-6">
                            <Controller
                                name="is_repeat"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        label="Repeat semester"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
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
            </form>
        </Modal>
    )
}
