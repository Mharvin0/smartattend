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
                <div className="relative hidden md:block bg-gradient-to-br from-brand-primary via-indigo-600 to-brand-tertiary">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.08),transparent_50%)]" />
                    <div className="relative flex h-full flex-col justify-between p-10 text-white">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3">
                                <ApplicationLogo className="h-10 w-10 drop-shadow" />
                                <span className="text-2xl font-semibold tracking-tight">SmartAttend</span>
                            </Link>
                        </div>

                        <div className="mx-auto max-w-md text-center">
                            <h2 className="text-3xl font-bold leading-tight md:text-4xl">Smarter attendance, simpler days</h2>
                            <p className="mt-3 text-white/85">University of Pangasinan</p>
                            <p className="mt-6 text-white/80">Automate tracking, monitor trends, and intervene early with clear insights.</p>
                        </div>

                        <div className="text-sm text-white/70">© {new Date().getFullYear()} SmartAttend</div>
                    </div>
                </div>

                {/* Right: Auth form */}
                <div className="flex items-center justify-center bg-gray-50 p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center gap-3 md:hidden">
                            <ApplicationLogo className="h-10 w-10" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">SmartAttend</h1>
                                <p className="text-sm text-gray-500">University of Pangasinan</p>
                            </div>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                {status}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                            <h2 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="mb-6 text-sm text-gray-500">Please sign in to continue</p>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:text-sm"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                    />
                                    {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-xs font-medium text-brand-primary hover:text-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:text-sm"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                    />
                                    {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-brand-primary shadow-sm focus:ring-brand-primary"
                                            checked={data.remember}
                                            onChange={e => setData('remember', e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-600">Remember me</span>
                                    </label>
                                </div>

                                <button
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60"
                                >
                                    Log in
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}