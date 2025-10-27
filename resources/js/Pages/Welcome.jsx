import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth, canLogin }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary via-emerald-600 to-brand-primary flex flex-col">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-brand-secondary to-yellow-400 backdrop-blur-md border-b border-yellow-500">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <ApplicationLogo className="h-16 w-16" />
                            <span className="text-3xl font-bold text-brand-primary">SmartAttend</span>
                        </div>
                        {canLogin && (
                            <div className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('admin.admin-page')}
                                        className="inline-flex items-center rounded-lg bg-brand-primary px-6 py-3 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center rounded-lg bg-brand-primary px-6 py-3 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
            {/* Hero Section */}
                <section className="pt-20 pb-16 flex-1">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                            <div className="mb-8 flex justify-center">
                                <img 
                                    src="/images/university_banner.upang.png" 
                                    alt="PHINMA University of Pangasinan" 
                                    className="h-56 w-auto object-contain drop-shadow-2xl"
                                />
                            </div>
                            <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
                            SmartAttend
                        </h1>
                            <p className="mt-8 text-2xl text-emerald-100 max-w-4xl mx-auto">
                            A Secure Web Solution for Monitoring Student Attendance, Managing CSDL Interventions, and Tracking Attendance Improvement
                        </p>
                            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                            {canLogin && (
                                <>  
                                    {auth.user ? (
                                        <Link
                                            href={route('admin.admin-page')}
                                                className="inline-flex items-center justify-center rounded-xl bg-brand-secondary px-12 py-6 text-xl font-semibold text-black shadow-lg transition-all duration-200 hover:bg-brand-secondary/90 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                                        >
                                            Open Dashboard
                                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={route('login')}
                                                className="inline-flex items-center justify-center rounded-xl bg-brand-secondary px-12 py-6 text-xl font-semibold text-black shadow-lg transition-all duration-200 hover:bg-brand-secondary/90 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                                        >
                                            Get Started
                                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    )}
                                </>
                            )}
                            </div>
                    </div>
                </div>
            </section>

                {/* Footer */}
                <footer className="bg-gradient-to-r from-brand-primary to-emerald-700 py-12 mt-auto">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-4 mb-8">
                                <img 
                                    src="/images/university_banner.upang.png" 
                                    alt="PHINMA University of Pangasinan" 
                                    className="h-16 w-auto object-contain"
                                />
                                <span className="text-3xl font-bold text-white">SmartAttend</span>
                            </div>
                            <p className="text-lg text-emerald-100 mb-6">
                                University of Pangasinan • Attendance Management System
                            </p>
                            <p className="text-base text-emerald-200">
                                © {new Date().getFullYear()} SmartAttend. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
                </div>
        </div>
    );
}