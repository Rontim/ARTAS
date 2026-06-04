import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import {
    BookOpenIcon,
    PlusCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import type { Semester, Programme } from '../types'
import AddOfferingsModal from '../components/AddOfferingsModal'
import { SelectField } from '../components/ui/SelectField'
import { ComboboxField } from '../components/ui/ComboboxField'

export default function SemesterOfferingsPage() {
    const queryClient = useQueryClient()
    const [selectedSemester, setSelectedSemester] = useState<string>('')
    const [programmeFilter, setProgrammeFilter] = useState<string>('')
    const [modalProgramme, setModalProgramme] = useState<Programme | null>(null)

    const { data: semesters = [] } = useQuery({
        queryKey: ['semesters'],
        queryFn: academicService.getSemesters,
    })

    // Auto-select the active semester on load
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            const active = semesters.find((s) => s.is_active)
            setSelectedSemester(active ? active.id : semesters[0].id)
        }
    }, [semesters, selectedSemester])

    const selectedSemesterObj = semesters.find((s) => s.id === selectedSemester)

    const { data: programmes = [] } = useQuery({
        queryKey: ['programmes'],
        queryFn: () => academicService.getProgrammes(),
    })

    // Fetch all offerings for the selected semester (large page_size to avoid pagination gaps)
    const { data: allOfferings = [], isLoading: offeringsLoading } = useQuery({
        queryKey: ['semester-unit-offerings', selectedSemester],
        queryFn: () => academicService.getSemesterUnits(selectedSemester, undefined, 500),
        enabled: !!selectedSemester,
    })

    // Map programme id → offering count
    const offeringsByProgramme = allOfferings.reduce<Record<string, number>>((acc, o) => {
        acc[o.programme] = (acc[o.programme] || 0) + 1
        return acc
    }, {})

    // programmeFilter is now a programme ID from the combobox (empty = show all)
    const filteredProgrammes = programmes.filter(
        (p) => !programmeFilter || p.id === programmeFilter
    )

    const totalProgrammesWithOfferings = Object.keys(offeringsByProgramme).length

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Semester Offerings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure which units are offered per programme each semester.
                </p>
            </div>

            {/* Controls bar */}
            <div className="bg-white shadow rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap gap-4 items-end">
                    <SelectField
                        label="Semester"
                        value={selectedSemester}
                        onChange={setSelectedSemester}
                        placeholder="Select semester…"
                        className="flex-1 min-w-[220px]"
                        options={semesters.map((s) => ({
                            value: s.id,
                            label: s.name,
                            description: s.academic_year_name,
                            badge: s.is_active ? 'Active' : undefined,
                        }))}
                    />

                    <ComboboxField
                        label="Filter Programmes"
                        value={programmeFilter}
                        onChange={setProgrammeFilter}
                        placeholder="Search by name or code…"
                        className="flex-1 min-w-[220px]"
                        options={[
                            { value: '', label: 'All programmes' },
                            ...programmes.map((p) => ({
                                value: p.id,
                                label: p.name,
                                description: p.code,
                                badge: p.programme_type,
                            })),
                        ]}
                    />
                </div>

                {/* Semester summary strip */}
                {selectedSemesterObj && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 pt-1 border-t border-gray-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {selectedSemesterObj.semester_type.charAt(0).toUpperCase() +
                                selectedSemesterObj.semester_type.slice(1)}{' '}
                            Semester
                        </span>
                        <span>{selectedSemesterObj.academic_year_name}</span>
                        {selectedSemesterObj.is_active && (
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircleIconSolid className="h-4 w-4" />
                                Currently active
                            </span>
                        )}
                        <span className="ml-auto text-gray-400">
                            {allOfferings.length} units offered across {totalProgrammesWithOfferings} programme
                            {totalProgrammesWithOfferings !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Programme cards */}
            {!selectedSemester ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <p className="text-gray-500">Select a semester above to manage its unit offerings.</p>
                </div>
            ) : offeringsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white shadow rounded-lg p-5 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                            <div className="h-8 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredProgrammes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No programmes match your search.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProgrammes.map((programme) => {
                        const count = offeringsByProgramme[programme.id] || 0
                        const hasOfferings = count > 0
                        return (
                            <div
                                key={programme.id}
                                className={`bg-white shadow rounded-lg p-5 flex flex-col gap-3 border-l-4 transition-shadow hover:shadow-md ${
                                    hasOfferings ? 'border-green-400' : 'border-amber-400'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <span className="inline-block text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded mb-1">
                                            {programme.code}
                                        </span>
                                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                                            {programme.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {programme.department_name} · {programme.programme_type}
                                        </p>
                                    </div>
                                    {hasOfferings ? (
                                        <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <BookOpenIcon className="h-6 w-6 text-amber-300 flex-shrink-0" />
                                    )}
                                </div>

                                <div className="text-sm">
                                    {hasOfferings ? (
                                        <span className="text-green-700 font-medium">
                                            {count} unit{count !== 1 ? 's' : ''} offered this semester
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium">
                                            No offerings set up yet
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => setModalProgramme(programme)}
                                    className={`mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        hasOfferings
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                                    }`}
                                >
                                    <PlusCircleIcon className="h-4 w-4" />
                                    {hasOfferings ? 'Manage Offerings' : 'Add Offerings'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Offerings modal */}
            {modalProgramme && selectedSemesterObj && (
                <AddOfferingsModal
                    isOpen={!!modalProgramme}
                    onClose={() => setModalProgramme(null)}
                    semester={selectedSemesterObj}
                    programme={modalProgramme}
                    existingOfferings={allOfferings.filter((o) => o.programme === modalProgramme.id)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({
                            queryKey: ['semester-unit-offerings', selectedSemester],
                        })
                        setModalProgramme(null)
                    }}
                />
            )}
        </div>
    )
}
