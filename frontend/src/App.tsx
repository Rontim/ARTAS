import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import ProgrammesPage from './pages/ProgrammesPage'
import ProgrammeDetailPage from './pages/ProgrammeDetailPage'
import UnitsPage from './pages/UnitsPage'
import SemestersPage from './pages/SemestersPage'
import GradesPage from './pages/GradesPage'
import TranscriptsPage from './pages/TranscriptsPage'
import UsersPage from './pages/UsersPage'
import SemesterOfferingsPage from './pages/SemesterOfferingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="students/:id" element={<StudentDetailPage />} />
                <Route path="programmes" element={<ProgrammesPage />} />
                <Route path="programmes/:id" element={<ProgrammeDetailPage />} />
                <Route path="units" element={<UnitsPage />} />
                <Route path="semesters" element={<SemestersPage />} />
                <Route path="semester-offerings" element={<SemesterOfferingsPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="transcripts" element={<TranscriptsPage />} />
                <Route path="users" element={<UsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default App
