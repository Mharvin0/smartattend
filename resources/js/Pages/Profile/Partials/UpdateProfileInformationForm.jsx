import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { User, Check, MailCheck, Send, KeyRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    emailChangeCodeTtlMinutes = 10,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [isSendingCode, setIsSendingCode] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            email_change_code: '',
        });

    const normalizedCurrentEmail = useMemo(
        () => (user.email || '').trim().toLowerCase(),
        [user.email]
    );
    const normalizedFormEmail = useMemo(
        () => (data.email || '').trim().toLowerCase(),
        [data.email]
    );
    const emailCodeCooldownSeconds = useMemo(() => {
        if (typeof status !== 'string' || !status.startsWith('email-change-code-cooldown:')) {
            return null;
        }
        const value = Number.parseInt(status.split(':')[1] || '', 10);
        return Number.isFinite(value) ? value : null;
    }, [status]);
    const isChangingEmail = normalizedFormEmail !== normalizedCurrentEmail;
    const hasEnteredCode = data.email_change_code.trim().length > 0;

    useEffect(() => {
        if (!isChangingEmail && data.email_change_code !== '') {
            setData('email_change_code', '');
        }
    }, [isChangingEmail, data.email_change_code, setData]);

    const sendEmailChangeCode = () => {
        router.post(
            route('profile.email-change-code.send'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsSendingCode(true),
                onFinish: () => setIsSendingCode(false),
            }
        );
    };

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">
                            Profile Information
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-600">
                            Update your account's profile information and email address.
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div
                    className={`space-y-4 rounded-xl border p-4 transition ${
                        isChangingEmail
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${
                                isChangingEmail ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                            <MailCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-semibold ${isChangingEmail ? 'text-amber-900' : 'text-gray-700'}`}>
                                Email change verification code
                            </h3>
                            <p className={`mt-1 text-sm ${isChangingEmail ? 'text-amber-800' : 'text-gray-600'}`}>
                                {isChangingEmail
                                    ? 'For account security, we will send a 6-digit code to your current email. Enter that code below before saving your new email.'
                                    : 'Change your email first, then request and enter the verification code.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={sendEmailChangeCode}
                            disabled={!isChangingEmail || isSendingCode}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {isSendingCode ? 'Sending code...' : 'Send verification code'}
                        </button>
                        <span className={`text-xs ${isChangingEmail ? 'text-amber-700' : 'text-gray-500'}`}>
                            Code expires in {emailChangeCodeTtlMinutes} minutes.
                        </span>
                    </div>

                    <div>
                        <InputLabel htmlFor="email_change_code" value="Verification Code" />
                        <div className="relative">
                            <TextInput
                                id="email_change_code"
                                type="text"
                                className={`mt-2 block w-full rounded-xl border-2 py-3 pl-10 pr-4 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 ${
                                    isChangingEmail ? 'border-amber-200' : 'border-gray-200 bg-gray-100'
                                }`}
                                value={data.email_change_code}
                                onChange={(e) =>
                                    setData('email_change_code', e.target.value.replace(/[^\d]/g, '').slice(0, 6))
                                }
                                inputMode="numeric"
                                pattern="\d{6}"
                                placeholder="Enter 6-digit code"
                                autoComplete="one-time-code"
                                disabled={!isChangingEmail}
                                required={isChangingEmail}
                            />
                            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                        <InputError className="mt-2" message={errors.email_change_code} />
                    </div>
                </div>

                {status === 'email-change-code-sent' && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        Verification code sent to your current email address.
                    </div>
                )}
                {status === 'email-change-code-send-failed' && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        Unable to send code right now. Please check mail settings and try again.
                    </div>
                )}
                {emailCodeCooldownSeconds !== null && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Please wait {emailCodeCooldownSeconds} seconds before requesting another code.
                    </div>
                )}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-brand-primary underline hover:text-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton
                        disabled={processing || (isChangingEmail && !hasEnteredCode)}
                        className="rounded-xl bg-gradient-to-r from-brand-primary to-emerald-600 px-5 py-2.5 text-sm font-bold tracking-normal normal-case hover:from-brand-primary/90 hover:to-emerald-600/90 focus:ring-brand-primary"
                    >
                        Save profile
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-in-out duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                            <Check className="h-4 w-4" />
                            Saved
                        </span>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
