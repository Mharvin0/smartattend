import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Phone, Home, Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Download, ChevronDown } from 'lucide-react';

export default function CSDLPage({ studentsNeedingCalls = [], recentTracking = [], stats = {} }) {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [editingTracking, setEditingTracking] = useState(null);
    const [viewingTracking, setViewingTracking] = useState(null);
    const [showViewTrackingModal, setShowViewTrackingModal] = useState(false);
    const [trackingTab, setTrackingTab] = useState('recent'); // 'recent', 'archived'
    const [archivedTracking, setArchivedTracking] = useState([]);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const [trackingForm, setTrackingForm] = useState({
        type: 'home_visit',
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
            type: 'home_visit',
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
                    type: 'home_visit',
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


    useEffect(() => {
        if (trackingTab === 'archived') {
            fetchArchivedTracking();
        }
    }, [trackingTab]);



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
            case 'no_answer': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'to_follow': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleStatusUpdate = (studentId, trackingId, newStatus) => {
        if (trackingId) {
            // Update existing tracking record
            router.put(route('csdl.csdl-page.update-tracking', trackingId), {
                type: 'home_visit',
                date: new Date().toISOString().split('T')[0],
                time: '',
                notes: '',
                status: newStatus,
                outcome: '',
                follow_up_required: '',
                follow_up_date: '',
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['recentTracking', 'studentsNeedingCalls'] });
                },
            });
        } else {
            // Create new tracking record
            router.post(route('csdl.csdl-page.track-student'), {
                student_id: studentId,
                type: 'home_visit',
                date: new Date().toISOString().split('T')[0],
                time: '',
                notes: '',
                status: newStatus,
                outcome: '',
                follow_up_required: '',
                follow_up_date: '',
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['recentTracking', 'studentsNeedingCalls'] });
                },
            });
        }
    };

    const handleExportTracking = () => {
        // Only export if on recent tab, not archived or deleted
        if (trackingTab !== 'recent') {
            alert('Only recent tracking records can be exported. Please switch to the Recent tab.');
            return;
        }
        
        // Add print styles to the page
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page {
                    margin: 1cm 1.5cm;
                    size: A4 landscape;
                }
                body * {
                    visibility: hidden;
                }
                .print-section, .print-section * {
                    visibility: visible;
                }
                .print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .print-section .space-y-4 > div {
                    display: none;
                }
                .print-section .p-6 {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 0;
                }
                .print-section table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 16px;
                    margin: 0 auto;
                    table-layout: fixed;
                }
                .print-section th,
                .print-section td {
                    padding: 10px 12px;
                    border: 1px solid #000;
                    text-align: left;
                    word-wrap: break-word;
                    vertical-align: top;
                    line-height: 1.5;
                    font-size: 16px;
                }
                .print-section th {
                    background-color: #f3f4f6 !important;
                    font-weight: bold;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-size: 16px;
                    padding: 12px;
                    text-align: center;
                }
                .print-section thead {
                    display: table-header-group;
                }
                .print-section tbody tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create a hidden table for printing
        const printSection = document.querySelector('.print-section');
        if (printSection && recentTracking.length > 0) {
            const existingTable = printSection.querySelector('.print-table');
            if (existingTable) {
                existingTable.remove();
            }
            
            const table = document.createElement('table');
            table.className = 'print-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="width: 12%;">Student Name</th>
                        <th style="width: 10%;">Student Number</th>
                        <th style="width: 10%;">Section</th>
                        <th style="width: 6%;">Type</th>
                        <th style="width: 8%;">Date</th>
                        <th style="width: 7%;">Time</th>
                        <th style="width: 8%;">Status</th>
                        <th style="width: 10%;">Tracked By</th>
                        <th style="width: 29%;">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentTracking.map(tracking => `
                        <tr>
                            <td>${tracking.student?.name || 'N/A'}</td>
                            <td>${tracking.student?.student_number || 'N/A'}</td>
                            <td>${tracking.student?.section || 'N/A'}</td>
                            <td>${tracking.type === 'call' ? 'Call' : 'Home Visit'}</td>
                            <td>${tracking.date || 'N/A'}</td>
                            <td>${tracking.time || 'N/A'}</td>
                            <td>${(tracking.status || 'pending').charAt(0).toUpperCase() + (tracking.status || 'pending').slice(1).replace('_', ' ')}</td>
                            <td>${tracking.tracked_by || 'N/A'}</td>
                            <td>${tracking.notes || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            const p6Div = printSection.querySelector('.p-6');
            if (p6Div) {
                p6Div.appendChild(table);
            }
        }
        
        // Trigger print
        window.print();
        
        // Clean up after printing
        setTimeout(() => {
            const printTable = document.querySelector('.print-table');
            if (printTable) {
                printTable.remove();
            }
            document.head.removeChild(style);
        }, 1000);
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
                <div className="grid gap-4 md:grid-cols-3">
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
                        <h3 className="text-lg font-semibold text-gray-900">Students Needing Attention</h3>
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
                                {studentsNeedingCalls.length > 0 ? (
                                    studentsNeedingCalls.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.student_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            value="completed"
                                                            checked={student.tracking_status === 'completed'}
                                                            onChange={() => handleStatusUpdate(student.id, student.last_tracking?.id, 'completed')}
                                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Completed</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            value="no_answer"
                                                            checked={student.tracking_status === 'no_answer'}
                                                            onChange={() => handleStatusUpdate(student.id, student.last_tracking?.id, 'no_answer')}
                                                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">No answer</span>
                                                    </label>
                                                </div>
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
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tracking Records with Tabs */}
                <div className="bg-white rounded-lg shadow print-section">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Tracking Records</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportTracking}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                    title={`Export ${trackingTab} tracking records`}
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
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
                                {(trackingTab === 'recent' ? recentTracking : archivedTracking).length > 0 ? (
                                    (trackingTab === 'recent' ? recentTracking : archivedTracking).map((tracking) => (
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
                                                {tracking.status === 'completed' ? 'Completed' : tracking.status === 'no_answer' ? 'No answer' : tracking.status ? tracking.status.replace('_', ' ') : 'No Status'}
                                            </span>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {tracking.date} {tracking.time && `at ${tracking.time}`}
                                            </p>
                                            <p className="text-xs text-gray-400">by {tracking.tracked_by}</p>
                                            {trackingTab === 'archived' && tracking.archived_at && (
                                                <p className="text-xs text-gray-400 mt-1">Archived: {tracking.archived_at}</p>
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
                                        <input
                                            type="text"
                                            value="Home Visit"
                                            disabled
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <input type="hidden" name="type" value="home_visit" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                value={trackingForm.date}
                                                onChange={(e) => setTrackingForm({ ...trackingForm, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
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
                                                min={(() => {
                                                    if (trackingForm.date === new Date().toISOString().split('T')[0]) {
                                                        const now = new Date();
                                                        const hours = String(now.getHours()).padStart(2, '0');
                                                        const minutes = String(now.getMinutes()).padStart(2, '0');
                                                        return `${hours}:${minutes}`;
                                                    }
                                                    return undefined;
                                                })()}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="completed"
                                                    checked={trackingForm.status === 'completed'}
                                                    onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                    required
                                                />
                                                <span className="text-sm font-medium text-gray-700">Completed</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="no_answer"
                                                    checked={trackingForm.status === 'no_answer'}
                                                    onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                    required
                                                />
                                                <span className="text-sm font-medium text-gray-700">No answer</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date (optional)</label>
                                        <input
                                            type="date"
                                            value={trackingForm.follow_up_date}
                                            onChange={(e) => setTrackingForm({ ...trackingForm, follow_up_date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
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

