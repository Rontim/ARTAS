import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Module } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { ComboboxField } from './ui/ComboboxField'

export interface ModuleFormData {
    programme: string
    name: string
    module_number: number
    description?: string
    is_active: boolean
}

interface ModuleFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: ModuleFormData) => void
    module?: Module | null
    loading?: boolean
}

export default function ModuleFormModal({
    open, onClose, onSubmit, module: mod, loading = false
}: ModuleFormModalProps) {
    const isEdit = !!mod

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ModuleFormData>({
        defaultValues: { module_number: 1, is_active: true }
    })

    const { data: programmes = [] } = useQuery({
        queryKey: ['programmes'],
        queryFn: () => academicService.getProgrammes(),
        enabled: open,
    })

    const moduleProgrammes = programmes.filter(p => p.structure === 'module')

    useEffect(() => {
        if (open) {
            reset(mod ? {
                programme: mod.programme, name: mod.name,
                module_number: mod.module_number, description: mod.description || '', is_active: mod.is_active,
            } : { programme: '', name: '', module_number: 1, description: '', is_active: true })
        }
    }, [mod, reset, open])

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Module' : 'Add Module'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" form="module-form" loading={loading}>
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="module-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                        placeholder="Search module-based programme…"
                                        options={moduleProgrammes.map(p => ({
                                            value: p.id,
                                            label: p.name,
                                            description: p.code,
                                        }))}
                                    />
                                )}
                            />
                            {errors.programme && <p className="mt-1 text-xs text-red-600">{errors.programme.message}</p>}
                        </div>

                        <Input
                            label="Name *"
                            type="text"
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g. Module 1"
                            error={errors.name?.message}
                        />

                        <Input
                            label="Module Number *"
                            type="number"
                            {...register('module_number', { required: 'Module number is required', valueAsNumber: true, min: 1 })}
                            error={errors.module_number?.message}
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
