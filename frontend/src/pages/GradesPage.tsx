import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gradeService } from '../services/gradeService'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'

type BadgeVariant = 'grade-A' | 'grade-B' | 'grade-C' | 'grade-D' | 'grade-E' | 'pending'

function gradeVariant(grade: string | null | undefined): BadgeVariant {
    if (!grade) return 'pending'
    const g = grade.toUpperCase()
    if (g === 'A') return 'grade-A'
    if (g === 'B') return 'grade-B'
    if (g === 'C') return 'grade-C'
    if (g === 'D') return 'grade-D'
    return 'grade-E'
}

export default function GradesPage() {
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['results', page],
        queryFn: () => gradeService.getResults({ page }),
    })

    const results = data?.results || []
    const totalPages = data?.total_pages || 1

    return (
        <div>
            <PageHeader
                title="Grades"
                subtitle="Student marks and grades management."
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary">Bulk Upload</Button>
                        <Button variant="primary">Add Result</Button>
                    </div>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : (
                <Table>
                    <THead>
                        <Tr hoverable={false}>
                            <Th>Reg No</Th>
                            <Th>Student</Th>
                            <Th>Unit</Th>
                            <Th>Period</Th>
                            <Th>Marks</Th>
                            <Th>Grade</Th>
                            <Th>Status</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {results.length === 0 ? (
                            <Tr hoverable={false}>
                                <Td colSpan={7} className="py-0 px-0">
                                    <EmptyState title="No results found" description="No grade records have been entered yet." />
                                </Td>
                            </Tr>
                        ) : (
                            results.map((result) => (
                                <Tr key={result.id}>
                                    <Td className="font-medium">{result.student_reg_no}</Td>
                                    <Td className="text-gray-500">{result.student_name}</Td>
                                    <Td className="text-gray-500">{result.unit_code}</Td>
                                    <Td className="text-gray-500">{result.semester_name || result.module_name || '-'}</Td>
                                    <Td className="text-gray-500">{result.marks}</Td>
                                    <Td>
                                        {result.grade ? (
                                            <Badge variant={gradeVariant(result.grade)}>{result.grade}</Badge>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </Td>
                                    <Td>
                                        <Badge variant={result.status === 'pass' ? 'pass' : 'fail'}>
                                            {result.status}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </TBody>
                </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
