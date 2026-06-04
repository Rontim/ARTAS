import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'

export default function UsersPage() {
    return (
        <div>
            <PageHeader
                title="Users"
                subtitle="System users and their roles."
                action={
                    <Button variant="primary">
                        Add User
                    </Button>
                }
            />

            <div className="rounded-xl shadow-sm bg-white p-6">
                <p className="text-center text-gray-500">
                    User management will be displayed here. This feature allows administrators to manage system users and their access roles.
                </p>
            </div>
        </div>
    )
}
