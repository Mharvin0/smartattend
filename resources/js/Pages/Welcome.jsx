import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth, canLogin }) {
    return (
        <div className="min-h-screen bg-brand-primary">
            {canLogin && (
                <div className="fixed right-0 top-0 p-6 text-right">
                    {auth.user ? (
                        <Link
                            href={route('admin.dashboard')}
                            className="font-semibold text-brand-tertiary hover:text-brand-secondary focus:outline focus:outline-2 focus:rounded-sm focus:outline-brand-secondary"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="font-semibold text-brand-tertiary hover:text-brand-secondary focus:outline focus:outline-2 focus:rounded-sm focus:outline-brand-secondary"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            )}

            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <ApplicationLogo className="mx-auto mb-8 h-48 w-48" />
                    <h1 className="mb-4 text-4xl font-bold text-brand-tertiary">SmartAttend</h1>
                    <p className="text-xl text-brand-tertiary/80">University of Pangasinan</p>
                    <p className="mt-2 text-brand-tertiary/60">Attendance Management System</p>
                </div>
            </div>
        </div>
    );
}