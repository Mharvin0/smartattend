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
        <div className="min-h-screen bg-brand-primary">
            <Head title="Log in" />
            
            <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
                <div className="mb-8 flex flex-col items-center">
                    <Link href="/">
                        <ApplicationLogo className="h-24 w-24" />
                    </Link>
                    <h1 className="mt-4 text-2xl font-bold text-brand-tertiary">SmartAttend</h1>
                    <p className="text-brand-tertiary/80">University of Pangasinan</p>
                </div>

                <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                    {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

                    <form onSubmit={submit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                            />
                            {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                            />
                            {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-brand-primary shadow-sm focus:ring-brand-primary"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                        </div>

                        <div className="mt-4 flex items-center justify-end">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                                >
                                    Forgot your password?
                                </Link>
                            )}

                            <button
                                disabled={processing}
                                className="ml-4 inline-flex items-center rounded-md border border-transparent bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                            >
                                Log in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}