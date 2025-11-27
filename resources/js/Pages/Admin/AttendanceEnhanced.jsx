import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '@/Components/DataTable';

export default function AttendanceEnhanced({ 
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
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDate, setSelectedDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [departmentRates, setDepartmentRates] = useState(null);
    const [facultyCompliance, setFacultyCompliance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
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

    // Load department attendance rates
    const loadDepartmentRates = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            params.append('date_range[]', startDate.toISOString().split('T')[0]);
            params.append('date_range[]', new Date().toISOString().split('T')[0]);
            
            if (selectedDepartment) params.append('department_id', selectedDepartment);
            
            const response = await fetch(`${route('admin.attendance.department-rates')}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Department rates error:', data.error);
                setDepartmentRates(null);
            } else {
                setDepartmentRates(data);
            }
        } catch (error) {
            console.error('Failed to load department rates:', error);
            setDepartmentRates(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartment]);

    // Load faculty compliance data
    const loadFacultyCompliance = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            params.append('date_range[]', startDate.toISOString().split('T')[0]);
            params.append('date_range[]', new Date().toISOString().split('T')[0]);
            
            if (selectedDepartment) params.append('department_id', selectedDepartment);
            
            const response = await fetch(`${route('admin.attendance.faculty-compliance')}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Faculty compliance error:', data.error);
                setFacultyCompliance(null);
            } else {
                setFacultyCompliance(data);
            }
        } catch (error) {
            console.error('Failed to load faculty compliance:', error);
            setFacultyCompliance(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartment]);

    // Generate report
    const generateReport = useCallback(async (reportType, format) => {
        setReportLoading(true);
        try {
            const startDate = new Date();
            if (reportType === 'weekly') {
                startDate.setDate(startDate.getDate() - 7);
            } else {
                startDate.setMonth(startDate.getMonth() - 1);
            }
            
            const response = await fetch(route('admin.attendance.generate-report'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    report_type: reportType,
                    format: format,
                    date_range: [
                        startDate.toISOString().split('T')[0],
                        new Date().toISOString().split('T')[0]
                    ],
                    department_id: selectedDepartment || null,
                    program_id: selectedProgram || null,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Report generation error:', data.error);
                alert('Failed to generate report: ' + data.error);
            } else {
                alert(data.message || 'Report generated successfully!');
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report: ' + error.message);
        } finally {
            setReportLoading(false);
        }
    }, [selectedDepartment, selectedProgram]);

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


    const statusOptions = [
        { value: 'present', label: 'Present', color: 'text-green-600', bg: 'bg-green-100' },
        { value: 'late', label: 'Late', color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { value: 'absent', label: 'Absent', color: 'text-red-600', bg: 'bg-red-100' },
        { value: 'excused', label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    const tabs = [
        { id: 'overview', name: 'Overview', icon: '📊' },
    ];

    const getComplianceStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'good': return 'text-blue-600 bg-blue-100';
            case 'fair': return 'text-yellow-600 bg-yellow-100';
            case 'needs_improvement': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getAttendanceRateColor = (rate) => {
        if (rate >= 90) return 'text-green-600';
        if (rate >= 80) return 'text-yellow-600';
        if (rate >= 70) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Enhanced Attendance Management" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    Enhanced Attendance
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Advanced attendance tracking and analytics
                                </p>
                            </div>
                        </div>
                    </div>
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            {flash.success}
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="card">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${
                                            activeTab === tab.id
                                                ? 'border-brand-primary text-brand-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Quick Stats Cards - Only show on Overview tab */}
                    {activeTab === 'overview' && (
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
                    )}

                    {/* Filters - Show on all tabs except reports */}
                    {activeTab !== 'reports' && (
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
                                            onChange={(e) => debouncedSearch(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="card">
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Attendance Records</h3>
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentRecords.map((record) => (
                                                <tr key={record.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {record.student?.first_name} {record.student?.last_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {record.student?.section?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            statusOptions.find(s => s.value === record.status)?.bg || 'bg-gray-100'
                                                        } ${
                                                            statusOptions.find(s => s.value === record.status)?.color || 'text-gray-600'
                                                        }`}>
                                                            {statusOptions.find(s => s.value === record.status)?.label || record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(record.created_at).toLocaleTimeString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
