import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth, canLogin }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {canLogin && (
                <div className="fixed right-0 top-0 p-6 text-right">
                    {auth.user ? (
                        <Link
                            href={route('admin.dashboard')}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            )}

            <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
                <div className="mb-8">
                    <ApplicationLogo className="mx-auto h-16 w-16" />
                </div>
                <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                    SmartAttend
                </h1>
                <p className="text-base text-gray-600 sm:text-lg">
                    University of Pangasinan • Attendance Management System
                </p>

                {canLogin && (
                    <div className="mt-10">
                        {auth.user ? (
                            <Link
                                href={route('admin.dashboard')}
                                className="inline-flex items-center justify-center rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                            >
                                Open Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center justify-center rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                )}

                <p className="mt-14 text-xs text-gray-400">© {new Date().getFullYear()} SmartAttend</p>
            </main>
        </div>
    );
}