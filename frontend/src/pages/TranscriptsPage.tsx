import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { transcriptService } from '../services/transcriptService'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/table'
import { EmptyState } from '../components/ui/empty-state'

type TranscriptBadgeVariant = 'active' | 'inactive' | 'pending'

function statusVariant(status: string): TranscriptBadgeVariant {
    if (status === 'issued') return 'active'
    if (status === 'revoked') return 'inactive'
    return 'pending'
}

export default function TranscriptsPage() {
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['transcripts', page],
        queryFn: () => transcriptService.getTranscripts({ page }),
    })

    const transcripts = data?.results || []
    const totalPages = data?.total_pages || 1

    const handleDownload = async (id: string, transcriptId: string) => {
        try {
            const blob = await transcriptService.downloadTranscript(id)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${transcriptId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    return (
        <div>
            <PageHeader
                title="Transcripts"
                subtitle="Generated academic transcripts."
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary">Batch Generate</Button>
                        <Button variant="primary">Generate Transcript</Button>
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
                            <Th>Transcript ID</Th>
                            <Th>Student</Th>
                            <Th>Type</Th>
                            <Th>Generated</Th>
                            <Th>Status</Th>
                            <Th><span className="sr-only">Actions</span></Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {transcripts.length === 0 ? (
                            <Tr hoverable={false}>
                                <Td colSpan={6} className="py-0 px-0">
                                    <EmptyState title="No transcripts generated yet" description="Generate a transcript for a student to see it here." />
                                </Td>
                            </Tr>
                        ) : (
                            transcripts.map((transcript) => (
                                <Tr key={transcript.id}>
                                    <Td className="font-medium">{transcript.transcript_id}</Td>
                                    <Td className="text-gray-500">
                                        {transcript.student_reg_no} - {transcript.student_name}
                                    </Td>
                                    <Td className="text-gray-500 capitalize">{transcript.transcript_type}</Td>
                                    <Td className="text-gray-500">
                                        {transcript.generated_at ? new Date(transcript.generated_at).toLocaleDateString() : '-'}
                                    </Td>
                                    <Td>
                                        <Badge variant={statusVariant(transcript.status)}>
                                            {transcript.status}
                                        </Badge>
                                    </Td>
                                    <Td className="text-right">
                                        {transcript.pdf_file && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(transcript.id, transcript.transcript_id)}
                                                title="Download PDF"
                                            >
                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                            </Button>
                                        )}
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
