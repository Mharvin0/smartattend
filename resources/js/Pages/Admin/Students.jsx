import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { Users, Eye, X, Mail, GraduationCap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Students({ students = [], departments = [], programs = [], sections = [], statuses = [], priorities = [], stats = {}, filters = {} }) {
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
        section_id: '',
        year_level: '',
        gender: '',
        birth_date: '',
        guardian_name: '',
        guardian_contact: ''
    });

    // Filter programs by department
    const filteredPrograms = selectedDepartment 
        ? programs.filter(p => p.department_id == selectedDepartment)
        : programs;

    // Filter students client-side - matching System Admin structure
    const filteredStudents = students.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment || student.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram || student.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel || student.section?.year_level == selectedYearLevel;
        const matchesStatus = !selectedStatus || student.attendance_status == selectedStatus;
        const matchesSearch = !searchTerm || 
            (student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesStatus && matchesSearch;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedDepartment('');
        setSelectedProgram('');
        setSelectedYearLevel('');
        setSelectedStatus('');
    };

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
                    section_id: '',
                    year_level: '',
                    gender: '',
                    birth_date: '',
                    guardian_name: '',
                    guardian_contact: ''
                });
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Normal':
                return <CheckCircle className="h-4 w-4" />;
            case 'SLIP':
                return <Clock className="h-4 w-4" />;
            case 'PNS':
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <CheckCircle className="h-4 w-4" />;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/70 py-8">
                <div className="w-full px-6 py-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    Student Management
                                </h1>
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
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    <Users className="h-4 w-4 mr-2" />
                                    {students.length} Students
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total_students || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Normal</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.normal_count || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">SLIP</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.slip_count || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Probable No-Show</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.pns_count || 0}</p>
                                </div>
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

                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={!selectedDepartment && !selectedProgram && !selectedYearLevel && !selectedStatus && !searchTerm}
                        >
                            Clear Filters
                        </button>
                        <div className="text-sm text-gray-500">
                            Showing {filteredStudents.length} of {students.length} students
                        </div>
                    </div>
                </div>

                    {/* Students List */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Section
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Program
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Year Level
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Absences
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.student_id || student.student_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.name || `${student.first_name} ${student.last_name}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.section?.name || (typeof student.section === 'string' ? student.section : 'N/A')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.section?.program?.name || (typeof student.program === 'string' ? student.program : 'N/A')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {student.year_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
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
                                                        {getStatusIcon(student.attendance_status)}
                                                        <span className="ml-1">
                                                            {student.attendance_status === 'PNS' ? 'Probable No-Show' : student.attendance_status}
                                                        </span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.absence_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewStudent(student)}
                                                        className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                                                    >
                                                        <Eye className="h-4 w-4 inline mr-1" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
                                                                // Use direct URL to avoid Ziggy route errors
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
                                                        className="text-red-600 hover:text-red-900 font-medium flex items-center"
                                                    >
                                                        <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Details Modal */}
            {showStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {selectedStudent.name ? selectedStudent.name.split(' ').map(n => n[0]).join('') : 'S'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedStudent.name}
                                        </h2>
                                        <p className="text-gray-600">{selectedStudent.student_id}</p>
                                        <p className="text-sm text-gray-500">
                                            {selectedStudent.section?.name || (typeof selectedStudent.section === 'string' ? selectedStudent.section : 'No Section')} - {selectedStudent.section?.program?.name || (typeof selectedStudent.program === 'string' ? selectedStudent.program : 'No Program')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeStudentModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Student Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Mail className="h-5 w-5 text-blue-600 mr-2" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                                        <p><span className="font-medium">Phone:</span> Not provided</p>
                                        <p><span className="font-medium">Address:</span> Not provided</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <GraduationCap className="h-5 w-5 text-green-600 mr-2" />
                                        Academic Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Student ID:</span> {selectedStudent.student_id}</p>
                                        <p><span className="font-medium">Section:</span> {selectedStudent.section?.name || (typeof selectedStudent.section === 'string' ? selectedStudent.section : 'N/A')}</p>
                                        <p><span className="font-medium">Program:</span> {selectedStudent.section?.program?.name || (typeof selectedStudent.program === 'string' ? selectedStudent.program : 'N/A')}</p>
                                        <p><span className="font-medium">Department:</span> {selectedStudent.section?.program?.department?.name || (typeof selectedStudent.department === 'string' ? selectedStudent.department : 'N/A')}</p>
                                        <p><span className="font-medium">Year Level:</span> {selectedStudent.year_level}</p>
                                        <p><span className="font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.status === 'Active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedStudent.status}
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.attendance_status === 'Normal'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedStudent.attendance_status === 'SLIP'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {getStatusIcon(selectedStudent.attendance_status)}
                                                <span className="ml-1">{selectedStudent.attendance_status || 'Normal'}</span>
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Priority:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedStudent.priority === 'Safe'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedStudent.priority === 'Call Needed'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {getStatusIcon(selectedStudent.priority === 'Safe' ? 'Normal' : selectedStudent.priority === 'Call Needed' ? 'SLIP' : 'PNS')}
                                                <span className="ml-1">{selectedStudent.priority}</span>
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Absence Count:</span> {selectedStudent.absence_count || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Alert */}
                            {selectedStudent.attendance_status && selectedStudent.attendance_status !== 'Normal' && (
                                <div className={`mb-8 p-6 rounded-2xl ${
                                    selectedStudent.attendance_status === 'SLIP' 
                                        ? 'bg-yellow-50 border border-yellow-200' 
                                        : 'bg-red-50 border border-red-200'
                                }`}>
                                    <div className="flex items-center">
                                        {getStatusIcon(selectedStudent.attendance_status)}
                                        <div className="ml-3">
                                            <h3 className={`text-lg font-semibold ${
                                                selectedStudent.attendance_status === 'SLIP' ? 'text-yellow-800' : 'text-red-800'
                                            }`}>
                                                {selectedStudent.attendance_status === 'SLIP' ? 'Action Required' : 'Immediate Attention Required'}
                                            </h3>
                                            <p className={`text-sm ${
                                                selectedStudent.attendance_status === 'SLIP' ? 'text-yellow-700' : 'text-red-700'
                                            }`}>
                                                {selectedStudent.attendance_status === 'SLIP' 
                                                    ? 'This student has more than 50% absences this week and requires attention.'
                                                    : 'This student has no attendance at all (Probable No-Show - PNS).'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
                                <button
                                    onClick={() => setShowAddStudentModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.first_name}
                                            onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.last_name}
                                            onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.student_number}
                                            onChange={(e) => setStudentForm({...studentForm, student_number: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={studentForm.email}
                                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                        <select
                                            required
                                            value={studentForm.section_id}
                                            onChange={(e) => setStudentForm({...studentForm, section_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Section</option>
                                            {sections.map(section => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                        <select
                                            required
                                            value={studentForm.year_level}
                                            onChange={(e) => setStudentForm({...studentForm, year_level: e.target.value})}
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
                                            onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
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
                                            onChange={(e) => setStudentForm({...studentForm, birth_date: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                                    <input
                                        type="text"
                                        value={studentForm.guardian_name}
                                        onChange={(e) => setStudentForm({...studentForm, guardian_name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                                    <input
                                        type="text"
                                        value={studentForm.guardian_contact}
                                        onChange={(e) => setStudentForm({...studentForm, guardian_contact: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <SecondaryButton type="button" onClick={() => setShowAddStudentModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Import Students</h2>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleImportStudents} className="space-y-4">
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
        </AuthenticatedLayout>
    );
}
