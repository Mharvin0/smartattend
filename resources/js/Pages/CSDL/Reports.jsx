import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BarChart3, TrendingUp, Phone, Home, Calendar, Download, Filter, Eye, Archive, ArchiveRestore } from 'lucide-react';

export default function Reports({ stats = {}, recentTracking = [], filters = {}, tab = 'active', filterOptions = {} }) {
    const [typeFilter] = useState('home_visit');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [departmentFilter, setDepartmentFilter] = useState(filters.department_id || '');
    const [programFilter, setProgramFilter] = useState(filters.program_id || '');
    const [sectionFilter, setSectionFilter] = useState(filters.section_id || '');
    const [trackedByFilter, setTrackedByFilter] = useState(filters.tracked_by || '');
    const [dateFromFilter, setDateFromFilter] = useState(filters.date_from || '');
    const [dateToFilter, setDateToFilter] = useState(filters.date_to || '');
    const [searchFilter, setSearchFilter] = useState(filters.search || '');
    const [activeTab, setActiveTab] = useState(tab);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 15;

    const { departments = [], programs = [], sections = [], trackedByUsers = [] } = filterOptions;

    // Filter programs by selected department
    const filteredPrograms = departmentFilter
        ? programs.filter(p => p.department_id == departmentFilter)
        : programs;

    // Filter sections by selected program
    const filteredSections = programFilter
        ? sections.filter(s => s.program_id == programFilter)
        : sections;

    const applyFilters = useCallback(() => {
        router.get(route('csdl.reports'), {
            tab: activeTab,
            type: 'home_visit',
            status: statusFilter || undefined,
            department_id: departmentFilter || undefined,
            program_id: programFilter || undefined,
            section_id: sectionFilter || undefined,
            tracked_by: trackedByFilter || undefined,
            date_from: dateFromFilter || undefined,
            date_to: dateToFilter || undefined,
            search: searchFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    }, [activeTab, typeFilter, statusFilter, departmentFilter, programFilter, sectionFilter, trackedByFilter, dateFromFilter, dateToFilter, searchFilter]);

    // Auto-apply filters when they change (with debounce for search)
    useEffect(() => {
        // Skip on initial mount - only apply when filters actually change
        const hasChanges = 
            activeTab !== tab ||
            statusFilter !== (filters.status || '') ||
            departmentFilter !== (filters.department_id || '') ||
            programFilter !== (filters.program_id || '') ||
            sectionFilter !== (filters.section_id || '') ||
            trackedByFilter !== (filters.tracked_by || '') ||
            dateFromFilter !== (filters.date_from || '') ||
            dateToFilter !== (filters.date_to || '') ||
            searchFilter !== (filters.search || '');

        if (!hasChanges) return;

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // For search, debounce the filter application (500ms), immediate for others
        const isSearchChange = searchFilter !== (filters.search || '');
        const timeout = setTimeout(() => {
            applyFilters();
        }, isSearchChange ? 500 : 0);

        setSearchTimeout(timeout);

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [activeTab, typeFilter, statusFilter, departmentFilter, programFilter, sectionFilter, trackedByFilter, dateFromFilter, dateToFilter, searchFilter]);

    const clearFilters = () => {
        setTypeFilter('');
        setStatusFilter('');
        setDepartmentFilter('');
        setProgramFilter('');
        setSectionFilter('');
        setTrackedByFilter('');
        setDateFromFilter('');
        setDateToFilter('');
        setSearchFilter('');
        // Filters will auto-apply via useEffect
    };

    const switchTab = (newTab) => {
        setActiveTab(newTab);
        // Tab change will trigger auto-filter via useEffect
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [recentTracking, activeTab]);

    const handleView = (id) => {
        router.visit(route('csdl.reports.show', id));
    };

    const handleArchive = (id) => {
        if (confirm('Are you sure you want to archive this record?')) {
            router.post(route('csdl.reports.archive', id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['recentTracking'] });
                },
            });
        }
    };

    const handleUnarchive = (id) => {
        router.post(route('csdl.reports.unarchive', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['recentTracking'] });
            },
        });
    };


    const handleExportReport = () => {
        // Only export if on active tab, not archived
        if (activeTab !== 'active') {
            alert('Only active tracking records can be exported. Please switch to the Active tab.');
            return;
        }

        // Build a dedicated print-only table (more reliable than printing the live page)
        const printRootId = 'csdl-reports-print-root';
        const styleId = 'csdl-reports-print-style';

        const toTitle = (value) => {
            if (!value) return 'N/A';
            const s = String(value).replace(/_/g, ' ');
            return s.charAt(0).toUpperCase() + s.slice(1);
        };

        const formatDate = (value) => {
            if (!value) return 'N/A';
            try {
                return new Date(value).toLocaleDateString();
            } catch {
                return String(value);
            }
        };

        const cleanup = () => {
            const existingRoot = document.getElementById(printRootId);
            if (existingRoot) existingRoot.remove();
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) existingStyle.remove();
            window.removeEventListener('afterprint', cleanup);
        };

        // Remove any previous leftovers
        cleanup();

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @media print {
                @page { size: A4 landscape; margin: 0.3cm; }
                html, body { height: auto !important; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

                /* Critical: remove the app from layout so the browser doesn't paginate invisible content */
                body * { display: none !important; }

                #${printRootId} {
                    display: block !important;
                    position: static !important; /* fixed elements can repeat on every printed page */
                    width: 100% !important;
                    padding: 12px 16px !important;
                    background: #fff !important;
                }

                /* Re-enable display for print root contents */
                #${printRootId} * { display: revert !important; }

                /* Restore display types for table elements */
                #${printRootId} table {
                    display: table !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: fixed !important;
                    font-size: 14px !important;
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
                    font-size: 15px !important;
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
        title.textContent = 'CSDL Tracking Reports (Active)';
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';

        const meta = document.createElement('div');
        meta.textContent = `Generated: ${new Date().toLocaleString()}`;
        meta.style.fontSize = '12px';
        meta.style.color = '#111';

        heading.appendChild(title);
        heading.appendChild(meta);
        root.appendChild(heading);

        const table = document.createElement('table');

        // Column widths tuned for landscape A4
        const colgroup = document.createElement('colgroup');
        const colWidths = ['7%', '18%', '14%', '8%', '12%', '11%', '30%']; // Type, Student, Section, Date, Time, Tracked By, Notes
        colWidths.forEach((w) => {
            const col = document.createElement('col');
            col.style.width = w;
            colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Type', 'Student', 'Section', 'Date', 'Time', 'Tracked By', 'Notes'].forEach((h) => {
            const th = document.createElement('th');
            th.textContent = h;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        (recentTracking || []).forEach((tracking) => {
            const tr = document.createElement('tr');

            const tdType = document.createElement('td');
            tdType.textContent = toTitle(tracking?.type);

            const tdStudent = document.createElement('td');
            tdStudent.textContent = tracking?.student?.name || 'N/A';

            const tdSection = document.createElement('td');
            tdSection.textContent = tracking?.student?.section || 'N/A';

            const tdDate = document.createElement('td');
            tdDate.textContent = formatDate(tracking?.date);

            const tdTime = document.createElement('td');
            tdTime.textContent = tracking?.time || '-';

            const tdTrackedBy = document.createElement('td');
            tdTrackedBy.textContent = tracking?.tracked_by || 'N/A';

            const tdNotes = document.createElement('td');
            const notesParts = [];
            if (tracking?.notes) notesParts.push(String(tracking.notes));
            if (tracking?.outcome) notesParts.push(`Outcome: ${tracking.outcome}`);
            tdNotes.textContent = notesParts.length ? notesParts.join(' | ') : '-';

            [tdType, tdStudent, tdSection, tdDate, tdTime, tdTrackedBy, tdNotes].forEach((td) => tr.appendChild(td));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        root.appendChild(table);

        document.body.appendChild(root);

        window.addEventListener('afterprint', cleanup);

        // Give the DOM a moment to paint before opening print dialog
        setTimeout(() => {
            window.print();
        }, 50);
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

    const totalPages = Math.ceil((recentTracking?.length || 0) / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedTracking = (recentTracking || []).slice(startIndex, endIndex);

    return (
        <AuthenticatedLayout>
            <Head title="CSDL Reports" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="text-gray-600">Tracking reports and analytics</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleExportReport}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Tracking</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.today?.total || 0}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.today?.calls || 0} calls, {stats.today?.visits || 0} visits
                                </p>
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
                                <p className="text-2xl font-semibold text-gray-900">{stats.this_week?.total || 0}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.this_week?.calls || 0} calls, {stats.this_week?.visits || 0} visits
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">This Month</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.this_month?.total || 0}</p>
                                <p className="text-xs text-gray-500">
                                    {stats.this_month?.calls || 0} calls, {stats.this_month?.visits || 0} visits
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => switchTab('active')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                    activeTab === 'active'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => switchTab('archived')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                    activeTab === 'archived'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Archived
                            </button>
                        </nav>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="space-y-4">
                            {/* First Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        value={departmentFilter}
                                        onChange={(e) => {
                                            setDepartmentFilter(e.target.value);
                                            setProgramFilter('');
                                            setSectionFilter('');
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                    <select
                                        value={programFilter}
                                        onChange={(e) => {
                                            setProgramFilter(e.target.value);
                                            setSectionFilter('');
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        disabled={!departmentFilter}
                                    >
                                        <option value="">All Programs</option>
                                        {filteredPrograms.map((prog) => (
                                            <option key={prog.id} value={prog.id}>{prog.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        disabled={!programFilter}
                                    >
                                        <option value="">All Sections</option>
                                        {filteredSections.map((sec) => (
                                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracked By</label>
                                    <select
                                        value={trackedByFilter}
                                        onChange={(e) => setTrackedByFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">All Users</option>
                                        {trackedByUsers.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Second Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="completed">Completed</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="no_answer">No Answer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                                    <input
                                        type="date"
                                        value={dateFromFilter}
                                        onChange={(e) => setDateFromFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                                    <input
                                        type="date"
                                        value={dateToFilter}
                                        onChange={(e) => setDateToFilter(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>

                            {/* Third Row - Search */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        placeholder="Search by student name, number, notes, outcome, or tracked by..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Records */}
                    <div className="overflow-x-auto print-section">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracked By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTracking.length > 0 ? (
                                    paginatedTracking.map((tracking) => (
                                        <tr key={tracking.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(tracking.type)}
                                                    <span className="text-sm text-gray-900 capitalize">
                                                        {tracking.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{tracking.student.name}</div>
                                                <div className="text-sm text-gray-500">{tracking.student.section}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{new Date(tracking.date).toLocaleDateString()}</div>
                                                {tracking.time && <div>{tracking.time}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tracking.status)}`}>
                                                    {tracking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {tracking.tracked_by}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="max-w-xs truncate">{tracking.notes || '-'}</div>
                                                {tracking.outcome && (
                                                    <div className="max-w-xs truncate text-xs text-gray-400 mt-1">
                                                        Outcome: {tracking.outcome}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleView(tracking.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {activeTab === 'active' && (
                                                        <button
                                                            onClick={() => handleArchive(tracking.id)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Archive"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {activeTab === 'archived' && (
                                                        <button
                                                            onClick={() => handleUnarchive(tracking.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Unarchive"
                                                        >
                                                            <ArchiveRestore className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No tracking records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, recentTracking.length)} of {recentTracking.length} records
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    currentPage === pageNum
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
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
