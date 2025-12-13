import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Phone, Home, Archive, Calendar, User, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function ViewTracking({ tracking }) {
    const getTypeIcon = (type) => {
        return type === 'call' ? <Phone className="h-6 w-6" /> : <Home className="h-6 w-6" />;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'scheduled': return <Clock className="h-5 w-5 text-blue-600" />;
            case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
            case 'no_answer': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'no_answer': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleArchive = () => {
        if (confirm('Are you sure you want to archive this record?')) {
            router.post(route('csdl.reports.archive', tracking.id), {}, {
                onSuccess: () => {
                    router.visit(route('csdl.reports'));
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`View Tracking - ${tracking.student.name}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit(route('csdl.reports'))}
                            className="p-2 hover:bg-gray-100 rounded-md"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Tracking Record Details</h1>
                            <p className="text-gray-600">View and manage tracking record</p>
                        </div>
                    </div>
                    {!tracking.archived && !tracking.deleted_at && (
                        <button
                            onClick={handleArchive}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
                        >
                            <Archive className="h-4 w-4" />
                            Archive Record
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Type and Status Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        {getTypeIcon(tracking.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="text-lg font-medium text-gray-900 capitalize">
                                            {tracking.type.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(tracking.status)}
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracking.status)}`}>
                                            {tracking.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Date</p>
                                        <p className="text-lg font-medium text-gray-900">
                                            {new Date(tracking.date).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                                {tracking.time && (
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Time</p>
                                            <p className="text-lg font-medium text-gray-900">{tracking.time}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Student Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="text-lg font-medium text-gray-900">{tracking.student.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Student Number</p>
                                    <p className="text-lg font-medium text-gray-900">{tracking.student.student_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Section</p>
                                    <p className="text-lg font-medium text-gray-900">{tracking.student.section}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="text-lg font-medium text-gray-900">{tracking.student.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Tracked By */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracked By</h3>
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-lg font-medium text-gray-900">{tracking.tracked_by}</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes and Outcome */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                                    <div className="p-3 bg-gray-50 rounded-md">
                                        <p className="text-gray-900 whitespace-pre-wrap">
                                            {tracking.notes || 'No notes provided'}
                                        </p>
                                    </div>
                                </div>
                                {tracking.outcome && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Outcome</p>
                                        <div className="p-3 bg-gray-50 rounded-md">
                                            <p className="text-gray-900 whitespace-pre-wrap">{tracking.outcome}</p>
                                        </div>
                                    </div>
                                )}
                                {tracking.follow_up_required && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Follow-up Required</p>
                                        <div className="p-3 bg-yellow-50 rounded-md">
                                            <p className="text-gray-900 whitespace-pre-wrap">{tracking.follow_up_required}</p>
                                        </div>
                                    </div>
                                )}
                                {tracking.follow_up_date && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Follow-up Date</p>
                                        <p className="text-lg font-medium text-gray-900">
                                            {new Date(tracking.follow_up_date).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Metadata</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Created At</span>
                                    <span className="text-gray-900">{tracking.created_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Updated At</span>
                                    <span className="text-gray-900">{tracking.updated_at}</span>
                                </div>
                                {tracking.archived_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Archived At</span>
                                        <span className="text-gray-900">{tracking.archived_at}</span>
                                    </div>
                                )}
                                {tracking.deleted_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Deleted At</span>
                                        <span className="text-red-600">{tracking.deleted_at}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

