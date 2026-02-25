import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { router, useForm, usePage } from '@inertiajs/react';
import { Crown, Send, KeyRound, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function TransferSuperAdminOwnershipForm({
    status,
    superAdminTransferCodeTtlMinutes = 5,
    className = '',
}) {
    const roles = usePage().props?.auth?.roles || [];
    const isSuperAdmin = roles.includes('Super Admin');

    const [showConfirm, setShowConfirm] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);

    const { data, setData, processing, errors, reset, clearErrors } = useForm({
        new_superadmin_email: '',
        superadmin_transfer_code: '',
    });

    const cooldownSeconds = useMemo(() => {
        if (typeof status !== 'string' || !status.startsWith('superadmin-transfer-code-cooldown:')) {
            return null;
        }
        const value = Number.parseInt(status.split(':')[1] || '', 10);
        return Number.isFinite(value) ? value : null;
    }, [status]);

    const canSendCode = isSuperAdmin && data.new_superadmin_email.trim().length > 0;
    const canTransfer = isSuperAdmin && data.new_superadmin_email.trim().length > 0 && data.superadmin_transfer_code.trim().length === 6;

    const sendCode = () => {
        clearErrors();
        router.post(
            route('profile.superadmin-transfer-code.send'),
            { new_superadmin_email: data.new_superadmin_email },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsSendingCode(true),
                onFinish: () => setIsSendingCode(false),
            }
        );
    };

    const confirmTransfer = () => {
        clearErrors();
        router.post(
            route('profile.superadmin-transfer.confirm'),
            {
                new_superadmin_email: data.new_superadmin_email,
                superadmin_transfer_code: data.superadmin_transfer_code,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowConfirm(false);
                    reset();
                },
                onFinish: () => setShowConfirm(false),
            }
        );
    };

    if (!isSuperAdmin) return null;

    return (
        <section className={className}>
            <header>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                        <Crown className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Transfer Super Admin ownership</h2>
                        <p className="mt-0.5 text-sm text-gray-600">
                            Move Super Admin ownership to another existing user. A verification code is required.
                        </p>
                    </div>
                </div>
            </header>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                        <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-amber-900">
                        <p className="font-semibold">High impact action</p>
                        <p className="mt-1 text-amber-800">
                            After transfer, you will lose Super Admin access. The new owner will be asked to reset their password.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="new_superadmin_email" value="New Super Admin email" />
                    <TextInput
                        id="new_superadmin_email"
                        type="email"
                        className="mt-2 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        value={data.new_superadmin_email}
                        onChange={(e) => setData('new_superadmin_email', e.target.value)}
                        placeholder="Enter the user's email address"
                        autoComplete="email"
                        required
                    />
                    <InputError className="mt-2" message={errors.new_superadmin_email} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={sendCode}
                        disabled={!canSendCode || isSendingCode}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Send className="h-4 w-4" />
                        {isSendingCode ? 'Sending code…' : 'Send verification code'}
                    </button>
                    <span className="text-xs text-amber-700">Code expires in {superAdminTransferCodeTtlMinutes} minutes.</span>
                </div>

                <div>
                    <InputLabel htmlFor="superadmin_transfer_code" value="Verification code" />
                    <div className="relative">
                        <TextInput
                            id="superadmin_transfer_code"
                            type="text"
                            className="mt-2 block w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            value={data.superadmin_transfer_code}
                            onChange={(e) =>
                                setData('superadmin_transfer_code', e.target.value.replace(/[^\d]/g, '').slice(0, 6))
                            }
                            inputMode="numeric"
                            pattern="\d{6}"
                            placeholder="Enter 6-digit code"
                            autoComplete="one-time-code"
                            required
                        />
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    <InputError className="mt-2" message={errors.superadmin_transfer_code} />
                </div>

                {status === 'superadmin-transfer-code-sent' && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        Transfer verification code sent to your email address.
                    </div>
                )}
                {status === 'superadmin-transfer-code-send-failed' && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        Unable to send code right now. Please check mail settings and try again.
                    </div>
                )}
                {cooldownSeconds !== null && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Please wait {cooldownSeconds} seconds before requesting another code.
                    </div>
                )}
                {status === 'superadmin-ownership-transferred' && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        Ownership transferred successfully.
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-gray-500">
                        This action is audited and will notify relevant parties.
                    </div>
                    <PrimaryButton
                        type="button"
                        disabled={processing || !canTransfer}
                        onClick={() => setShowConfirm(true)}
                        className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold tracking-normal normal-case hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-600"
                    >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer ownership
                    </PrimaryButton>
                </div>
            </div>

            {showConfirm && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}
                >
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="border-b border-gray-200 px-6 py-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                    <Crown className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Confirm ownership transfer</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        You are about to transfer Super Admin ownership to:
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{data.new_superadmin_email || '—'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Once confirmed, you will lose Super Admin access. The new owner will receive a password reset email.
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmTransfer}
                                disabled={processing || !canTransfer}
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Confirm transfer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

