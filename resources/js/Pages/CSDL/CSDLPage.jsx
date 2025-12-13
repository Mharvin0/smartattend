import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Phone, Home, Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Download } from 'lucide-react';

export default function CSDLPage({ studentsNeedingCalls = [], recentTracking = [], stats = {} }) {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [editingTracking, setEditingTracking] = useState(null);
    const [viewingTracking, setViewingTracking] = useState(null);
    const [showViewTrackingModal, setShowViewTrackingModal] = useState(false);
    const [trackingTab, setTrackingTab] = useState('recent'); // 'recent', 'archived', 'deleted'
    const [archivedTracking, setArchivedTracking] = useState([]);
    const [deletedTracking, setDeletedTracking] = useState([]);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const [studentTab, setStudentTab] = useState('active'); // 'active', 'deleted'
    const [deletedStudents, setDeletedStudents] = useState([]);
    const [isLoadingDeletedStudents, setIsLoadingDeletedStudents] = useState(false);
    const [trackingForm, setTrackingForm] = useState({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        time: '',
        notes: '',
        status: 'completed',
        outcome: '',
        follow_up_required: '',
        follow_up_date: '',
    });

    const handleTrackStudent = (student) => {
        setSelectedStudent(student);
        setEditingTracking(null);
        setShowTrackingModal(true);
        setTrackingForm({
            type: 'call',
            date: new Date().toISOString().split('T')[0],
            time: '',
            notes: '',
            status: 'completed',
            outcome: '',
            follow_up_required: '',
            follow_up_date: '',
        });
    };

    const handleEditTracking = (tracking) => {
        setEditingTracking(tracking);
        setSelectedStudent({
            id: tracking.student.id,
            name: tracking.student.name,
        });
        setShowTrackingModal(true);
        setTrackingForm({
            type: tracking.type,
            date: tracking.date,
            time: tracking.time || '',
            notes: tracking.notes || '',
            status: tracking.status,
            outcome: tracking.outcome || '',
            follow_up_required: tracking.follow_up_required || '',
            follow_up_date: tracking.follow_up_date || '',
        });
    };

    const submitTracking = (e) => {
        e.preventDefault();
        const routeName = editingTracking 
            ? 'csdl.csdl-page.update-tracking'
            : 'csdl.csdl-page.track-student';
        const method = editingTracking ? 'put' : 'post';
        const url = editingTracking 
            ? route(routeName, editingTracking.id)
            : route(routeName);
        
        router[method](url, {
            ...(editingTracking ? {} : { student_id: selectedStudent.id }),
            ...trackingForm,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowTrackingModal(false);
                setSelectedStudent(null);
                setEditingTracking(null);
                setTrackingForm({
                    type: 'call',
                    date: new Date().toISOString().split('T')[0],
                    time: '',
                    notes: '',
                    status: 'completed',
                    outcome: '',
                    follow_up_required: '',
                    follow_up_date: '',
                });
                router.reload();
            },
        });
    };

    const fetchArchivedTracking = () => {
        setIsLoadingTracking(true);
        fetch(route('csdl.csdl-page.archived-tracking'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setArchivedTracking(data.tracking || []);
            }
        })
        .catch(error => {
            console.error('Error fetching archived tracking:', error);
        })
        .finally(() => {
            setIsLoadingTracking(false);
        });
    };

    const fetchDeletedTracking = () => {
        setIsLoadingTracking(true);
        fetch(route('csdl.csdl-page.deleted-tracking'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setDeletedTracking(data.tracking || []);
            }
        })
        .catch(error => {
            console.error('Error fetching deleted tracking:', error);
        })
        .finally(() => {
            setIsLoadingTracking(false);
        });
    };

    useEffect(() => {
        if (trackingTab === 'archived') {
            fetchArchivedTracking();
        } else if (trackingTab === 'deleted') {
            fetchDeletedTracking();
        }
    }, [trackingTab]);

    const fetchDeletedStudents = () => {
        setIsLoadingDeletedStudents(true);
        fetch(route('csdl.csdl-page.deleted-students'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setDeletedStudents(data.students || []);
            }
        })
        .catch(error => {
            console.error('Error fetching deleted students:', error);
            setDeletedStudents([]);
        })
        .finally(() => {
            setIsLoadingDeletedStudents(false);
        });
    };

    useEffect(() => {
        if (studentTab === 'deleted') {
            fetchDeletedStudents();
        }
    }, [studentTab]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'PNS': return 'bg-red-100 text-red-800';
            case 'Call Needed': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getTypeIcon = (type) => {
        return type === 'call' ? <Phone className="h-4 w-4" /> : <Home className="h-4 w-4" />;
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

    return (
        <AuthenticatedLayout>
            <Head title="CSDL Student Tracking" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Tracking</h1>
                        <p className="text-gray-600">
                            Track calls and home visits for students in need
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Need Calls</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.students_needing_calls || 0}</p>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Phone className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Need Visits</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.students_needing_visits || 0}</p>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Home className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tracked Today</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total_tracked_today || 0}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">This Week</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total_tracked_this_week || 0}</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Needing Attention */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Students Needing Attention</h3>
                            <div className="flex space-x-1 border-b border-gray-200">
                                <button
                                    onClick={() => setStudentTab('active')}
                                    className={`px-4 py-2 text-sm font-medium ${
                                        studentTab === 'active'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStudentTab('deleted')}
                                    className={`px-4 py-2 text-sm font-medium ${
                                        studentTab === 'deleted'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Deleted
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absences</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Tracking</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {studentTab === 'active' ? (
                                    studentsNeedingCalls.length > 0 ? (
                                        studentsNeedingCalls.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.student_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    student.tracking_status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    student.tracking_status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                                    student.tracking_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    student.tracking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {student.tracking_status || 'No Status'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(student.priority)}`}>
                                                    {student.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.absence_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.guardian_contact || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.last_tracking ? (
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            {getTypeIcon(student.last_tracking.type)}
                                                            <span className="capitalize">{student.last_tracking.type.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="text-xs">{student.last_tracking.date}</div>
                                                    </div>
                                                ) : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleTrackStudent(student)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Track
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to archive this student from the attention list?')) {
                                                                router.post(route('csdl.csdl-page.archive-student-from-attention', student.id), {}, {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        router.reload({ only: ['studentsNeedingCalls'] });
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to archive student');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="relative group p-1.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors"
                                                        title="Archive"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                        <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            Archive
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                                router.delete(route('csdl.csdl-page.delete-student', student.id), {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        router.reload({ only: ['studentsNeedingCalls'] });
                                                                        if (studentTab === 'deleted') {
                                                                            fetchDeletedStudents();
                                                                        }
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to delete student');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="relative group p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            Delete
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No students need attention at this time
                                        </td>
                                    </tr>
                                )
                            ) : (
                                isLoadingDeletedStudents ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                            <p className="mt-2">Loading...</p>
                                        </td>
                                    </tr>
                                ) : deletedStudents.length > 0 ? (
                                    deletedStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.student_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    student.tracking_status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    student.tracking_status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                                    student.tracking_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    student.tracking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {student.tracking_status || 'No Status'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(student.priority)}`}>
                                                    {student.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.absence_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.guardian_contact || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.deleted_at ? (
                                                    <div className="text-xs text-gray-400">Deleted: {student.deleted_at}</div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to restore this student?')) {
                                                            router.post(route('csdl.csdl-page.restore-student', student.id), {}, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    fetchDeletedStudents();
                                                                    router.reload({ only: ['studentsNeedingCalls'] });
                                                                },
                                                                onError: () => {
                                                                    alert('Failed to restore student');
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No deleted students
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tracking Records with Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Tracking Records</h3>
                            <div className="flex items-center gap-3">
                                <a
                                    href={route('csdl.csdl-page.export-tracking', { tab: trackingTab })}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                    title={`Export ${trackingTab} tracking records`}
                                    download
                                >
                                    <Download className="h-4 w-4" />
                                    Export {trackingTab === 'recent' ? 'Recent' : trackingTab === 'archived' ? 'Archived' : 'Deleted'}
                                </a>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setTrackingTab('recent')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        trackingTab === 'recent'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Recent
                                </button>
                                <button
                                    onClick={() => setTrackingTab('archived')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        trackingTab === 'archived'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Archived
                                </button>
                                <button
                                    onClick={() => setTrackingTab('deleted')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        trackingTab === 'deleted'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Deleted
                                </button>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {isLoadingTracking ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                <p className="mt-2">Loading...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(trackingTab === 'recent' ? recentTracking : 
                                  trackingTab === 'archived' ? archivedTracking : 
                                  deletedTracking).length > 0 ? (
                                    (trackingTab === 'recent' ? recentTracking : 
                                     trackingTab === 'archived' ? archivedTracking : 
                                     deletedTracking).map((tracking) => (
                                    <div key={tracking.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${tracking.type === 'call' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                {getTypeIcon(tracking.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tracking.student.name}</p>
                                                <p className="text-sm text-gray-500">{tracking.student.section}</p>
                                                {tracking.notes && (
                                                    <p className="text-sm text-gray-600 mt-1">{tracking.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tracking.status)}`}>
                                                {tracking.status}
                                            </span>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {tracking.date} {tracking.time && `at ${tracking.time}`}
                                            </p>
                                            <p className="text-xs text-gray-400">by {tracking.tracked_by}</p>
                                            {trackingTab === 'archived' && tracking.archived_at && (
                                                <p className="text-xs text-gray-400 mt-1">Archived: {tracking.archived_at}</p>
                                            )}
                                            {trackingTab === 'deleted' && tracking.deleted_at && (
                                                <p className="text-xs text-gray-400 mt-1">Deleted: {tracking.deleted_at}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                {trackingTab === 'recent' && (
                                                    <button
                                                        onClick={() => {
                                                            fetch(route('csdl.csdl-page.view-tracking', tracking.id), {
                                                                method: 'GET',
                                                                headers: {
                                                                    'Accept': 'application/json',
                                                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                                                },
                                                            })
                                                            .then(response => response.json())
                                                            .then(data => {
                                                                if (data.success) {
                                                                    setViewingTracking({...data.tracking, id: tracking.id, can_edit: tracking.can_edit});
                                                                    setShowViewTrackingModal(true);
                                                                }
                                                            })
                                                            .catch(error => {
                                                                console.error('Error fetching tracking:', error);
                                                                alert('Failed to load tracking details');
                                                            });
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                                {trackingTab === 'archived' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to unarchive this tracking record?')) {
                                                                router.post(route('csdl.csdl-page.unarchive-tracking', tracking.id), {}, {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        fetchArchivedTracking();
                                                                        router.reload({ only: ['recentTracking'] });
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to unarchive tracking record');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                                                        title="Unarchive"
                                                    >
                                                        Unarchive
                                                    </button>
                                                )}
                                                {trackingTab === 'deleted' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to restore this tracking record?')) {
                                                                router.post(route('csdl.csdl-page.restore-tracking', tracking.id), {}, {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        fetchDeletedTracking();
                                                                        router.reload({ only: ['recentTracking'] });
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to restore tracking record');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                                                        title="Restore"
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>
                                            {trackingTab === 'recent' && 'No tracking records yet'}
                                            {trackingTab === 'archived' && 'No archived tracking records'}
                                            {trackingTab === 'deleted' && 'No deleted tracking records'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tracking Modal */}
            {showTrackingModal && selectedStudent && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8 mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-semibold text-gray-900">{editingTracking ? 'Edit Tracking' : 'Track Student'}: {selectedStudent.name || selectedStudent.id}</h3>
                            <div className="flex items-center gap-3">
                                {editingTracking && editingTracking.can_edit ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to archive this tracking record?')) {
                                                    router.post(route('csdl.csdl-page.archive-tracking', editingTracking.id), {}, {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowTrackingModal(false);
                                                            setSelectedStudent(null);
                                                            setEditingTracking(null);
                                                            router.reload();
                                                        },
                                                        onError: () => {
                                                            alert('Failed to archive tracking record');
                                                        }
                                                    });
                                                }
                                            }}
                                            className="relative group p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors"
                                            title="Archive"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                            <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Archive
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this tracking record? This action cannot be undone.')) {
                                                    router.delete(route('csdl.csdl-page.delete-tracking', editingTracking.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowTrackingModal(false);
                                                            setSelectedStudent(null);
                                                            setEditingTracking(null);
                                                            router.reload();
                                                        },
                                                        onError: () => {
                                                            alert('Failed to delete tracking record');
                                                        }
                                                    });
                                                }
                                            }}
                                            className="relative group p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Delete
                                            </span>
                                        </button>
                                    </>
                                ) : null}
                                <button
                                    onClick={() => {
                                        setShowTrackingModal(false);
                                        setSelectedStudent(null);
                                        setEditingTracking(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={submitTracking} className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column - Basic Information */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select
                                            value={trackingForm.type}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, type: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="call">Call</option>
                                            <option value="home_visit">Home Visit</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                value={trackingForm.date}
                                                onChange={(e) => setTrackingForm({ ...trackingForm, date: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
                                            <input
                                                type="time"
                                                value={trackingForm.time}
                                                onChange={(e) => setTrackingForm({ ...trackingForm, time: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={trackingForm.status}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="completed">Completed</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="no_answer">No Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date (optional)</label>
                                        <input
                                            type="date"
                                            value={trackingForm.follow_up_date}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, follow_up_date: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Right Column - Notes and Additional Information */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <textarea
                                            value={trackingForm.notes}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="4"
                                            placeholder="Enter notes about this tracking record..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Outcome (optional)</label>
                                        <textarea
                                            value={trackingForm.outcome}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, outcome: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="3"
                                            placeholder="Enter the outcome of this interaction..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Required (optional)</label>
                                        <textarea
                                            value={trackingForm.follow_up_required}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, follow_up_required: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="3"
                                            placeholder="Enter any follow-up actions required..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTrackingModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {editingTracking ? 'Update Tracking' : 'Save Tracking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Tracking Modal */}
            {showViewTrackingModal && viewingTracking && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8 mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-semibold text-gray-900">Tracking Record Details</h3>
                            <div className="flex items-center gap-3">
                                {viewingTracking.can_edit && (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to archive this tracking record?')) {
                                                    router.post(route('csdl.csdl-page.archive-tracking', viewingTracking.id), {}, {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowViewTrackingModal(false);
                                                            setViewingTracking(null);
                                                            router.reload();
                                                        },
                                                        onError: () => {
                                                            alert('Failed to archive tracking record');
                                                        }
                                                    });
                                                }
                                            }}
                                            className="relative group p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors"
                                            title="Archive"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                            <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Archive
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this tracking record? This action cannot be undone.')) {
                                                    router.delete(route('csdl.csdl-page.delete-tracking', viewingTracking.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowViewTrackingModal(false);
                                                            setViewingTracking(null);
                                                            router.reload();
                                                        },
                                                        onError: () => {
                                                            alert('Failed to delete tracking record');
                                                        }
                                                    });
                                                }
                                            }}
                                            className="relative group p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Delete
                                            </span>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setShowViewTrackingModal(false);
                                        setViewingTracking(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column - Student Information */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-base">Student Information</h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-600 mb-1">Name</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.student.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Student Number</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.student.student_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Section</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.student.section}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Department</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.student.department}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Program</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.student.program}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking Details */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-base">Tracking Details</h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-600 mb-1">Type</p>
                                                <p className="font-medium text-gray-900 capitalize">{viewingTracking.type.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Status</p>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingTracking.status)}`}>
                                                    {viewingTracking.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Date</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.date}</p>
                                            </div>
                                            {viewingTracking.time && (
                                                <div>
                                                    <p className="text-gray-600 mb-1">Time</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.time}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-600 mb-1">Tracked By</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.tracked_by}</p>
                                            </div>
                                            {viewingTracking.follow_up_date && (
                                                <div>
                                                    <p className="text-gray-600 mb-1">Follow-up Date</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.follow_up_date}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timestamps */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-base">Record Information</h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-600 mb-1">Created</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.created_at}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 mb-1">Last Updated</p>
                                                <p className="font-medium text-gray-900">{viewingTracking.updated_at}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Notes and Additional Information */}
                                <div className="space-y-5">
                                    {viewingTracking.notes && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 text-base">Notes</h4>
                                            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px]">{viewingTracking.notes}</p>
                                        </div>
                                    )}
                                    {viewingTracking.outcome && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 text-base">Outcome</h4>
                                            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px]">{viewingTracking.outcome}</p>
                                        </div>
                                    )}
                                    {viewingTracking.follow_up_required && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 text-base">Follow-up Required</h4>
                                            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px]">{viewingTracking.follow_up_required}</p>
                                        </div>
                                    )}
                                    {!viewingTracking.notes && !viewingTracking.outcome && !viewingTracking.follow_up_required && (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <p className="text-sm">No additional notes or information</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-gray-200 flex justify-end gap-3">
                                {viewingTracking.can_edit && (
                                    <button
                                        onClick={() => {
                                            handleEditTracking(viewingTracking);
                                            setShowViewTrackingModal(false);
                                        }}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowViewTrackingModal(false);
                                        setViewingTracking(null);
                                    }}
                                    className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

