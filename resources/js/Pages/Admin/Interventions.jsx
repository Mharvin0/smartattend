import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '@/Components/DataTable';

export default function Interventions({
    interventions,
    departments,
    programs,
    sections,
    schedules,
    stats,
    statusOptions,
    priorityOptions,
    filters
}) {
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || '');
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [selectedSchedule, setSelectedSchedule] = useState(filters.schedule_id || '');
    const [studentNumber, setStudentNumber] = useState(filters.student_number || '');
    const [studentName, setStudentName] = useState(filters.student_name || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedInterventions, setSelectedInterventions] = useState([]);
    const [bulkAction, setBulkAction] = useState('');
    const [bulkValue, setBulkValue] = useState('');
    const searchTimeoutRef = useRef(null);

    const flash = usePage().props.flash || {};

    // department
    const filteredPrograms = selectedDepartment 
        ? programs.filter(p => p.department_id == selectedDepartment)
        : programs;

    // program
    const filteredSections = selectedProgram 
        ? sections.filter(s => s.program_id == selectedProgram)
        : sections;

    // section
    const filteredSchedules = selectedSection 
        ? schedules.filter(s => s.section_id == selectedSection)
        : schedules;

    const applyFilters = useCallback(() => {
        const queryParams = new URLSearchParams();
        
        if (selectedDepartment) queryParams.append('department_id', selectedDepartment);
        if (selectedProgram) queryParams.append('program_id', selectedProgram);
        if (selectedSection) queryParams.append('section_id', selectedSection);
        if (selectedSchedule) queryParams.append('schedule_id', selectedSchedule);
        if (studentNumber) queryParams.append('student_number', studentNumber);
        if (studentName) queryParams.append('student_name', studentName);
        if (selectedStatus) queryParams.append('status', selectedStatus);
        if (selectedPriority) queryParams.append('priority', selectedPriority);
        if (dateFrom) queryParams.append('date_from', dateFrom);
        if (dateTo) queryParams.append('date_to', dateTo);
        if (searchTerm) queryParams.append('search', searchTerm);
        
        router.get(route('admin.interventions'), Object.fromEntries(queryParams), {
            preserveState: true,
            replace: true
        });
    }, [selectedDepartment, selectedProgram, selectedSection, selectedSchedule, studentNumber, studentName, selectedStatus, selectedPriority, dateFrom, dateTo, searchTerm]);

    const clearFilters = useCallback(() => {
        setSelectedDepartment('');
        setSelectedProgram('');
        setSelectedSection('');
        setSelectedSchedule('');
        setStudentNumber('');
        setStudentName('');
        setSelectedStatus('');
        setSelectedPriority('');
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
        router.get(route('admin.interventions'));
    }, []);

    const debouncedSearch = useCallback((value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
            applyFilters();
        }, 500);
    }, [applyFilters]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleInterventionSelect = (interventionId, isSelected) => {
        if (isSelected) {
            setSelectedInterventions(prev => [...prev, interventionId]);
        } else {
            setSelectedInterventions(prev => prev.filter(id => id !== interventionId));
        }
    };

    const handleBulkAction = () => {
        if (!bulkAction || selectedInterventions.length === 0) return;

        router.post(route('admin.interventions.bulk'), {
            action: bulkAction,
            value: bulkValue,
            ids: selectedInterventions
        }, {
            onSuccess: () => {
                setSelectedInterventions([]);
                setBulkAction('');
                setBulkValue('');
            }
        });
    };

    const handleStatusUpdate = async (interventionId, newStatus, outcome = '') => {
        try {
            const response = await fetch(route('admin.interventions.status', interventionId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    status: newStatus,
                    outcome: outcome
                })
            });

            if (response.ok) {
                const data = await response.json();
                router.reload();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Interventions Management" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    Interventions
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Manage student interventions and support actions
                                </p>
                            </div>
                        </div>
                    </div>
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            {flash.success}
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="card">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Interventions</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Done</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.done}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">In Progress</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.in_progress}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">No Response</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.no_response}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => {
                                            setSelectedDepartment(e.target.value);
                                            setSelectedProgram('');
                                            setSelectedSection('');
                                            setSelectedSchedule('');
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Program</label>
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => {
                                            setSelectedProgram(e.target.value);
                                            setSelectedSection('');
                                            setSelectedSchedule('');
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        disabled={!selectedDepartment}
                                    >
                                        <option value="">All Programs</option>
                                        {filteredPrograms.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => {
                                            setSelectedSection(e.target.value);
                                            setSelectedSchedule('');
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        disabled={!selectedProgram}
                                    >
                                        <option value="">All Sections</option>
                                        {filteredSections.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Schedule</label>
                                    <select
                                        value={selectedSchedule}
                                        onChange={(e) => {
                                            setSelectedSchedule(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        disabled={!selectedSection}
                                    >
                                        <option value="">All Schedules</option>
                                        {filteredSchedules.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.subject?.name} - {s.day} {s.time_start}-{s.time_end}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Student Number</label>
                                    <input
                                        type="text"
                                        value={studentNumber}
                                        onChange={(e) => {
                                            setStudentNumber(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        placeholder="Enter student number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Student Name</label>
                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => {
                                            setStudentName(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        placeholder="Enter student name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => {
                                            setSelectedStatus(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="">All Status</option>
                                        {statusOptions.map((status) => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        value={selectedPriority}
                                        onChange={(e) => {
                                            setSelectedPriority(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="">All Priorities</option>
                                        {priorityOptions.map((priority) => (
                                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date From</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setDateFrom(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date To</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    />
                                </div>

                                <div className="xl:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search interventions..."
                                        defaultValue={searchTerm}
                                        onChange={(e) => debouncedSearch(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                Clear Filters
                            </button>
                            <div className="text-sm text-gray-500">
                                Showing {interventions.data.length} of {interventions.total} interventions
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedInterventions.length > 0 && (
                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">
                                        {selectedInterventions.length} intervention(s) selected
                                    </span>
                                    <select
                                        value={bulkAction}
                                        onChange={(e) => setBulkAction(e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="">Select Action</option>
                                        <option value="status">Update Status</option>
                                        <option value="priority">Update Priority</option>
                                        <option value="delete">Delete</option>
                                    </select>
                                    {bulkAction && bulkAction !== 'delete' && (
                                        <select
                                            value={bulkValue}
                                            onChange={(e) => setBulkValue(e.target.value)}
                                            className="rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        >
                                            <option value="">Select Value</option>
                                            {bulkAction === 'status' && statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                            {bulkAction === 'priority' && priorityOptions.map((priority) => (
                                                <option key={priority.value} value={priority.value}>{priority.label}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleBulkAction}
                                        disabled={!bulkAction || (bulkAction !== 'delete' && !bulkValue)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
                                    >
                                        Apply Action
                                    </button>
                                    <button
                                        onClick={() => setSelectedInterventions([])}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interventions Table */}
                    <div className="card">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Interventions</h3>
                            <p className="mt-1 text-sm text-gray-600">Manage student interventions and track their progress.</p>
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'select',
                                    label: '',
                                    render: (_, record) => (
                                        <input
                                            type="checkbox"
                                            checked={selectedInterventions.includes(record.id)}
                                            onChange={(e) => handleInterventionSelect(record.id, e.target.checked)}
                                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                        />
                                    )
                                },
                                {
                                    key: 'student',
                                    label: 'Student',
                                    render: (_, record) => (
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {record.student?.first_name} {record.student?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{record.student?.student_number}</div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'section',
                                    label: 'Section',
                                    render: (_, record) => (
                                        <span className="inline-flex items-center rounded-full bg-brand-primary bg-opacity-10 px-2.5 py-0.5 text-sm font-medium text-brand-primary">
                                            {record.student?.section?.name || 'N/A'}
                                        </span>
                                    )
                                },
                                {
                                    key: 'type',
                                    label: 'Type',
                                    render: (type) => (
                                        <span className="font-medium text-gray-900">{type}</span>
                                    )
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (status) => {
                                        const statusOption = statusOptions.find(s => s.value === status);
                                        return (
                                            <select
                                                value={status}
                                                onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.bg} ${statusOption?.color} border-0 focus:ring-0`}
                                            >
                                                {statusOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        );
                                    }
                                },
                                {
                                    key: 'priority',
                                    label: 'Priority',
                                    render: (priority) => {
                                        const priorityOption = priorityOptions.find(p => p.value === priority);
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityOption?.bg} ${priorityOption?.color}`}>
                                                {priorityOption?.label || priority}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'date',
                                    label: 'Date',
                                    render: (date) => new Date(date).toLocaleDateString()
                                },
                                {
                                    key: 'responsible_staff',
                                    label: 'Responsible Staff',
                                    render: (staff) => staff || 'Not Assigned'
                                },
                                {
                                    key: 'recorded_by',
                                    label: 'Recorded By',
                                    render: (_, record) => record.recorded_by?.name || 'System'
                                }
                            ]}
                            data={interventions.data}
                            actions={true}
                        />

                        {/* Pagination */}
                        {interventions.links && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {interventions.from} to {interventions.to} of {interventions.total} results
                                </div>
                                <div className="flex space-x-2">
                                    {interventions.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                link.active
                                                    ? 'bg-brand-primary text-white'
                                                    : link.url
                                                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}