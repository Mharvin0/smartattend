import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '@/Components/DataTable';

export default function Attendance({ 
    stats, 
    todayAttendance, 
    trends, 
    departments, 
    programs, 
    sections, 
    recentRecords, 
    calendarData, 
    filters 
}) {
    const [selectedDate, setSelectedDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef(null);

    const flash = usePage().props.flash || {};

    // Filter programs based on selected department
    const filteredPrograms = selectedDepartment 
        ? programs.filter(p => p.department_id == selectedDepartment)
        : programs;

    // Filter sections based on selected program
    const filteredSections = selectedProgram 
        ? sections.filter(s => s.program_id == selectedProgram)
        : sections;

    // Apply filters
    const applyFilters = useCallback(() => {
        const queryParams = new URLSearchParams();
        
        if (selectedDate) queryParams.append('date', selectedDate);
        if (selectedDepartment) queryParams.append('department_id', selectedDepartment);
        if (selectedProgram) queryParams.append('program_id', selectedProgram);
        if (selectedSection) queryParams.append('section_id', selectedSection);
        if (selectedStatus) queryParams.append('status', selectedStatus);
        if (searchTerm) queryParams.append('search', searchTerm);
        
        router.get(route('admin.attendance'), Object.fromEntries(queryParams), {
            preserveState: true,
            replace: true
        });
    }, [selectedDate, selectedDepartment, selectedProgram, selectedSection, selectedStatus, searchTerm]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedSection('');
        setSelectedDepartment('');
        setSelectedProgram('');
        setSelectedStatus('');
        setSearchTerm('');
        router.get(route('admin.attendance'));
    }, []);

    // Load analytics data
    const loadAnalytics = useCallback(async (filters = {}) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const date = filters.date || selectedDate;
            const department = filters.department_id || selectedDepartment;
            const program = filters.program_id || selectedProgram;
            const section = filters.section_id || selectedSection;
            
            if (date) {
                params.append('date_range[]', date);
                params.append('date_range[]', date);
            }
            if (department) params.append('department_id', department);
            if (program) params.append('program_id', program);
            if (section) params.append('section_id', section);
            
            const response = await fetch(`${route('admin.attendance.analytics')}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Analytics error:', data.error);
                setAnalyticsData(null);
            } else {
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            setAnalyticsData(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, selectedDepartment, selectedProgram, selectedSection]);

    // Debounced search function
    const debouncedSearch = useCallback((value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
            applyFilters();
        }, 500);
    }, [applyFilters]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Remove automatic filter application to prevent infinite loops
    // Filters will be applied manually when user changes them

    const statusOptions = [
        { value: 'present', label: 'Present', color: 'text-green-600', bg: 'bg-green-100' },
        { value: 'late', label: 'Late', color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { value: 'absent', label: 'Absent', color: 'text-red-600', bg: 'bg-red-100' },
        { value: 'excused', label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

	return (
        <AuthenticatedLayout header={<h2 className="text-2xl font-bold leading-tight text-gray-800">Attendance Dashboard</h2>}>
            <Head title="Attendance Dashboard" />
			<div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5 py-8">
                <div className="mx-auto max-w-full space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12">
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            {flash.success}
                        </div>
                    )}

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                                    <p className="text-sm font-medium text-gray-500">Present Today</p>
                                    <p className="text-2xl font-semibold text-gray-900">{todayAttendance.present_today}</p>
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
                                    <p className="text-sm font-medium text-gray-500">Late Today</p>
                                    <p className="text-2xl font-semibold text-gray-900">{todayAttendance.late_today}</p>
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
                                    <p className="text-sm font-medium text-gray-500">Absent Today</p>
                                    <p className="text-2xl font-semibold text-gray-900">{todayAttendance.absent_today}</p>
                                </div>
                            </div>
                        </div>

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
                                    <p className="text-sm font-medium text-gray-500">Excused Today</p>
                                    <p className="text-2xl font-semibold text-gray-900">{todayAttendance.excused_today}</p>
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            applyFilters();
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => {
                                            setSelectedDepartment(e.target.value);
                                            setSelectedProgram('');
                                            setSelectedSection('');
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
                                    <label className="block text-sm font-medium text-gray-700">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search students..."
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
                                Showing {recentRecords.length} recent records
                            </div>
                        </div>
                    </div>

                    {/* Recording Actions */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Record Attendance</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <button
                                onClick={() => router.get(route('admin.attendance.section'))}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Record by Section
                            </button>

                            <button
                                onClick={() => router.get(route('admin.attendance.schedule'))}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Record by Schedule
                            </button>
                        </div>
                    </div>

                    {/* Recent Attendance Records */}
                    <div className="card">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
                                <p className="mt-1 text-sm text-gray-600">Latest attendance entries across all sections.</p>
                            </div>
                            <button
                                onClick={() => router.get(route('admin.attendance.import'))}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import Attendance
                            </button>
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'student',
                                    label: 'Student',
                                    render: (student) => (
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {student?.first_name} {student?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{student?.student_number}</div>
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
                                    key: 'subject',
                                    label: 'Subject',
                                    render: (_, record) => (
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {record.schedule?.subject?.name || 'General'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {record.schedule?.subject?.code || ''}
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (status) => {
                                        const statusOption = statusOptions.find(s => s.value === status);
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.bg} ${statusOption?.color}`}>
                                                {statusOption?.label || status}
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
                                    key: 'time',
                                    label: 'Time',
                                    render: (_, record) => record.schedule?.time_start ? 
                                        `${record.schedule.time_start} - ${record.schedule.time_end}` : 
                                        'N/A'
                                },
                                {
                                    key: 'recorded_by',
                                    label: 'Recorded By',
                                    render: (recordedBy) => recordedBy?.name || 'System'
                                }
                            ]}
                            data={recentRecords}
                            actions={true}
                        />
                    </div>

                    {/* Analytics Data */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                            <button
                                onClick={() => loadAnalytics()}
                                disabled={isLoading}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Analytics
                                    </>
                                )}
                            </button>
                        </div>

                        {analyticsData ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Attendance Statistics</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Present:</span>
                                            <span className="text-sm font-medium text-green-600">{analyticsData.stats.present}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Late:</span>
                                            <span className="text-sm font-medium text-yellow-600">{analyticsData.stats.late}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Absent:</span>
                                            <span className="text-sm font-medium text-red-600">{analyticsData.stats.absent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Excused:</span>
                                            <span className="text-sm font-medium text-blue-600">{analyticsData.stats.excused}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Percentages</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Present Rate:</span>
                                            <span className="text-sm font-medium text-green-600">{analyticsData.stats.present_percentage}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Absent Rate:</span>
                                            <span className="text-sm font-medium text-red-600">{analyticsData.stats.absent_percentage}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Top Absent Students</h4>
                                    <div className="space-y-1">
                                        {analyticsData.topAbsentStudents?.slice(0, 5).map((student, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{student.student?.first_name} {student.student?.last_name}</span>
                                                <span className="font-medium text-red-600">{student.absent_count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
                                <p className="mt-1 text-sm text-gray-500">Click "Refresh Analytics" to load attendance analytics.</p>
                            </div>
                        )}
							</div>

				</div>
			</div>
		</AuthenticatedLayout>
	);
}