import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AdminPage() {
    const { sections, students, subjects, schedules, todayStats, attendanceRate, recentRecords } = usePage().props;
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedSectionForAttendance, setSelectedSectionForAttendance] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showBulkOperations, setShowBulkOperations] = useState(false);
    const [showCommunication, setShowCommunication] = useState(false);

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter students based on selections
    const filteredStudents = students?.filter(student => {
        const matchesSection = !selectedSection || student.section_id == selectedSection;
        const matchesSubject = !selectedSubject || student.subjects?.some(subject => subject.id == selectedSubject);
        const matchesTeacher = !selectedTeacher || student.subjects?.some(subject => subject.teacher_id == selectedTeacher);
        const matchesSearch = !searchTerm || 
            student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSection && matchesSubject && matchesTeacher && matchesSearch;
    }) || [];

    // Handle student record view
    const handleViewStudentRecords = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    // Handle quick attendance marking
    const handleQuickAttendance = (sectionId) => {
        setSelectedSectionForAttendance(sectionId);
        setShowAttendanceModal(true);
    };

    // Handle attendance record update
    const handleAttendanceUpdate = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    // Save attendance records
    const saveAttendanceRecords = () => {
        // Implementation for saving attendance records
        console.log('Saving attendance records:', attendanceRecords);
        setShowAttendanceModal(false);
        setAttendanceRecords({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-emerald-50/80 to-brand-secondary/5">
            <Head title="Admin Dashboard" />
            
            {/* Header */}
            <header className="bg-gradient-to-r from-brand-secondary to-yellow-400 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img 
                                src="/images/smartattend-logo-modern.svg" 
                                alt="SmartAttend" 
                                className="h-12 w-12"
                            />
                            <div>
                                <h1 className="text-3xl font-bold text-brand-primary">SmartAttend</h1>
                                <p className="text-sm text-brand-primary/80">Attendance Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowAttendanceModal(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    Quick Attendance
                                </button>
                                <button
                                    onClick={() => setShowAnalytics(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Analytics
                                </button>
                                <button
                                    onClick={() => setShowReports(true)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    Reports
                                </button>
                                <button
                                    onClick={() => setShowBulkOperations(true)}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                >
                                    Bulk Ops
                                </button>
                            </div>
                            <div className="text-right">
                                <div className="text-brand-primary font-semibold">Admin Dashboard</div>
                                <div className="text-sm text-brand-primary/80">
                                    {currentTime.toLocaleTimeString()} - {currentTime.toLocaleDateString()}
                                </div>
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors"
                            >
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Real-Time Dashboard */}
                <section className="mb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-900">Live Dashboard</h2>
                            <div className="flex items-center space-x-2 text-green-600">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">Live</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Today's Attendance */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Today's Attendance</p>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {todayStats?.present || 0} / {todayStats?.total || 0}
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            {attendanceRate || 0}% Rate
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Absent Students */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-600">Absent Today</p>
                                        <p className="text-2xl font-bold text-red-900">{todayStats?.absent || 0}</p>
                                        <p className="text-xs text-red-600">Students</p>
                                    </div>
                                    <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Late Students */}
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-600">Late Today</p>
                                        <p className="text-2xl font-bold text-yellow-900">{todayStats?.late || 0}</p>
                                        <p className="text-xs text-yellow-600">Students</p>
                                    </div>
                                    <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Active Sections */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600">Active Sections</p>
                                        <p className="text-2xl font-bold text-green-900">{sections?.length || 0}</p>
                                        <p className="text-xs text-green-600">Today</p>
                                    </div>
                                    <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Recent Activity */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {recentRecords?.slice(0, 5).map((record, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className={`w-3 h-3 rounded-full ${
                                            record.status === 'present' ? 'bg-green-500' :
                                            record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {record.student?.first_name} {record.student?.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {record.student?.section?.name} • {record.status} • {record.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Attendance Management Section */}
                <section className="mb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Attendance Management</h2>
                        
                        {/* Filter Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Section</label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Sections</option>
                                    {sections?.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name} - {section.program}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Subjects</option>
                                    {subjects?.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Teacher</label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Teachers</option>
                                    {subjects?.map(subject => (
                                        <option key={subject.teacher_id} value={subject.teacher_id}>
                                            {subject.teacher_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or student number..."
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                />
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-blue-600">Total Students</p>
                                        <p className="text-2xl font-bold text-blue-900">{students?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-green-600">Active Sections</p>
                                        <p className="text-2xl font-bold text-green-900">{sections?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-purple-600">Total Subjects</p>
                                        <p className="text-2xl font-bold text-purple-900">{subjects?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Student Records Table */}
                <section>
                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Student Records</h2>
                            <p className="text-gray-600 mt-2">View and manage student attendance records</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Student Number</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Section</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Program</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-brand-primary rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.student_number}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.section?.name}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.section?.program}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    onClick={() => handleViewStudentRecords(student)}
                                                    className="text-brand-primary hover:text-brand-primary/80 transition-colors"
                                                >
                                                    View Records
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {filteredStudents.length === 0 && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Student Records Modal */}
            {showStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-brand-primary rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedStudent.first_name} {selectedStudent.last_name}
                                        </h2>
                                        <p className="text-gray-600">{selectedStudent.student_number}</p>
                                        <p className="text-sm text-gray-500">{selectedStudent.section?.name} - {selectedStudent.section?.program}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowStudentModal(false)}
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
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                                        <p><span className="font-medium">Phone:</span> {selectedStudent.phone || 'Not provided'}</p>
                                        <p><span className="font-medium">Address:</span> {selectedStudent.address || 'Not provided'}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Section:</span> {selectedStudent.section?.name}</p>
                                        <p><span className="font-medium">Program:</span> {selectedStudent.section?.program}</p>
                                        <p><span className="font-medium">Year Level:</span> {selectedStudent.year_level || 'Not specified'}</p>
                                        <p><span className="font-medium">Status:</span> 
                                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance History */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">85%</div>
                                            <div className="text-sm text-gray-600">Overall Attendance</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">45</div>
                                            <div className="text-sm text-gray-600">Days Present</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">8</div>
                                            <div className="text-sm text-gray-600">Days Absent</div>
                                        </div>
                                    </div>
                                    
                                    {/* Recent Attendance Records */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">Recent Records</h4>
                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <div key={item} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        item % 3 === 0 ? 'bg-red-500' : 
                                                        item % 3 === 1 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item % 3 === 0 ? 'Absent' : 
                                                             item % 3 === 1 ? 'Late' : 'Present'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(Date.now() - item * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item % 3 === 0 ? '9:00 AM' : 
                                                     item % 3 === 1 ? '9:15 AM' : '8:45 AM'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4">
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                    Export Records
                                </button>
                                <button className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors">
                                    Mark Attendance
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Attendance Modal */}
            {showAttendanceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Quick Attendance Marking</h2>
                                <button
                                    onClick={() => setShowAttendanceModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Section Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Section</label>
                                <select
                                    value={selectedSectionForAttendance}
                                    onChange={(e) => setSelectedSectionForAttendance(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">Choose a section...</option>
                                    {sections?.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name} - {section.program}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Student List for Attendance */}
                            {selectedSectionForAttendance && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                                    <div className="grid gap-4">
                                        {students?.filter(student => student.section_id == selectedSectionForAttendance).map(student => (
                                            <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 bg-brand-primary rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{student.student_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleAttendanceUpdate(student.id, 'present')}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            attendanceRecords[student.id] === 'present'
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceUpdate(student.id, 'late')}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            attendanceRecords[student.id] === 'late'
                                                                ? 'bg-yellow-600 text-white'
                                                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                        }`}
                                                    >
                                                        Late
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceUpdate(student.id, 'absent')}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            attendanceRecords[student.id] === 'absent'
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 mt-8">
                                <button
                                    onClick={() => setShowAttendanceModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveAttendanceRecords}
                                    className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                                >
                                    Save Attendance
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Modal */}
            {showAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Attendance Analytics</h2>
                                <button
                                    onClick={() => setShowAnalytics(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Analytics Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Section</h3>
                                    <div className="space-y-3">
                                        {sections?.map(section => (
                                            <div key={section.id} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{section.name}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">85%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h3>
                                    <div className="space-y-3">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                                            <div key={day} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{day}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-blue-500 h-2 rounded-full" style={{width: `${80 + index * 2}%`}}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{80 + index * 2}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Modal */}
            {showReports && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Generate Reports</h2>
                                <button
                                    onClick={() => setShowReports(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Reports</h3>
                                    <div className="space-y-3">
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Today's Attendance</div>
                                            <div className="text-sm text-gray-500">Current day attendance summary</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Absent Students</div>
                                            <div className="text-sm text-gray-500">List of absent students today</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Reports</h3>
                                    <div className="space-y-3">
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Weekly Summary</div>
                                            <div className="text-sm text-gray-500">7-day attendance overview</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Section Performance</div>
                                            <div className="text-sm text-gray-500">Attendance by section</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-8">
                                <button
                                    onClick={() => setShowReports(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Operations Modal */}
            {showBulkOperations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
                                <button
                                    onClick={() => setShowBulkOperations(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Operations</h3>
                                    <div className="space-y-3">
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Bulk Attendance Update</div>
                                            <div className="text-sm text-gray-500">Update multiple students at once</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Mass Email Notifications</div>
                                            <div className="text-sm text-gray-500">Send emails to selected students</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Operations</h3>
                                    <div className="space-y-3">
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Import Student Data</div>
                                            <div className="text-sm text-gray-500">Upload CSV file with student information</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="font-medium text-gray-900">Export Attendance Data</div>
                                            <div className="text-sm text-gray-500">Download attendance records</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
