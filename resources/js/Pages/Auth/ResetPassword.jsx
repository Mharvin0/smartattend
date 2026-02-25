import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password" />

            <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-lime-50/60 to-yellow-50/50">
                <div className="pointer-events-none absolute inset-0 opacity-70">
                    <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-2xl" />
                    <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-yellow-200/25 blur-2xl" />
                </div>

                <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6">
                    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        <div className="hidden lg:flex lg:flex-col lg:justify-center">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                                    <ApplicationLogo className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">SmartAttend</p>
                                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reset your password</h1>
                                </div>
                            </div>
                            <p className="mt-4 max-w-md text-sm text-gray-600">
                                Choose a strong new password. This reset does not require your current password.
                            </p>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur">
                                <div className="border-b border-gray-100 px-6 py-6">
                                    <div className="flex items-center justify-between">
                                        <Link href="/" className="inline-flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                                                <LockKeyhole className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Reset Password</p>
                                                <p className="text-xs text-gray-500">Set a new password for your account</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                <form onSubmit={submit} className="space-y-5 px-6 py-6">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <div className="relative mt-2">
                                            <TextInput
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-700 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Email address"
                                                autoComplete="username"
                                                readOnly
                                                aria-readonly="true"
                                            />
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="New password" />
                                        <div className="relative mt-2">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={data.password}
                                                className="block w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-12 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Create a new password"
                                                autoComplete="new-password"
                                                autoFocus
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                            />
                                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="mt-2" />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Tip: use at least 10 characters with a mix of letters and numbers.
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirm new password" />
                                        <div className="relative mt-2">
                                            <input
                                                type={showPasswordConfirmation ? 'text' : 'password'}
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                value={data.password_confirmation}
                                                className="block w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-12 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Re-enter your new password"
                                                autoComplete="new-password"
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                required
                                            />
                                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
                                                aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                                            >
                                                {showPasswordConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>

                                    <div className="pt-2">
                                        <PrimaryButton
                                            className="w-full justify-center rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-5 py-3 text-sm font-bold tracking-normal normal-case hover:from-brand-primary/90 hover:to-emerald-600/90 focus:ring-brand-primary"
                                            disabled={processing}
                                        >
                                            {processing ? 'Resetting…' : 'Reset password'}
                                        </PrimaryButton>
                                    </div>

                                    <div className="pt-1 text-center text-xs text-gray-500">
                                        Need a new link?{' '}
                                        <Link href={route('password.request')} className="font-semibold text-brand-primary hover:text-brand-primary/90">
                                            Request password reset
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
