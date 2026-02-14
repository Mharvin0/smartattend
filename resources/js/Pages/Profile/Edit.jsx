import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { User, Mail, ShieldCheck, ShieldAlert } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, emailChangeCodeTtlMinutes }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = auth?.roles || [];
    const isSuperAdmin = roles.includes('Super Admin');

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-10 sm:py-12">
                <div className="mx-auto w-full space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Profile overview card */}
                    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                        <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary/10 via-emerald-50 to-brand-secondary/10 p-6 sm:p-8">
                            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
                            <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-yellow-200/30 blur-2xl" />

                            <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-primary to-emerald-600 text-white shadow-inner">
                                    <User className="h-10 w-10" strokeWidth={2} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">My Account</p>
                                    <h3 className="text-2xl font-semibold text-gray-900">{user?.name}</h3>
                                    <p className="mt-0.5 flex items-center justify-center gap-1.5 text-gray-600 sm:justify-start">
                                        <Mail className="h-4 w-4 flex-shrink-0" />
                                        {user?.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                        {roles.map((role) => (
                                            <span
                                                key={role}
                                                className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-medium text-brand-primary"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                        {mustVerifyEmail && user?.email_verified_at ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Email verified
                                            </span>
                                        ) : mustVerifyEmail && !user?.email_verified_at ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Unverified email
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                emailChangeCodeTtlMinutes={emailChangeCodeTtlMinutes}
                                className="max-w-none"
                            />
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                            <UpdatePasswordForm className="max-w-none" />
                        </div>
                    </div>

                    {!isSuperAdmin && (
                        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:p-7">
                            <DeleteUserForm className="max-w-none" />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
