import type { BadgeVariant } from '../components/ui/badge'

export function gradeVariant(grade: string | null | undefined): BadgeVariant {
    if (!grade) return 'pending'
    switch (grade.toUpperCase()) {
        case 'A': return 'grade-A'
        case 'B': return 'grade-B'
        case 'C': return 'grade-C'
        case 'D': return 'grade-D'
        case 'E': return 'grade-E'
        default: return 'pending'
    }
}
