import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import { Download } from 'lucide-react';

export default function Students({ students = [], departments = [], programs = [], sections = [], statuses = [], priorities = [], stats = {}, filters = {} }) {
    const studentsData = Array.isArray(students) ? students : (students?.data || []);
    const studentsMeta = Array.isArray(students) ? null : students?.meta;
    const studentsLinks = Array.isArray(students) ? [] : (students?.links || []);
    const { flash = {} } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program || '');
    const [selectedYearLevel, setSelectedYearLevel] = useState(filters.year_level || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importType, setImportType] = useState('csv');
    const [studentForm, setStudentForm] = useState({
        first_name: '',
        last_name: '',
        student_number: '',
        email: '',
        phone: '',
        section_id: '',
        year_level: '',
        gender: '',
        birth_date: '',
        guardian_name: '',
        guardian_contact: ''
    });
    const [studentFormErrors, setStudentFormErrors] = useState({});
    const [showSendToCSDLModal, setShowSendToCSDLModal] = useState(false);
    const [selectedStudentForCSDL, setSelectedStudentForCSDL] = useState(null);
    const [csdlForm, setCsdlForm] = useState({
        type: 'call',
        notes: ''
    });

    // Filter programs by department
    const filteredPrograms = selectedDepartment 
        ? programs.filter(p => p.department_id == selectedDepartment)
        : programs;

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedDepartment('');
        setSelectedProgram('');
        setSelectedYearLevel('');
        setSelectedStatus('');
        router.get(route('admin.students'), {}, { preserveState: true, replace: true, preserveScroll: true });
    };

    const applyFilters = () => {
        const query = {
            department: selectedDepartment || undefined,
            program: selectedProgram || undefined,
            year_level: selectedYearLevel || undefined,
            status: selectedStatus || undefined,
            search: searchTerm || undefined,
        };
        router.get(route('admin.students'), query, { preserveState: true, replace: true, preserveScroll: true });
    };

    const normalizeEmail = (value) => (value ?? '').toString().trim().toLowerCase();
    const normalizeStudentNumber = (value) => (
        (value ?? '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[-\s]/g, '')
    );
    const duplicateStudentNumber = studentsData.find((student) => (
        normalizeStudentNumber(student.student_number || student.student_id) === normalizeStudentNumber(studentForm.student_number)
    ));
    const duplicateStudentEmail = studentsData.find((student) => (
        normalizeEmail(student.email) && normalizeEmail(student.email) === normalizeEmail(studentForm.email)
    ));
    const totalStudents = studentsMeta?.total ?? studentsData.length;
    const showingFrom = studentsMeta?.from ?? (studentsData.length ? 1 : 0);
    const showingTo = studentsMeta?.to ?? studentsData.length;
    const formatPaginationLabel = (label) => (
        String(label)
            .replace(/&laquo;|&raquo;/g, '')
            .replace(/<[^>]+>/g, '')
            .trim()
    );

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    const closeStudentModal = () => {
        setShowStudentModal(false);
        setSelectedStudent(null);
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(route('admin.students.store'), studentForm, {
            onSuccess: () => {
                setShowAddStudentModal(false);
                setStudentForm({
                    first_name: '',
                    last_name: '',
                    student_number: '',
                    email: '',
                    phone: '',
                    section_id: '',
                    year_level: '',
                    gender: '',
                    birth_date: '',
                    guardian_name: '',
                    guardian_contact: ''
                });
                setStudentFormErrors({});
                router.reload();
            },
            onError: (errors) => {
                const fieldErrors = {};
                if (errors && typeof errors === 'object') {
                    Object.keys(errors).forEach((key) => {
                        if (Array.isArray(errors[key]) && errors[key].length > 0) {
                            fieldErrors[key] = errors[key][0];
                        } else if (typeof errors[key] === 'string') {
                            fieldErrors[key] = errors[key];
                        }
                    });
                }
                setStudentFormErrors(fieldErrors);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleImportStudents = async (e) => {
        e.preventDefault();
        if (!importFile) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('type', importType);
        
        router.post(route('admin.students.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                setImportFile(null);
                router.reload();
            },
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleExportStudents = () => {
        const studentsToExport = studentsData?.length ? studentsData : [];

        const printRootId = 'admin-students-print-root';
        const styleId = 'admin-students-print-style';

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
                    font-size: 12px !important;
                }
                #${printRootId} thead { display: table-header-group !important; }
                #${printRootId} tbody { display: table-row-group !important; }
                #${printRootId} tr { display: table-row !important; page-break-inside: avoid; }
                #${printRootId} th, #${printRootId} td {
                    display: table-cell !important;
                    border: 1px solid #000 !important;
                    padding: 6px 8px !important;
                    text-align: left !important;
                    vertical-align: top !important;
                    word-break: break-word !important;
                }
                #${printRootId} th {
                    background: #f3f4f6 !important;
                    font-weight: 700 !important;
                    text-align: center !important;
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
        title.textContent = 'Admin Students Export';
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';

        const meta = document.createElement('div');
        meta.textContent = `Generated: ${new Date().toLocaleString()} • Students: ${studentsToExport?.length || 0}`;
        meta.style.fontSize = '12px';
        meta.style.color = '#374151';

        heading.appendChild(title);
        heading.appendChild(meta);
        root.appendChild(heading);

        const table = document.createElement('table');

        const colgroup = document.createElement('colgroup');
        // Student ID, Name, Email, Phone, Section, Program, Department, Year, Status, Absences
        const colWidths = ['10%', '14%', '16%', '8%', '9%', '11%', '11%', '7%', '7%', '7%'];
        colWidths.forEach((w) => {
            const col = document.createElement('col');
            col.style.width = w;
            colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        ['Student ID', 'Name', 'Email', 'Phone', 'Section', 'Program', 'Department', 'Year', 'Status', 'Absences'].forEach((label) => {
            const th = document.createElement('th');
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        (studentsToExport || []).forEach((student) => {
            const tr = document.createElement('tr');

            const absenceCount = (() => {
                if ((student.attendance_status === 'PNS' || student.status === 'PNS') && (!student.absence_count || student.absence_count === 0)) {
                    return 8;
                }
                if ((student.attendance_status === 'SLIP' || student.status === 'SLIP') && (!student.absence_count || student.absence_count === 0)) {
                    return 4;
                }
                return student.absence_count || 0;
            })();

            const values = [
                student.student_id || student.student_number || '',
                student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
                student.email || 'N/A',
                student.phone || 'N/A',
                student.section?.name || (typeof student.section === 'string' ? student.section : 'N/A'),
                student.section?.program?.name || (typeof student.program === 'string' ? student.program : 'N/A'),
                student.department?.name || student.section?.program?.department?.name || 'N/A',
                student.year_level || 'N/A',
                student.attendance_status === 'PNS' ? 'Probable No-Show' : (student.attendance_status || 'N/A'),
                absenceCount,
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
            <Head title="Student Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {flash.success && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash.error && (
                        <div className="pointer-events-none fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg animate-[fade-in_0.2s_ease-out_forwards]">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>{flash.error}</span>
                        </div>
                    )}
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    Student
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Manage and monitor student priorities and attendance
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium flex items-center"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Student
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium flex items-center"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Import Students
                                </button>
                                <button
                                    onClick={() => handleExportStudents()}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold flex items-center focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </button>
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {totalStudents} Students
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Search (Name or Student No.)</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="e.g. Juan Dela Cruz or 2020-00001"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => {
                                        setSelectedDepartment(e.target.value);
                                        setSelectedProgram('');
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Program Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Program</label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled={!selectedDepartment}
                                >
                                    <option value="">All Programs</option>
                                    {filteredPrograms.map(program => (
                                        <option key={program.id} value={program.id}>{program.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Level Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year Level</label>
                                <select
                                    value={selectedYearLevel}
                                    onChange={(e) => setSelectedYearLevel(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">All Year Levels</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="Normal">Normal</option>
                                    <option value="SLIP">SLIP</option>
                                    <option value="PNS">Probable No-Show (PNS)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={!selectedDepartment && !selectedProgram && !selectedYearLevel && !selectedStatus && !searchTerm}
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={applyFilters}
                            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Apply Filters
                        </button>
                        <div className="text-sm text-gray-500">
                            Showing {showingFrom}-{showingTo} of {totalStudents} students
                        </div>
                    </div>
                </div>

                    {/* Students List */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto flex-1 table-scroll print-section" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                            <div className="inline-block min-w-full align-middle">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Student ID
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Phone
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Section
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Program
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Department
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Year Level
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                                                    Absences
                                                </th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                    {studentsData.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="px-6 py-12 text-center text-sm text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    <p className="text-lg font-medium text-gray-900">No students found</p>
                                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        studentsData.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {student.student_id || student.student_number}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="font-medium">{student.name || `${student.first_name} ${student.last_name}`}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="max-w-xs truncate" title={student.email || 'N/A'}>
                                                        {student.email || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.phone || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.section?.name || (typeof student.section === 'string' ? student.section : 'N/A')}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="max-w-xs truncate" title={student.section?.program?.name || (typeof student.program === 'string' ? student.program : 'N/A')}>
                                                        {student.section?.program?.name || (typeof student.program === 'string' ? student.program : 'N/A')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.department?.name || student.section?.program?.department?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {student.year_level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {student.attendance_status && (
                                                        <span 
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                student.attendance_status === 'Normal'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : student.attendance_status === 'SLIP'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                            title={student.attendance_status === 'PNS' ? 'Probable No-Show: No attendance at all' : ''}
                                                        >
                                                            {student.attendance_status === 'PNS' ? 'Probable No-Show' : student.attendance_status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    <span className="font-medium">
                                                        {(() => {
                                                            // For PNS students, if absence_count is 0 or null, show at least 8
                                                            if ((student.attendance_status === 'PNS' || student.status === 'PNS') && (!student.absence_count || student.absence_count === 0)) {
                                                                return 8;
                                                            }
                                                            // For SLIP students, if absence_count is 0 or null, show at least 4
                                                            if ((student.attendance_status === 'SLIP' || student.status === 'SLIP') && (!student.absence_count || student.absence_count === 0)) {
                                                                return 4;
                                                            }
                                                            // Otherwise, show the actual absence_count or 0
                                                            return student.absence_count || 0;
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white hover:bg-gray-50">
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setShowStudentModal(true);
                                                            }}
                                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                                            title="View Details"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudentForCSDL(student);
                                                                setShowSendToCSDLModal(true);
                                                            }}
                                                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors duration-150"
                                                            title="Send to CSDL"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
                                                                    router.delete(`/admin/students/${student.id}`, {
                                                                        onSuccess: () => {
                                                                            router.reload();
                                                                        },
                                                                        onError: (errors) => {
                                                                            alert('Failed to delete student: ' + (errors.message || 'Unknown error'));
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150"
                                                            title="Delete Student"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {studentsLinks.length > 0 && (
                            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-gray-500">
                                    Page {studentsMeta?.current_page || 1} of {studentsMeta?.last_page || 1}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {studentsLinks.map((link, index) => {
                                        const label = formatPaginationLabel(link.label);
                                        return (
                                            <button
                                                key={`${label}-${index}`}
                                                type="button"
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.get(link.url, {}, { preserveState: true, replace: true, preserveScroll: true });
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {label || '...'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Details Modal */}
            {showStudentModal && selectedStudent && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeStudentModal();
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedStudent.first_name} {selectedStudent.last_name}
                                        </h2>
                                        <p className="text-gray-600">{selectedStudent.student_number || selectedStudent.student_id}</p>
                                        <p className="text-sm text-gray-500">
                                            {selectedStudent.section?.name || 'No Section'} - {selectedStudent.section?.program?.name || 'No Program'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowStudentModal(false);
                                        setSelectedStudent(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Student Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Email:</span> {selectedStudent.email || 'N/A'}</p>
                                        <p><span className="font-medium">Phone:</span> {selectedStudent.phone || 'N/A'}</p>
                                        <p><span className="font-medium">Guardian:</span> {selectedStudent.guardian_name || 'N/A'}</p>
                                        <p><span className="font-medium">Guardian Contact:</span> {selectedStudent.guardian_contact || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        </svg>
                                        Academic Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Student ID:</span> {selectedStudent.student_number || selectedStudent.student_id}</p>
                                        <p><span className="font-medium">Section:</span> {selectedStudent.section?.name || 'N/A'}</p>
                                        <p><span className="font-medium">Program:</span> {selectedStudent.section?.program?.name || 'N/A'}</p>
                                        <p><span className="font-medium">Department:</span> {selectedStudent.section?.program?.department?.name || 'N/A'}</p>
                                        <p><span className="font-medium">Year Level:</span> {selectedStudent.year_level || 'N/A'}</p>
                                        <p><span className="font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.attendance_status === 'Normal'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedStudent.attendance_status === 'SLIP'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedStudent.attendance_status || 'Normal'}
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Absence Count:</span> {
                                            (() => {
                                                // For PNS students, if absence_count is 0 or null, show at least 8
                                                if ((selectedStudent.attendance_status === 'PNS' || selectedStudent.status === 'PNS') && (!selectedStudent.absence_count || selectedStudent.absence_count === 0)) {
                                                    return 8;
                                                }
                                                // For SLIP students, if absence_count is 0 or null, show at least 4
                                                if ((selectedStudent.attendance_status === 'SLIP' || selectedStudent.status === 'SLIP') && (!selectedStudent.absence_count || selectedStudent.absence_count === 0)) {
                                                    return 4;
                                                }
                                                // Otherwise, show the actual absence_count or 0
                                                return selectedStudent.absence_count || 0;
                                            })()
                                        }</p>
                                    </div>
                                </div>
                            </div>


                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3">
                                <SecondaryButton onClick={closeStudentModal}>
                                    Close
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddStudentModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAddStudentModal(false);
                            setStudentFormErrors({});
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
                                <button
                                    onClick={() => {
                                        setShowAddStudentModal(false);
                                        setStudentFormErrors({});
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                {(duplicateStudentNumber || duplicateStudentEmail) && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        <div className="font-semibold">Student already exists</div>
                                        {duplicateStudentNumber && (
                                            <div className="mt-1">Student number matches an existing student.</div>
                                        )}
                                        {duplicateStudentEmail && (
                                            <div className="mt-1">Email matches an existing student.</div>
                                        )}
                                    </div>
                                )}
                                {(studentFormErrors.student_number || studentFormErrors.email) && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Duplicate entry detected. Please use a unique student number and email.
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.first_name}
                                            onChange={(e) => {
                                                if (studentFormErrors.first_name) {
                                                    setStudentFormErrors({ ...studentFormErrors, first_name: null });
                                                }
                                                setStudentForm({...studentForm, first_name: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <InputError message={studentFormErrors.first_name} className="mt-1" />
                                    </div>
                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.last_name}
                                            onChange={(e) => {
                                                if (studentFormErrors.last_name) {
                                                    setStudentFormErrors({ ...studentFormErrors, last_name: null });
                                                }
                                                setStudentForm({...studentForm, last_name: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <InputError message={studentFormErrors.last_name} className="mt-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                                        <input
                                            type="text"
                                            required
                                            inputMode="numeric"
                                            pattern="[0-9-]+"
                                            value={studentForm.student_number}
                                            onChange={(e) => {
                                                const sanitized = e.target.value.replace(/[^0-9-]/g, '');
                                                if (studentFormErrors.student_number) {
                                                    setStudentFormErrors({ ...studentFormErrors, student_number: null });
                                                }
                                                setStudentForm({...studentForm, student_number: sanitized});
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${studentFormErrors.student_number ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        <InputError message={studentFormErrors.student_number} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={studentForm.email}
                                            onChange={(e) => {
                                                if (studentFormErrors.email) {
                                                    setStudentFormErrors({ ...studentFormErrors, email: null });
                                                }
                                                setStudentForm({...studentForm, email: e.target.value});
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${studentFormErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        <InputError message={studentFormErrors.email} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{11}"
                                        maxLength={11}
                                        value={studentForm.phone}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                            if (studentFormErrors.phone) {
                                                setStudentFormErrors({ ...studentFormErrors, phone: null });
                                            }
                                            setStudentForm({...studentForm, phone: sanitized});
                                        }}
                                        placeholder="e.g. 09123456789"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <InputError message={studentFormErrors.phone} className="mt-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                        <select
                                            value={studentForm.section_id}
                                            onChange={(e) => {
                                                if (studentFormErrors.section_id) {
                                                    setStudentFormErrors({ ...studentFormErrors, section_id: null });
                                                }
                                                setStudentForm({...studentForm, section_id: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Section</option>
                                            {sections.map(section => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                        <select
                                            value={studentForm.year_level}
                                            onChange={(e) => {
                                                if (studentFormErrors.year_level) {
                                                    setStudentFormErrors({ ...studentFormErrors, year_level: null });
                                                }
                                                setStudentForm({...studentForm, year_level: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={studentForm.gender}
                                            onChange={(e) => {
                                                if (studentFormErrors.gender) {
                                                    setStudentFormErrors({ ...studentFormErrors, gender: null });
                                                }
                                                setStudentForm({...studentForm, gender: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                                        <input
                                            type="date"
                                            value={studentForm.birth_date}
                                            onChange={(e) => {
                                                if (studentFormErrors.birth_date) {
                                                    setStudentFormErrors({ ...studentFormErrors, birth_date: null });
                                                }
                                                setStudentForm({...studentForm, birth_date: e.target.value});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <InputError message={studentFormErrors.birth_date} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                                    <input
                                        type="text"
                                        value={studentForm.guardian_name}
                                        onChange={(e) => {
                                            if (studentFormErrors.guardian_name) {
                                                setStudentFormErrors({ ...studentFormErrors, guardian_name: null });
                                            }
                                            setStudentForm({...studentForm, guardian_name: e.target.value});
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <InputError message={studentFormErrors.guardian_name} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{11}"
                                        maxLength={11}
                                        value={studentForm.guardian_contact}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                            if (studentFormErrors.guardian_contact) {
                                                setStudentFormErrors({ ...studentFormErrors, guardian_contact: null });
                                            }
                                            setStudentForm({...studentForm, guardian_contact: sanitized});
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <InputError message={studentFormErrors.guardian_contact} className="mt-1" />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <SecondaryButton type="button" onClick={() => setShowAddStudentModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || duplicateStudentNumber || duplicateStudentEmail}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Students Modal */}
            {showImportModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowImportModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Import Students</h2>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleImportStudents} className="space-y-4">
                                {Array.isArray(flash.import_errors) && flash.import_errors.length > 0 && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        <div className="font-semibold">Some rows failed to import</div>
                                        <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">
                                            {flash.import_errors.map((error, index) => (
                                                <li key={`${error}-${index}`}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                                    <select
                                        value={importType}
                                        onChange={(e) => setImportType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="xml">XML</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                                    <input
                                        type="file"
                                        required
                                        accept={importType === 'csv' ? '.csv' : '.xml'}
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        {importType === 'csv' 
                                            ? 'CSV format: first_name, last_name, student_number, email, section_id, year_level'
                                            : 'XML format: Follow the standard student import structure'
                                        }
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <SecondaryButton type="button" onClick={() => setShowImportModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !importFile}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Importing...' : 'Import Students'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Students Modal - Removed, using print instead */}
            {false && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowExportModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Export Students</h2>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleExportStudents} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="xml">XML</option>
                                    </select>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">
                                        {selectedDepartment || selectedProgram || selectedYearLevel || selectedStatus
                                            ? 'Export will include only filtered students based on your current filters.'
                                            : 'Export will include all students.'}
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowExportModal(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Exporting...' : 'Export Students'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Send to CSDL Modal */}
            {showSendToCSDLModal && selectedStudentForCSDL && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowSendToCSDLModal(false);
                            setSelectedStudentForCSDL(null);
                            setCsdlForm({ type: 'call', notes: '' });
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Send to CSDL</h2>
                                <button
                                    onClick={() => {
                                        setShowSendToCSDLModal(false);
                                        setSelectedStudentForCSDL(null);
                                        setCsdlForm({ type: 'call', notes: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Student: <span className="font-semibold">{selectedStudentForCSDL.first_name} {selectedStudentForCSDL.last_name}</span>
                                </p>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                router.post(route('admin.students.send-to-csdl', selectedStudentForCSDL.id), csdlForm, {
                                    onSuccess: () => {
                                        setShowSendToCSDLModal(false);
                                        setSelectedStudentForCSDL(null);
                                        setCsdlForm({ type: 'call', notes: '' });
                                        router.reload();
                                    },
                                    onError: () => {
                                        alert('Failed to send student to CSDL');
                                    }
                                });
                            }}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                                    <select
                                        required
                                        value={csdlForm.type}
                                        onChange={(e) => setCsdlForm({...csdlForm, type: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="call">Call</option>
                                        <option value="home_visit">Home Visit</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={csdlForm.notes}
                                        onChange={(e) => setCsdlForm({...csdlForm, notes: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional notes for CSDL..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => {
                                            setShowSendToCSDLModal(false);
                                            setSelectedStudentForCSDL(null);
                                            setCsdlForm({ type: 'call', notes: '' });
                                        }}
                                    >
                                        Cancel
                                    </SecondaryButton>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                    >
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send to CSDL
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
