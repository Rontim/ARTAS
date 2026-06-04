import { useState, useMemo, useEffect } from 'react'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { studentService } from '../services/studentService'
import { gradeService } from '../services/gradeService'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import type { StudentResult, SemesterAggregate } from '../types'
import { Modal } from './ui/modal'
import { Button } from './ui/button'

interface UnitRow {
    id: string           // SemesterRegistrationUnit.id — passed as unit_registration FK
    unit_code: string
    unit_name: string
    credit_hours: number
    status: string
}

interface Registration {
    id: string
    semester: string
    semester_name: string
    year_of_study: number
    units: UnitRow[]
}

interface Props {
    open: boolean
    onClose: () => void
    studentId: string
    studentName: string
    registration: Registration
}

const GRADE_COLOURS: Record<string, string> = {
    A: 'bg-forest-100 text-forest-800',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-gold-100 text-gold-700',
    D: 'bg-orange-100 text-orange-700',
    E: 'bg-red-100 text-red-700',
}

export default function EnterMarksModal({ open, onClose, studentId, studentName, registration }: Props) {
    const queryClient = useQueryClient()

    const [marksInput, setMarksInput] = useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [savedResults, setSavedResults] = useState<Record<string, StudentResult>>({})
    const [aggregate, setAggregate] = useState<SemesterAggregate | null>(null)

    const { data: allResults = [], isLoading: resultsLoading } = useQuery({
        queryKey: ['student-results', studentId],
        queryFn: () => studentService.getStudentResults(studentId),
        enabled: open,
    })

    // Lookup: unitRegId → existing StudentResult
    const existingByUnitReg = useMemo(() => {
        const map: Record<string, StudentResult> = {}
        for (const r of allResults) map[r.unit_registration] = r
        return map
    }, [allResults])

    // Pre-populate inputs when modal opens / results load
    useEffect(() => {
        if (!open) return
        const initial: Record<string, string> = {}
        const saved: Record<string, StudentResult> = {}
        for (const unit of registration.units) {
            const existing = existingByUnitReg[unit.id]
            initial[unit.id] = existing ? String(existing.marks) : ''
            if (existing) saved[unit.id] = existing
        }
        setMarksInput(initial)
        setSavedResults(saved)
        setAggregate(null)
    }, [open, existingByUnitReg, registration.units])

    const units = registration.units

    // Completion state
    const enteredCount = units.filter(u => marksInput[u.id] !== '' && marksInput[u.id] !== undefined).length
    const totalCount = units.length
    const allEntered = enteredCount === totalCount && totalCount > 0
    const noneEntered = enteredCount === 0
    const isPartial = enteredCount > 0 && !allEntered

    const handleMarksChange = (unitRegId: string, value: string) => {
        setMarksInput(prev => ({ ...prev, [unitRegId]: value }))
    }

    const validate = (): boolean => {
        for (const unit of units) {
            const raw = marksInput[unit.id]
            if (raw === '' || raw === undefined) continue
            const val = parseFloat(raw)
            if (isNaN(val) || val < 0 || val > 100) {
                toast.error(`${unit.unit_code}: marks must be between 0 and 100`)
                return false
            }
        }
        return true
    }

    const save = async (forceAggregate: boolean) => {
        if (!validate()) return

        const toSave = units.filter(u => marksInput[u.id] !== '' && marksInput[u.id] !== undefined)
        if (toSave.length === 0) {
            toast.error('Enter marks for at least one unit')
            return
        }

        // Derive from the current marksInput state, not the render-snapshot closure,
        // so that typing the last missing mark and immediately clicking Save works correctly.
        const currentAllEntered = units.every(u => marksInput[u.id] !== '' && marksInput[u.id] !== undefined)

        setIsSaving(true)
        const newSaved: Record<string, StudentResult> = { ...savedResults }
        const errors: string[] = []

        // For the last result in the batch, we pass force_aggregate so the engine
        // triggers aggregate computation once (not on every intermediate save).
        for (let i = 0; i < toSave.length; i++) {
            const unit = toSave[i]
            const marks = parseFloat(marksInput[unit.id])
            const creditAttempted = unit.credit_hours
            const existing = existingByUnitReg[unit.id] || savedResults[unit.id]
            // Only attach force_aggregate on the last result to avoid redundant computation
            const isLast = i === toSave.length - 1
            const shouldForce = isLast && (forceAggregate || currentAllEntered)

            try {
                let result: StudentResult
                if (existing) {
                    result = await gradeService.updateResult(existing.id, {
                        marks,
                        credit_attempted: creditAttempted,
                        force_aggregate: shouldForce,
                    } as any)
                } else {
                    result = await gradeService.createResult({
                        unit_registration: unit.id,
                        marks,
                        credit_attempted: creditAttempted,
                        force_aggregate: shouldForce,
                    })
                }
                newSaved[unit.id] = result
            } catch (e: any) {
                const detail =
                    e?.response?.data?.non_field_errors?.[0] ||
                    e?.response?.data?.detail ||
                    `Failed to save ${unit.unit_code}`
                errors.push(detail)
            }
        }

        setSavedResults(newSaved)

        // Refresh semester aggregate display
        if (forceAggregate || currentAllEntered) {
            try {
                const agg = await gradeService.getStudentSemesterAggregate(studentId, registration.semester)
                setAggregate(agg)
            } catch { /* aggregate may not exist yet */ }
        }

        queryClient.invalidateQueries({ queryKey: ['student-results', studentId] })
        queryClient.invalidateQueries({ queryKey: ['student-cumulative', studentId] })
        queryClient.invalidateQueries({ queryKey: ['student-semester-aggregates', studentId] })

        if (errors.length > 0) {
            toast.error(`Saved with errors: ${errors.join('; ')}`)
        } else {
            const label = forceAggregate || currentAllEntered ? 'Marks saved and graded' : 'Marks saved'
            toast.success(`${label} — ${toSave.length} unit${toSave.length !== 1 ? 's' : ''}`)
        }

        setIsSaving(false)
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Enter Marks"
            size="lg"
            footer={
                <div className="w-full space-y-3">
                    {/* Override row — only when partial */}
                    {isPartial && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
                            <div className="flex items-center gap-2 text-sm text-amber-800">
                                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                                <span><strong>Override:</strong> grade now with {enteredCount}/{totalCount} marks.</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => save(true)}
                                disabled={isSaving || noneEntered}
                                className="text-amber-700 hover:bg-amber-100 ml-4 flex-shrink-0"
                            >
                                {isSaving ? 'Saving…' : 'Save & Grade Now'}
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {allEntered ? 'Grades and GPA are computed on save.' : isPartial ? 'Saving stores marks only.' : 'Enter marks, then save.'}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="secondary" type="button" onClick={onClose}>Close</Button>
                            <Button
                                variant={allEntered ? 'primary' : 'secondary'}
                                type="button"
                                onClick={() => save(false)}
                                disabled={noneEntered}
                                loading={isSaving}
                            >
                                {allEntered ? 'Save & Grade' : 'Save Marks'}
                            </Button>
                        </div>
                    </div>
                </div>
            }
        >
            {/* Subtitle inside body */}
            <p className="text-sm text-gray-500 -mt-1 mb-4">
                {studentName} &mdash; {registration.semester_name}
                <span className="ml-2 inline-flex items-center rounded-full bg-forest-100 text-forest-700 px-2 py-0.5 text-xs font-medium">
                    Year {registration.year_of_study}
                </span>
            </p>

            {/* Completion status banner */}
            {!resultsLoading && totalCount > 0 && (
                <div className={clsx(
                    'px-4 py-3 flex items-start gap-2 text-sm rounded-lg mb-4 border',
                    allEntered
                        ? 'bg-green-50 border-green-100 text-green-800'
                        : isPartial
                            ? 'bg-amber-50 border-amber-100 text-amber-800'
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                )}>
                    {allEntered ? (
                        <CheckBadgeIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                    ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
                    )}
                    <div>
                        {allEntered ? (
                            <span><strong>All {totalCount} units marked</strong> — semester grade will be computed on save.</span>
                        ) : isPartial ? (
                            <>
                                <span><strong>{enteredCount} of {totalCount} units marked</strong> — {totalCount - enteredCount} missing.</span>
                                <span className="ml-1">Semester grade will <em>not</em> be computed until all units are marked, unless you use the override below.</span>
                            </>
                        ) : (
                            <span>No marks entered yet. Fill in marks below and save.</span>
                        )}
                    </div>
                </div>
            )}

            {/* Unit table */}
            <div className="-mx-6">
                {resultsLoading ? (
                    <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
                ) : totalCount === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                        No units registered for this semester.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Cr.</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Marks (0–100)</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {units.map((unit) => {
                                const saved = savedResults[unit.id]
                                const grade = saved?.grade
                                const hasInput = marksInput[unit.id] !== '' && marksInput[unit.id] !== undefined
                                const gradeColour = grade ? (GRADE_COLOURS[grade] || 'bg-gray-100 text-gray-700') : ''

                                return (
                                    <tr
                                        key={unit.id}
                                        className={clsx(
                                            saved
                                                ? 'bg-green-50/30'
                                                : !hasInput
                                                    ? 'bg-amber-50/20'
                                                    : ''
                                        )}
                                    >
                                        <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">
                                            {unit.unit_code}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            <span>{unit.unit_name}</span>
                                            {!hasInput && !saved && (
                                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs">
                                                    Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-500">
                                            {unit.credit_hours}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={marksInput[unit.id] ?? ''}
                                                onChange={(e) => handleMarksChange(unit.id, e.target.value)}
                                                placeholder="—"
                                                className={clsx(
                                                    'w-24 rounded-lg border-0 text-center text-sm py-1.5 px-2',
                                                    'ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none focus:ring-forest-500',
                                                    'transition-shadow duration-150',
                                                    saved
                                                        ? 'ring-green-300 bg-green-50'
                                                        : 'ring-gray-300 bg-white'
                                                )}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {grade ? (
                                                <span className={clsx(
                                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                                                    gradeColour
                                                )}>
                                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                                    {grade}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Semester aggregate — shown after grading */}
            {aggregate && (
                <div className="border-t border-gray-100 bg-gray-50 -mx-6 px-6 py-4 mt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Semester Summary — {registration.semester_name}
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                        <Stat
                            label="Grade"
                            value={aggregate.semester_grade || '—'}
                            colour="grade"
                            gradeColour={GRADE_COLOURS[aggregate.semester_grade]}
                        />
                        <Stat label="Term Avg" value={`${aggregate.term_average}%`} colour="blue" />
                        <Stat label="GPA" value={String(aggregate.gpa)} colour="primary" />
                        <Stat label="Passed" value={String(aggregate.units_passed)} colour="green" />
                        <Stat
                            label="Failed"
                            value={String(aggregate.units_failed)}
                            colour={aggregate.units_failed > 0 ? 'red' : 'gray'}
                        />
                    </div>
                </div>
            )}
        </Modal>
    )
}

function Stat({ label, value, colour, gradeColour }: {
    label: string
    value: string
    colour: string
    gradeColour?: string
}) {
    const colours: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700',
        primary: 'bg-forest-50 text-forest-700',
        green: 'bg-green-50 text-green-700',
        red: 'bg-red-50 text-red-700',
        gray: 'bg-gray-100 text-gray-600',
    }
    const cls = gradeColour || colours[colour] || colours.gray
    return (
        <div className={clsx('rounded-lg px-3 py-2 text-center', cls)}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    )
}
