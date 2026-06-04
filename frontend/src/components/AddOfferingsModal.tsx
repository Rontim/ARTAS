import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    XMarkIcon,
    BookOpenIcon,
    CheckIcon,
} from '@heroicons/react/24/outline'
import { academicService } from '../services/academicService'
import type { Semester, Programme, SemesterUnit } from '../types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SEMESTER_NUMBER: Record<string, number> = { first: 1, second: 2, third: 3 }
const SEMESTER_LABEL: Record<string, string> = {
    first: '1st',
    second: '2nd',
    third: '3rd',
    supplementary: 'Supplementary',
}

interface Props {
    isOpen: boolean
    onClose: () => void
    semester: Semester
    programme: Programme
    existingOfferings: SemesterUnit[]
    onSuccess: () => void
}

export default function AddOfferingsModal({
    isOpen,
    onClose,
    semester,
    programme,
    existingOfferings,
    onSuccess,
}: Props) {
    const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())
    const [yearFilter, setYearFilter] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const semesterNumber = SEMESTER_NUMBER[semester.semester_type]
    const existingUnitIds = useMemo(
        () => new Set(existingOfferings.map((o) => o.unit)),
        [existingOfferings]
    )

    const { data: curriculum = [], isLoading: curriculumLoading } = useQuery({
        queryKey: ['programme-units', programme.id],
        queryFn: () => academicService.getProgrammeUnits(programme.id),
        enabled: isOpen,
    })

    // Filter curriculum to units that belong to this semester type
    // Supplementary semesters show the full curriculum (retakes, no number restriction)
    const semesterUnits = useMemo(() => {
        if (!semesterNumber) return curriculum
        return curriculum.filter((u) => u.semester_number === semesterNumber)
    }, [curriculum, semesterNumber])

    // Distinct years present in the filtered units
    const years = useMemo(() => {
        const raw = semesterUnits.map((u) => u.year_of_study).filter((y): y is number => y != null)
        return [...new Set(raw)].sort((a, b) => a - b)
    }, [semesterUnits])

    // Units visible under the current year filter
    const visibleUnits = useMemo(
        () => (yearFilter ? semesterUnits.filter((u) => u.year_of_study === yearFilter) : semesterUnits),
        [semesterUnits, yearFilter]
    )

    // Units not yet offered (available to add)
    const availableUnits = visibleUnits.filter((u) => !existingUnitIds.has(u.unit))

    const toggleUnit = (unitId: string) => {
        setSelectedUnitIds((prev) => {
            const next = new Set(prev)
            next.has(unitId) ? next.delete(unitId) : next.add(unitId)
            return next
        })
    }

    const selectAll = () => setSelectedUnitIds(new Set(availableUnits.map((u) => u.unit)))
    const clearAll = () => setSelectedUnitIds(new Set())

    // "Add all from curriculum" — uses the backend bulk endpoint which auto-derives semester number
    const handleAddAll = async () => {
        setIsSubmitting(true)
        try {
            const payload: Parameters<typeof academicService.bulkCreateSemesterUnits>[0] = {
                semester: semester.id,
                programme: programme.id,
            }
            if (yearFilter) payload.year_of_study = yearFilter
            const result = await academicService.bulkCreateSemesterUnits(payload)
            toast.success(
                `Added ${result.created_count} unit${result.created_count !== 1 ? 's' : ''}` +
                    (result.skipped_count > 0 ? ` · ${result.skipped_count} already existed` : '')
            )
            onSuccess()
        } catch {
            toast.error('Failed to add offerings')
        } finally {
            setIsSubmitting(false)
        }
    }

    // "Add selected" — creates individual SemesterUnit records for checked units
    const handleAddSelected = async () => {
        if (selectedUnitIds.size === 0) return
        setIsSubmitting(true)
        const toCreate = [...selectedUnitIds].filter((id) => !existingUnitIds.has(id))
        try {
            await Promise.all(
                toCreate.map((unitId) =>
                    academicService.createSemesterUnit({
                        semester: semester.id,
                        unit: unitId,
                        programme: programme.id,
                    })
                )
            )
            toast.success(`Added ${toCreate.length} unit${toCreate.length !== 1 ? 's' : ''}`)
            onSuccess()
        } catch {
            toast.error('Failed to add some offerings. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />

                {/* Panel */}
                <div className="relative z-10 w-full sm:max-w-2xl transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8">
                    {/* ── Header: programme info ── */}
                    <div className="bg-forest-700 px-6 py-5 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <BookOpenIcon className="h-8 w-8 opacity-75 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-xs font-mono bg-forest-600 px-2 py-0.5 rounded">
                                        {programme.code}
                                    </span>
                                    <h2 className="text-lg font-semibold mt-1 leading-snug">
                                        {programme.name}
                                    </h2>
                                    <p className="text-sm text-forest-200 mt-0.5">
                                        {programme.department_name} ·{' '}
                                        {programme.programme_type.charAt(0).toUpperCase() +
                                            programme.programme_type.slice(1)}{' '}
                                        · {programme.duration_years} yr
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-4 text-forest-200 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Semester context */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-forest-100 border-t border-forest-600 pt-3">
                            <span>
                                Semester:{' '}
                                <strong className="text-white">{semester.name}</strong>
                            </span>
                            <span className="text-forest-400">·</span>
                            <span>
                                Shows{' '}
                                <strong className="text-white">
                                    {SEMESTER_LABEL[semester.semester_type]}
                                </strong>{' '}
                                semester units from curriculum
                            </span>
                        </div>
                    </div>

                    {/* ── Body: unit list ── */}
                    <div className="px-6 py-4">
                        {curriculumLoading ? (
                            <div className="py-12 text-center text-gray-400 text-sm">
                                Loading curriculum…
                            </div>
                        ) : semesterUnits.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-500 text-sm">
                                    No curriculum units found for{' '}
                                    <strong>{semester.semester_type}</strong> semesters in this
                                    programme.
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Add units to the programme curriculum first.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Year filter pills */}
                                {years.length > 1 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <button
                                            onClick={() => setYearFilter(null)}
                                            className={clsx(
                                                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                                                yearFilter === null
                                                    ? 'bg-forest-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            )}
                                        >
                                            All Years
                                        </button>
                                        {years.map((y) => (
                                            <button
                                                key={y}
                                                onClick={() => setYearFilter(y)}
                                                className={clsx(
                                                    'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                                                    yearFilter === y
                                                        ? 'bg-forest-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                )}
                                            >
                                                Year {y}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Select all / clear row */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-500">
                                        {availableUnits.length} available
                                        {existingOfferings.length > 0 &&
                                            ` · ${existingOfferings.length} already offered`}
                                    </span>
                                    {availableUnits.length > 0 && (
                                        <button
                                            onClick={selectedUnitIds.size > 0 ? clearAll : selectAll}
                                            className="text-sm text-forest-600 hover:text-forest-800 font-medium"
                                        >
                                            {selectedUnitIds.size > 0 ? 'Clear selection' : 'Select all'}
                                        </button>
                                    )}
                                </div>

                                {/* Unit rows grouped by year */}
                                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                                    {years
                                        .filter((y) => !yearFilter || y === yearFilter)
                                        .map((year) => {
                                            const yearUnits = visibleUnits.filter(
                                                (u) => u.year_of_study === year
                                            )
                                            return (
                                                <div key={year}>
                                                    {!yearFilter && (
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1.5 first:mt-0">
                                                            Year {year}
                                                        </p>
                                                    )}
                                                    {yearUnits.map((pu) => {
                                                        const alreadyOffered = existingUnitIds.has(pu.unit)
                                                        const selected = selectedUnitIds.has(pu.unit)
                                                        return (
                                                            <label
                                                                key={pu.id}
                                                                className={clsx(
                                                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors',
                                                                    alreadyOffered
                                                                        ? 'bg-green-50 border-green-200 cursor-default'
                                                                        : selected
                                                                        ? 'bg-forest-50 border-forest-300 cursor-pointer'
                                                                        : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                                                                )}
                                                            >
                                                                <span className="flex-shrink-0">
                                                                    {alreadyOffered ? (
                                                                        <CheckIcon className="h-5 w-5 text-green-500" />
                                                                    ) : (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selected}
                                                                            onChange={() => toggleUnit(pu.unit)}
                                                                            className="h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                                                                        />
                                                                    )}
                                                                </span>

                                                                <span className="flex-1 min-w-0">
                                                                    <span className="block text-xs font-mono text-gray-400">
                                                                        {pu.unit_code}
                                                                    </span>
                                                                    <span className="block text-sm text-gray-900 truncate">
                                                                        {pu.unit_name}
                                                                    </span>
                                                                </span>

                                                                <span className="flex-shrink-0 text-xs text-gray-400">
                                                                    {pu.credit_hours} cr
                                                                </span>

                                                                {alreadyOffered && (
                                                                    <span className="flex-shrink-0 text-xs font-medium text-green-600">
                                                                        Offered
                                                                    </span>
                                                                )}
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 border-t">
                        {/* Quick "add all" link */}
                        <button
                            onClick={handleAddAll}
                            disabled={isSubmitting || semesterUnits.length === 0}
                            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Add all{yearFilter ? ` Year ${yearFilter}` : ''} from curriculum
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSelected}
                                disabled={selectedUnitIds.size === 0 || isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-forest-600 border border-transparent rounded-md hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting
                                    ? 'Adding…'
                                    : selectedUnitIds.size > 0
                                    ? `Add Selected (${selectedUnitIds.size})`
                                    : 'Add Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
