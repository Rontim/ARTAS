import { useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { Module } from '../types'
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

    const inputCls = "mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forest-600 sm:text-sm sm:leading-6"

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900">
                                {isEdit ? 'Edit Module' : 'Add Module'}
                            </DialogTitle>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                        {errors.programme && <p className="mt-1 text-sm text-red-600">{errors.programme.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('name', { required: 'Name is required' })} placeholder="e.g. Module 1" className={inputCls} />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Module Number <span className="text-red-500">*</span></label>
                                        <input type="number" {...register('module_number', { required: 'Module number is required', valueAsNumber: true, min: 1 })} className={inputCls} />
                                        {errors.module_number && <p className="mt-1 text-sm text-red-600">{errors.module_number.message}</p>}
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
