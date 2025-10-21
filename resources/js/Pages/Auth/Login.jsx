import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen">
            <Head title="Log in" />
            <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
                {/* Left: Hero / Branding */}
                <div className="relative hidden md:block bg-gradient-to-br from-brand-primary via-emerald-600 to-brand-primary">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.08),transparent_50%)]" />
                    <div className="relative flex h-full flex-col justify-center items-center p-10 text-white">
                        {/* Center Logo */}
                        <div className="mb-12 text-center">
                            <ApplicationLogo className="mx-auto h-96 w-96 drop-shadow-2xl mb-8" />
                            <h1 className="text-8xl font-bold tracking-tight mb-6">SmartAttend</h1>
                            <p className="text-5xl text-emerald-100 font-medium">PHINMA University of Pangasinan</p>
                        </div>

                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-white/70">© {new Date().getFullYear()} SmartAttend</div>
                    </div>
                </div>

                {/* Right: Auth form */}
                <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
                    <div className="w-full max-w-lg">
                        <div className="mb-10 flex items-center justify-center gap-8 md:hidden">
                            <ApplicationLogo className="h-64 w-64" />
                            <div className="text-center">
                                <h1 className="text-6xl font-bold text-gray-900">SmartAttend</h1>
                                <p className="text-3xl text-gray-600">University of Pangasinan</p>
                            </div>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-base font-medium text-green-700 shadow-sm">
                                {status}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 shadow-xl md:p-12">
                            <div className="text-center mb-8">
                                <h2 className="mb-3 text-4xl font-bold text-gray-900">Welcome!</h2>
                                <p className="text-lg text-gray-600">Please sign in to continue to your dashboard</p>
                            </div>

                            <form onSubmit={submit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="block text-lg font-semibold text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        className="mt-2 block w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-lg"
                                        placeholder="Enter your email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                    />
                                    {errors.email && <div className="mt-2 text-base text-red-600 font-medium">{errors.email}</div>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-lg font-semibold text-gray-700">Password</label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-base font-semibold text-brand-primary hover:text-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        className="mt-2 block w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-lg"
                                        placeholder="Enter your password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                    />
                                    {errors.password && <div className="mt-2 text-base text-red-600 font-medium">{errors.password}</div>}
                                </div>


                                <button
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-8 py-5 text-xl font-bold text-white shadow-lg transition-all duration-200 hover:from-brand-primary/90 hover:to-emerald-600/90 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Signing in...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span>Sign In</span>
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}