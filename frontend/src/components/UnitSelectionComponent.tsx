import { useQuery } from '@tanstack/react-query'
import { academicService } from '../services/academicService'
import type { SemesterUnit } from '../types'

interface UnitSelectionComponentProps {
    semesterId: string
    programmeId: string
    selectedUnitIds: string[]
    onChange: (unitIds: string[]) => void
}

export default function UnitSelectionComponent({
    semesterId,
    programmeId,
    selectedUnitIds,
    onChange,
}: UnitSelectionComponentProps) {
    const { data: semesterUnits = [], isLoading } = useQuery({
        queryKey: ['semester-units', semesterId, programmeId],
        queryFn: () => academicService.getSemesterUnits(semesterId, programmeId),
        enabled: !!semesterId && !!programmeId,
    })

    const toggleUnit = (unitId: string) => {
        if (selectedUnitIds.includes(unitId)) {
            onChange(selectedUnitIds.filter((id) => id !== unitId))
        } else {
            onChange([...selectedUnitIds, unitId])
        }
    }

    // Auto-select units that are mandatory or suggested? 
    // For now, let user select.

    if (isLoading) return <div className="text-sm text-gray-500 py-4">Loading units...</div>

    if (semesterUnits.length === 0) {
        return (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200 mt-4">
                No units are currently offered for this programme in the selected semester.
            </div>
        )
    }

    return (
        <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2 mb-3">
                Select Units for this Semester
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {semesterUnits.map((su: SemesterUnit) => (
                    <div key={su.id} className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id={`unit-${su.unit}`}
                                type="checkbox"
                                checked={selectedUnitIds.includes(su.unit)}
                                onChange={() => toggleUnit(su.unit)}
                                className="h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-600"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor={`unit-${su.unit}`} className="font-medium text-gray-900 cursor-pointer">
                                {su.unit_code} - {su.unit_name}
                            </label>
                            <p className="text-gray-500 text-xs">
                                {su.lecturer && `Lecturer: ${su.lecturer}`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">
                {selectedUnitIds.length} units selected
            </p>
        </div>
    )
}
