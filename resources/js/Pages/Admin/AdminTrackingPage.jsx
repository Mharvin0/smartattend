import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Phone, Home, Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Download, ChevronDown } from 'lucide-react';

export default function AdminTrackingPage({ studentsNeedingCalls = [], studentsSentToCSDL = [], recentTracking = [], stats = {}, programs = [], departments = [] }) {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [editingTracking, setEditingTracking] = useState(null);
    const [viewingTracking, setViewingTracking] = useState(null);
    const [showViewTrackingModal, setShowViewTrackingModal] = useState(false);
    const [trackingTab, setTrackingTab] = useState('recent'); // 'recent', 'archived', 'deleted'
    const [recentTrackingData, setRecentTrackingData] = useState(recentTracking || []);
    const [archivedTracking, setArchivedTracking] = useState([]);
    const [deletedTracking, setDeletedTracking] = useState([]);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const [trackingFilters, setTrackingFilters] = useState({
        type: '',
        status: '',
        department_id: '',
        date_from: '',
        date_to: '',
        search: '',
    });
    const [trackingPagination, setTrackingPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });
    const [trackingForm, setTrackingForm] = useState({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        time: '',
        notes: '',
        status: 'completed',
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
            follow_up_date: tracking.follow_up_date || '',
        });
    };

    const submitTracking = (e) => {
        e.preventDefault();
        const routeName = editingTracking 
            ? 'admin.tracking.update-tracking'
            : 'admin.tracking.track-student';
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
                    follow_up_date: '',
                });
                router.reload();
            },
        });
    };

    useEffect(() => {
        setRecentTrackingData(recentTracking || []);
    }, [recentTracking]);

    const resolveTrackingRoute = (routeName) => {
        const hasRoute = typeof window !== 'undefined'
            && window.Ziggy
            && window.Ziggy.routes
            && window.Ziggy.routes[routeName];

        if (hasRoute) {
            return route(routeName);
        }

        if (routeName === 'admin.tracking.get-tracking') {
            return '/admin/tracking/records';
        }
        if (routeName === 'admin.tracking.archived-tracking') {
            return '/admin/tracking/archived';
        }
        if (routeName === 'admin.tracking.deleted-tracking') {
            return '/admin/tracking/deleted';
        }

        return null;
    };

    const fetchTrackingRecords = (page = 1, filters = trackingFilters) => {
        setIsLoadingTracking(true);
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: trackingPagination.per_page.toString(),
            ...(filters || {}),
        });

        const routeName =
            trackingTab === 'archived'
                ? 'admin.tracking.archived-tracking'
                : trackingTab === 'deleted'
                ? 'admin.tracking.deleted-tracking'
                : 'admin.tracking.get-tracking';

        const trackingUrl = resolveTrackingRoute(routeName);
        if (!trackingUrl) {
            console.error('Tracking route not found:', routeName);
            setIsLoadingTracking(false);
            return;
        }

        fetch(`${trackingUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (trackingTab === 'archived') {
                    setArchivedTracking(data.tracking || []);
                } else if (trackingTab === 'deleted') {
                    setDeletedTracking(data.tracking || []);
                } else {
                    setRecentTrackingData(data.tracking || []);
                }
                setTrackingPagination({
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    total: data.total || 0,
                    per_page: data.per_page || trackingPagination.per_page,
                });
            }
        })
        .catch(error => {
            console.error('Error fetching tracking records:', error);
        })
        .finally(() => {
            setIsLoadingTracking(false);
        });
    };

    useEffect(() => {
        setTrackingPagination(prev => ({ ...prev, current_page: 1 }));
        fetchTrackingRecords(1, trackingFilters);
    }, [trackingTab]);

    const handleTrackingFilterChange = (key, value) => {
        setTrackingFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleTrackingFilterApply = () => {
        setTrackingPagination(prev => ({ ...prev, current_page: 1 }));
        fetchTrackingRecords(1, trackingFilters);
    };

    const handleTrackingFilterReset = () => {
        const resetFilters = {
            type: '',
            status: '',
            department_id: '',
            date_from: '',
            date_to: '',
            search: '',
        };
        setTrackingFilters(resetFilters);
        setTrackingPagination(prev => ({ ...prev, current_page: 1 }));
        fetchTrackingRecords(1, resetFilters);
    };

    const handleTrackingPageChange = (page) => {
        if (page < 1 || page > trackingPagination.last_page) return;
        fetchTrackingRecords(page, trackingFilters);
    };


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
            case 'cancelled': return 'bg-gray-100 text-gray-800';
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
            router.put(route('admin.tracking.update-tracking', trackingId), {
                type: 'call',
                date: new Date().toISOString().split('T')[0],
                time: '',
                notes: '',
                status: newStatus,
                follow_up_date: '',
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['recentTracking', 'studentsNeedingCalls'] });
                },
            });
        } else {
            // Create new tracking record
            router.post(route('admin.tracking.track-student'), {
                student_id: studentId,
                type: 'call',
                date: new Date().toISOString().split('T')[0],
                time: '',
                notes: '',
                status: newStatus,
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

        // Print from a dedicated root (prevents duplicates caused by printing the live page).
        const printRootId = 'admin-tracking-print-root';
        const styleId = 'admin-tracking-print-style';

        const cleanup = () => {
            const existingRoot = document.getElementById(printRootId);
            if (existingRoot) existingRoot.remove();
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) existingStyle.remove();
            window.removeEventListener('afterprint', cleanup);
        };

        cleanup();

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @media print {
                @page { size: A4 landscape; margin: 0.3cm; }
                html, body { height: auto !important; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

                body * { display: none !important; }

                #${printRootId} {
                    display: block !important;
                    position: static !important;
                    width: 100% !important;
                    padding: 12px 16px !important;
                    background: #fff !important;
                }

                #${printRootId} * { display: revert !important; }

                #${printRootId} table {
                    display: table !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: fixed !important;
                    font-size: 13px !important;
                }
                #${printRootId} thead { display: table-header-group !important; }
                #${printRootId} tbody { display: table-row-group !important; }
                #${printRootId} tr { display: table-row !important; page-break-inside: avoid; }
                #${printRootId} th, #${printRootId} td {
                    display: table-cell !important;
                    border: 1px solid #000 !important;
                    padding: 8px 10px !important;
                    text-align: left !important;
                    vertical-align: top !important;
                    word-break: break-word !important;
                }
                #${printRootId} th {
                    background: #f3f4f6 !important;
                    font-weight: 700 !important;
                    text-align: center !important;
                    font-size: 14px !important;
                }
            }
        `;
        document.head.appendChild(style);

        const root = document.createElement('div');
        root.id = printRootId;

        const heading = document.createElement('div');
        heading.style.display = 'flex';
        heading.style.alignItems = 'baseline';
        heading.style.justifyContent = 'space-between';
        heading.style.marginBottom = '10px';

        const title = document.createElement('div');
        title.textContent = 'Admin Tracking Records (Recent)';
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';

        const meta = document.createElement('div');
        meta.textContent = `Generated: ${new Date().toLocaleString()} • Records: ${recentTrackingData?.length || 0}`;
        meta.style.fontSize = '12px';
        meta.style.color = '#374151';

        heading.appendChild(title);
        heading.appendChild(meta);
        root.appendChild(heading);

        const table = document.createElement('table');

        const colgroup = document.createElement('colgroup');
        // Name, Number, Section, Type, Date, Time, Status, Tracked By, Notes
        const colWidths = ['14%', '10%', '10%', '7%', '9%', '7%', '9%', '10%', '24%'];
        colWidths.forEach((w) => {
            const col = document.createElement('col');
            col.style.width = w;
            colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        [
            'Student Name',
            'Student Number',
            'Section',
            'Type',
            'Date',
            'Time',
            'Status',
            'Tracked By',
            'Notes',
        ].forEach((label) => {
            const th = document.createElement('th');
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        (recentTrackingData || []).forEach((tracking) => {
            const tr = document.createElement('tr');
            const status = tracking?.status || 'pending';
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

            const values = [
                tracking?.student?.name || 'N/A',
                tracking?.student?.student_number || 'N/A',
                tracking?.student?.section || 'N/A',
                tracking?.type === 'call' ? 'Call' : 'Home Visit',
                tracking?.date || 'N/A',
                tracking?.time || 'N/A',
                statusLabel,
                tracking?.tracked_by || 'N/A',
                tracking?.notes || 'N/A',
            ];

            values.forEach((value) => {
                const td = document.createElement('td');
                td.textContent = String(value ?? '');
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        root.appendChild(table);

        document.body.appendChild(root);
        window.addEventListener('afterprint', cleanup);

        window.print();
        setTimeout(cleanup, 3000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin Student Tracking" />
            
            <div className="space-y-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Tracking</h1>
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

                {/* Students Needing Calls (Admin handles) */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Students Needing Calls</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Update status using the radio buttons below</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Absences</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Tracking</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {studentsNeedingCalls.length > 0 ? (
                                    studentsNeedingCalls.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{student.student_number}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            value="completed"
                                                            checked={student.tracking_status === 'completed'}
                                                            onChange={() => handleStatusUpdate(student.id, student.last_tracking?.id, 'completed')}
                                                            className="w-3.5 h-3.5 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 border-gray-300"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Completed</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            value="cancelled"
                                                            checked={student.tracking_status === 'cancelled'}
                                                            onChange={() => handleStatusUpdate(student.id, student.last_tracking?.id, 'cancelled')}
                                                            className="w-3.5 h-3.5 text-gray-500 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 border-gray-300"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Cancelled</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            value="no_answer"
                                                            checked={student.tracking_status === 'no_answer'}
                                                            onChange={() => handleStatusUpdate(student.id, student.last_tracking?.id, 'no_answer')}
                                                            className="w-3.5 h-3.5 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 border-gray-300"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">No answer</span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityColor(student.priority)}`}>
                                                    {student.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600 font-medium">{student.absence_count}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600">{student.guardian_contact || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {student.last_tracking ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400">{getTypeIcon(student.last_tracking.type)}</span>
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-700 capitalize">{student.last_tracking.type.replace('_', ' ')}</div>
                                                            <div className="text-xs text-gray-400">{student.last_tracking.date}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Never</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleTrackStudent(student)}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        Track
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to archive this student from the attention list?')) {
                                                                router.post(route('admin.tracking.archive-student-from-attention', student.id), {}, {
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
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                        title="Archive"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-16 text-center">
                                            <div className="text-sm text-gray-400">No students need attention at this time</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Students Sent to CSDL for Home Visits (View Only) */}
                {studentsSentToCSDL.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">Students Sent to CSDL for Home Visits</h3>
                            <p className="text-xs text-gray-500 mt-0.5">View only — These students are being handled by CSDL</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Absences</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Tracking</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {studentsSentToCSDL.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{student.student_number}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(student.tracking_status)}`}>
                                                    {student.tracking_status === 'completed' ? 'Completed' : 
                                                     student.tracking_status === 'no_answer' ? 'No answer' : 
                                                     student.tracking_status && student.tracking_status !== 'No Status' ? student.tracking_status.replace('_', ' ') : 'No Status'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityColor(student.priority)}`}>
                                                    {student.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600 font-medium">{student.absence_count}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600">{student.guardian_contact || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {student.last_tracking ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400">{getTypeIcon(student.last_tracking.type)}</span>
                                                        <div>
                                                            <div className="text-xs font-medium text-gray-700 capitalize">{student.last_tracking.type.replace('_', ' ')}</div>
                                                            <div className="text-xs text-gray-400">{student.last_tracking.date}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Never</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tracking Records with Tabs */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm print-section">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Tracking Records</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportTracking}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                    title={`Export ${trackingTab} tracking records`}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Export
                                </button>
                                <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
                                <button
                                    onClick={() => setTrackingTab('recent')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        trackingTab === 'recent'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Recent
                                </button>
                                <button
                                    onClick={() => setTrackingTab('archived')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        trackingTab === 'archived'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Archived
                                </button>
                                <button
                                    onClick={() => setTrackingTab('deleted')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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

                    {/* Filters Section */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={trackingFilters.type}
                                    onChange={(e) => handleTrackingFilterChange('type', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="call">Call</option>
                                    <option value="home_visit">Home Visit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={trackingFilters.status}
                                    onChange={(e) => handleTrackingFilterChange('status', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="to_follow">To Follow</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_answer">No Answer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={trackingFilters.department_id}
                                    onChange={(e) => handleTrackingFilterChange('department_id', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All</option>
                                    {departments?.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                                <input
                                    type="date"
                                    value={trackingFilters.date_from}
                                    onChange={(e) => handleTrackingFilterChange('date_from', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                                <input
                                    type="date"
                                    value={trackingFilters.date_to}
                                    onChange={(e) => handleTrackingFilterChange('date_to', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                                <input
                                    type="text"
                                    placeholder="Student name/number"
                                    value={trackingFilters.search}
                                    onChange={(e) => handleTrackingFilterChange('search', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handleTrackingFilterApply}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={handleTrackingFilterReset}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {isLoadingTracking ? (
                            <div className="text-center py-12 text-gray-400">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
                                <p className="mt-2 text-xs">Loading...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(() => {
                                    const list =
                                        trackingTab === 'recent'
                                            ? recentTrackingData
                                            : trackingTab === 'archived'
                                            ? archivedTracking
                                            : deletedTracking;
                                    return list;
                                })().length > 0 ? (
                                    (() => {
                                        const list =
                                            trackingTab === 'recent'
                                                ? recentTrackingData
                                                : trackingTab === 'archived'
                                                ? archivedTracking
                                                : deletedTracking;
                                        return list;
                                    })().map((tracking) => (
                                    <div key={tracking.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${tracking.type === 'call' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                {getTypeIcon(tracking.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{tracking.student.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{tracking.student.section}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{tracking.student.department} • {tracking.student.program}</p>
                                                {tracking.notes && (
                                                    <p className="text-xs text-gray-600 mt-1.5 max-w-md line-clamp-1">{tracking.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(tracking.status)}`}>
                                                    {tracking.status === 'completed' ? 'Completed' : 
                                                     tracking.status === 'cancelled' ? 'Cancelled' : 
                                                     tracking.status === 'no_answer' ? 'No answer' : 
                                                     tracking.status ? tracking.status.replace('_', ' ') : 'No Status'}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1.5">
                                                    {tracking.date} {tracking.time && `• ${tracking.time}`}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">by {tracking.tracked_by}</p>
                                                {trackingTab === 'archived' && tracking.archived_at && (
                                                    <p className="text-xs text-gray-400 mt-0.5">Archived: {tracking.archived_at}</p>
                                                )}
                                                {trackingTab === 'deleted' && tracking.deleted_at && (
                                                    <p className="text-xs text-gray-400 mt-0.5">Deleted: {tracking.deleted_at}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {trackingTab === 'recent' && (
                                                    <button
                                                        onClick={() => {
                                                            fetch(route('admin.tracking.view-tracking', tracking.id), {
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
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                                {trackingTab === 'archived' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to unarchive this tracking record?')) {
                                                                router.post(route('admin.tracking.unarchive-tracking', tracking.id), {}, {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        fetchTrackingRecords(trackingPagination.current_page, trackingFilters);
                                                                        router.reload({ only: ['recentTracking'] });
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to unarchive tracking record');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                                                        title="Unarchive"
                                                    >
                                                        Unarchive
                                                    </button>
                                                )}
                                                {trackingTab === 'deleted' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to restore this tracking record?')) {
                                                                router.post(route('admin.tracking.restore-tracking', tracking.id), {}, {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => {
                                                                        fetchTrackingRecords(trackingPagination.current_page, trackingFilters);
                                                                    },
                                                                    onError: () => {
                                                                        alert('Failed to restore tracking record');
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
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
                                    <div className="text-center py-12 text-gray-400">
                                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm font-medium">
                                            {trackingTab === 'recent' && 'No tracking records yet'}
                                            {trackingTab === 'archived' && 'No archived tracking records'}
                                            {trackingTab === 'deleted' && 'No deleted tracking records'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {trackingPagination.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 px-6 pb-4">
                            <div className="text-xs text-gray-600">
                                Showing {((trackingPagination.current_page - 1) * trackingPagination.per_page) + 1} to {Math.min(trackingPagination.current_page * trackingPagination.per_page, trackingPagination.total)} of {trackingPagination.total} results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleTrackingPageChange(trackingPagination.current_page - 1)}
                                    disabled={trackingPagination.current_page === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, trackingPagination.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (trackingPagination.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (trackingPagination.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (trackingPagination.current_page >= trackingPagination.last_page - 2) {
                                            pageNum = trackingPagination.last_page - 4 + i;
                                        } else {
                                            pageNum = trackingPagination.current_page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handleTrackingPageChange(pageNum)}
                                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    trackingPagination.current_page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handleTrackingPageChange(trackingPagination.current_page + 1)}
                                    disabled={trackingPagination.current_page === trackingPagination.last_page}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
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
                                                    router.post(route('admin.tracking.archive-tracking', editingTracking.id), {}, {
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
                                                    router.delete(route('admin.tracking.delete-tracking', editingTracking.id), {
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
                                            value="Call"
                                            disabled
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <input type="hidden" name="type" value="call" />
                                        <p className="text-xs text-gray-500 mt-1">Admin can only track calls. Home visits are handled by CSDL.</p>
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
                                                    value="cancelled"
                                                    checked={trackingForm.status === 'cancelled'}
                                                    onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                                    className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                                                    required
                                                />
                                                <span className="text-sm font-medium text-gray-700">Cancelled</span>
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
                                            min={(() => {
                                                // Only allow future dates (tomorrow and onwards)
                                                const tomorrow = new Date();
                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                return tomorrow.toISOString().split('T')[0];
                                            })()}
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
                                                    router.post(route('admin.tracking.archive-tracking', viewingTracking.id), {}, {
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
                                                    router.delete(route('admin.tracking.delete-tracking', viewingTracking.id), {
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
                                    {!viewingTracking.notes && (
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

