import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { transcriptService } from '../services/transcriptService'

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    generated: 'bg-blue-100 text-blue-800',
    issued: 'bg-green-100 text-green-800',
    revoked: 'bg-red-100 text-red-800',
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
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Transcripts</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Generated academic transcripts.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-2">
                    <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Batch Generate
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-forest-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-500"
                    >
                        <PlusIcon className="inline h-5 w-5 mr-1" />
                        Generate Transcript
                    </button>
                </div>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64 bg-white">
                                    <div className="text-gray-500">Loading...</div>
                                </div>
                            ) : transcripts.length === 0 ? (
                                <div className="flex items-center justify-center h-64 bg-white">
                                    <div className="text-gray-500">No transcripts generated yet</div>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Transcript ID</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Generated</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {transcripts.map((transcript) => (
                                            <tr key={transcript.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                    {transcript.transcript_id}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {transcript.student_reg_no} - {transcript.student_name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                                                    {transcript.transcript_type}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {transcript.generated_at ? new Date(transcript.generated_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[transcript.status]}`}>
                                                        {transcript.status}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {transcript.pdf_file && (
                                                        <button
                                                            onClick={() => handleDownload(transcript.id, transcript.transcript_id)}
                                                            className="text-forest-600 hover:text-forest-900"
                                                        >
                                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
