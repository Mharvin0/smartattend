import { Head, usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';

export default function AdminPage() {
    const { 
        departments, 
        programs, 
        sections, 
        students, 
        subjects, 
        schedules, 
        todayStats, 
        attendanceRate, 
        recentRecords, 
        analytics 
    } = usePage().props;
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
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
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [interventionStudentSearch, setInterventionStudentSearch] = useState('');
    const [showCommunicationModal, setShowCommunicationModal] = useState(false);
    const [communicationType, setCommunicationType] = useState('students'); // 'students' or 'teachers'
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [liveData, setLiveData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [studentRecordsSearch, setStudentRecordsSearch] = useState('');
    const [selectedStudentRecords, setSelectedStudentRecords] = useState([]);
    const [bulkOperationType, setBulkOperationType] = useState('');
    const [showBulkOperationModal, setShowBulkOperationModal] = useState(false);
    
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportFilters, setExportFilters] = useState({
        department_id: '',
        program_id: '',
        section_id: '',
        year_level: ''
    });
    
    //student Management
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [studentForm, setStudentForm] = useState({
        first_name: '',
        last_name: '',
        student_number: '',
        department_id: '',
        program_id: '',
        year_level: '',
        section_id: '',
        gender: '',
        birth_date: '',
        guardian_name: '',
        guardian_contact: '',
        schedule_ids: []
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchLiveData = useCallback(async () => {
        try {
            const response = await fetch(route('admin.admin-page.live-data'));
            if (response.ok) {
                const data = await response.json();
                setLiveData(data);
            }
        } catch (error) {
            console.error('Failed to fetch live data:', error);
        }
    }, []);

    useEffect(() => {
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 30000);
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    //department
    const filteredPrograms = selectedDepartment 
        ? programs.filter(p => p.department_id == selectedDepartment)
        : programs;

    //program
    const filteredSections = selectedProgram 
        ? sections.filter(s => s.program_id == selectedProgram)
        : sections;

    //section
    const filteredSchedules = selectedSection 
        ? schedules.filter(s => s.section_id == selectedSection)
        : schedules;

    //students
    const filteredInterventionStudents = students?.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesSection = !selectedSection || student.section_id == selectedSection;
        const matchesSearch = !interventionStudentSearch || 
            student.first_name?.toLowerCase().includes(interventionStudentSearch.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(interventionStudentSearch.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(interventionStudentSearch.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesSection && matchesSearch;
    }) || [];

    const filteredTeachers = subjects?.filter(subject => {
        const matchesSearch = !teacherSearch || 
            subject.teacher_name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            subject.name?.toLowerCase().includes(teacherSearch.toLowerCase());
        return matchesSearch;
    }) || [];

    const filteredCommunicationStudents = students?.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesSection = !selectedSection || student.section_id == selectedSection;
        const matchesSearch = !studentSearch || 
            student.first_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(studentSearch.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesSection && matchesSearch;
    }) || [];

    const filteredStudents = students?.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesSection = !selectedSection || student.section_id == selectedSection;
        const matchesSchedule = !selectedSchedule || student.schedules?.some(schedule => schedule.id == selectedSchedule);
        const matchesSubject = !selectedSubject || student.subjects?.some(subject => subject.id == selectedSubject);
        const matchesTeacher = !selectedTeacher || student.subjects?.some(subject => subject.teacher_id == selectedTeacher);
        const matchesSearch = !searchTerm || 
            student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesSection && 
               matchesSchedule && matchesSubject && matchesTeacher && matchesSearch;
    }) || [];

    const filteredStudentRecords = students?.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesSection = !selectedSection || student.section_id == selectedSection;
        const matchesSearch = !studentRecordsSearch || 
            student.first_name?.toLowerCase().includes(studentRecordsSearch.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(studentRecordsSearch.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(studentRecordsSearch.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesSection && matchesSearch;
    }) || [];

    const handleViewStudentRecords = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    const handleQuickAttendance = (sectionId) => {
        setSelectedSectionForAttendance(sectionId);
        setShowAttendanceModal(true);
    };

    const handleAttendanceUpdate = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const saveAttendanceRecords = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('admin.admin-page.quick-attendance'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    section_id: selectedSectionForAttendance,
                    schedule_id: selectedSchedule,
                    date: new Date().toISOString().split('T')[0],
                    records: Object.entries(attendanceRecords).map(([studentId, status]) => ({
                        student_id: studentId,
                        status: status,
                        remarks: ''
                    }))
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Attendance recorded successfully for ${data.records_count} students`);
        setShowAttendanceModal(false);
        setAttendanceRecords({});
                fetchLiveData();
            }
        } catch (error) {
            console.error('Failed to save attendance:', error);
            alert('Failed to save attendance records');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateIntervention = async (interventionData) => {
        setIsLoading(true);
        try {
            router.post(route('admin.admin-page.intervention'), interventionData, {
                onSuccess: (page) => {
                    if (page.props.flash?.success) {
                        alert(page.props.flash.success);
                    }
                    setShowInterventionModal(false);
                    fetchLiveData(); 
                },
                onError: (errors) => {
                    console.error('Intervention creation failed:', errors);
                    alert('Failed to create intervention: ' + (errors.message || 'Unknown error'));
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Failed to create intervention:', error);
            alert('Failed to create intervention: ' + error.message);
            setIsLoading(false);
        }
    };

    const handleSendCommunication = async (communicationData) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('admin.admin-page.communication'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(communicationData)
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                setShowCommunication(false);
            }
        } catch (error) {
            console.error('Failed to send communication:', error);
            alert('Failed to send communication');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentSelection = (studentId, isSelected) => {
        if (isSelected) {
            setSelectedStudentRecords(prev => [...prev, studentId]);
        } else {
            setSelectedStudentRecords(prev => prev.filter(id => id !== studentId));
        }
    };

    const handleSelectAllStudents = (isSelected) => {
        if (isSelected) {
            setSelectedStudentRecords(filteredStudentRecords.map(student => student.id));
        } else {
            setSelectedStudentRecords([]);
        }
    };

    const handleBulkOperation = async (operationType, operationData = {}) => {
        if (selectedStudentRecords.length === 0) {
            alert('Please select at least one student to perform bulk operations.');
            return;
        }

        console.log('Bulk operation data:', {
            operation: operationType,
            student_ids: selectedStudentRecords,
            ...operationData
        });

        setIsLoading(true);
        try {
            const response = await fetch(route('admin.admin-page.bulk-operation'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    operation: operationType,
                    student_ids: selectedStudentRecords,
                    ...operationData
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                setSelectedStudentRecords([]);
                setShowBulkOperations(false);
                fetchLiveData();
            } else {
                const errorData = await response.json();
                console.error('Bulk operation failed:', errorData);
                alert(`Bulk operation failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to perform bulk operation:', error);
            alert('Failed to perform bulk operation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportRecords = async () => {
        setIsLoading(true);
        try {
            const isSingleStudentExport = showStudentModal && selectedStudent;
            
            const response = await fetch(route('admin.admin-page.export-records'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    format: exportFormat,
                    ...(isSingleStudentExport ? { student_id: selectedStudent.id } : exportFilters)
                })
            });

            if (response.ok) {
                const contentDisposition = response.headers.get('content-disposition');
                const filename = contentDisposition 
                    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                    : `student_records_${new Date().toISOString().split('T')[0]}.${exportFormat}`;

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setShowExportModal(false);
                alert('Export completed successfully!');
            } else {
                const errorData = await response.json();
                alert(`Export failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportFilterChange = (field, value) => {
        setExportFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            router.post(route('admin.admin-page.student.store'), studentForm, {
                onSuccess: (page) => {
                    if (page.props.flash?.success) {
                        alert(page.props.flash.success);
                    }
                    setShowStudentForm(false);
                    setStudentForm({
                        first_name: '',
                        last_name: '',
                        student_number: '',
                        department_id: '',
                        program_id: '',
                        year_level: '',
                        section_id: '',
                        gender: '',
                        birth_date: '',
                        guardian_name: '',
                        guardian_contact: '',
                        schedule_ids: []
                    });
                    fetchLiveData();
                },
                onError: (errors) => {
                    console.error('Student creation failed:', errors);
                    alert('Failed to create student: ' + (errors.message || 'Unknown error'));
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Failed to create student:', error);
            alert('Failed to create student: ' + error.message);
            setIsLoading(false);
        }
    };

    const handleStudentFormChange = (field, value) => {
        setStudentForm(prev => ({
            ...prev,
            [field]: value
        }));
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
                                as="button"
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
                                            {liveData?.stats?.present || todayStats?.present || 0} / {liveData?.stats?.total || todayStats?.total || 0}
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
                                        <p className="text-2xl font-bold text-red-900">{liveData?.stats?.absent || todayStats?.absent || 0}</p>
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
                                        <p className="text-2xl font-bold text-yellow-900">{liveData?.stats?.late || todayStats?.late || 0}</p>
                                        <p className="text-xs text-yellow-600">Students</p>
                                    </div>
                                    <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Excused Students */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600">Excused Today</p>
                                        <p className="text-2xl font-bold text-purple-900">{liveData?.stats?.excused || todayStats?.excused || 0}</p>
                                        <p className="text-xs text-purple-600">Students</p>
                                    </div>
                                    <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Recent Activity */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {(liveData?.recentActivity || recentRecords?.slice(0, 5)).map((record, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className={`w-3 h-3 rounded-full ${
                                            record.status === 'present' ? 'bg-green-500' :
                                            record.status === 'late' ? 'bg-yellow-500' : 
                                            record.status === 'excused' ? 'bg-purple-500' : 'bg-red-500'
                                        }`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {record.student?.first_name} {record.student?.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {record.student?.section?.name} • {record.status} • {record.time || record.date}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => {
                                        setSelectedDepartment(e.target.value);
                                        setSelectedProgram('');
                                        setSelectedSection('');
                                        setSelectedSchedule('');
                                    }}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Departments</option>
                                    {departments?.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Program</label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => {
                                        setSelectedProgram(e.target.value);
                                        setSelectedSection('');
                                        setSelectedSchedule('');
                                    }}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    disabled={!selectedDepartment}
                                >
                                    <option value="">All Programs</option>
                                    {filteredPrograms?.map(program => (
                                        <option key={program.id} value={program.id}>{program.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
                                <select
                                    value={selectedYearLevel}
                                    onChange={(e) => setSelectedYearLevel(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Year Levels</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => {
                                        setSelectedSection(e.target.value);
                                        setSelectedSchedule('');
                                    }}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    disabled={!selectedProgram}
                                >
                                    <option value="">All Sections</option>
                                    {filteredSections?.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name} - {section.program?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
                                <select
                                    value={selectedSchedule}
                                    onChange={(e) => setSelectedSchedule(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    disabled={!selectedSection}
                                >
                                    <option value="">All Schedules</option>
                                    {filteredSchedules?.map(schedule => (
                                        <option key={schedule.id} value={schedule.id}>
                                            {schedule.subject?.name} - {schedule.day} {schedule.time_start}-{schedule.time_end}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                >
                                    <option value="">All Teachers</option>
                                    {subjects?.filter(subject => subject.teacher_name).map(subject => (
                                        <option key={`teacher-${subject.id}-${subject.teacher_id}`} value={subject.teacher_id}>
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

                {/* Intervention Management Section */}
                <section className="mb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Intervention Management</h2>
                            </div>
                            <button
                                onClick={() => setShowInterventionModal(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Create Intervention
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-indigo-600">Total Interventions</p>
                                        <p className="text-2xl font-bold text-indigo-900">{analytics?.intervention_stats?.total || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-yellow-600">In Progress</p>
                                        <p className="text-2xl font-bold text-yellow-900">{analytics?.intervention_stats?.in_progress || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-red-600">High Priority</p>
                                        <p className="text-2xl font-bold text-red-900">{analytics?.intervention_stats?.high_priority || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Communication Management Section */}
                <section className="mb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Communication Center</h2>
                            </div>
                            <button
                                onClick={() => setShowCommunication(true)}
                                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                                Send Communication
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-teal-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-teal-600">Email</p>
                                        <p className="text-2xl font-bold text-teal-900">Send via Email</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-blue-600">SMS</p>
                                        <p className="text-2xl font-bold text-blue-900">Send via SMS</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-purple-600">Notifications</p>
                                        <p className="text-2xl font-bold text-purple-900">System Alerts</p>
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Student Records</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">
                                        {selectedStudentRecords.length} selected
                                    </span>
                                    {selectedStudentRecords.length > 0 && (
                                        <button
                                            onClick={() => setShowBulkOperations(true)}
                                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                        >
                                            Bulk Actions
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Filters and Search */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    >
                                        <option value="">All Departments</option>
                                        {departments?.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    >
                                        <option value="">All Programs</option>
                                        {filteredPrograms?.map(program => (
                                            <option key={program.id} value={program.id}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                    <select
                                        value={selectedYearLevel}
                                        onChange={(e) => setSelectedYearLevel(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    >
                                        <option value="">All Years</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    >
                                        <option value="">All Sections</option>
                                        {filteredSections?.map(section => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                                    <input
                                        type="text"
                                        value={studentRecordsSearch}
                                        onChange={(e) => setStudentRecordsSearch(e.target.value)}
                                        placeholder="Search by name or number..."
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentRecords.length === filteredStudentRecords.length && filteredStudentRecords.length > 0}
                                                onChange={(e) => handleSelectAllStudents(e.target.checked)}
                                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                            />
                                        </th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Student Number</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Section</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Program</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudentRecords.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudentRecords.includes(student.id)}
                                                    onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                                                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                />
                                            </td>
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
                                                        <div className="text-sm text-gray-500">{student.student_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.student_number}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.section?.name || 'N/A'}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.section?.program?.name || 'N/A'}
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.section?.program?.department?.name || 'N/A'}
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
                        
                        {filteredStudentRecords.length === 0 && (
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

                {/* Student Management Section */}
                <section>
                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                                </div>
                                <button
                                    onClick={() => setShowStudentForm(true)}
                                    className="bg-brand-primary text-white px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors font-medium"
                                >
                                    Add New Student
                                </button>
                            </div>
                        </div>
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
                                        <p className="text-sm text-gray-500">{selectedStudent.section?.name} - {selectedStudent.section?.program?.name}</p>
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
                                        <p><span className="font-medium">Program:</span> {selectedStudent.section?.program?.name}</p>
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
                                <button 
                                    onClick={() => setShowExportModal(true)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Export Student Record
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
                                            {section.name} - {section.program?.name}
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
                                <h2 className="text-2xl font-bold text-gray-900">Live Attendance Analytics</h2>
                                <button
                                    onClick={() => setShowAnalytics(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Live Analytics Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Section</h3>
                                    <div className="space-y-3">
                                        {analytics?.attendance_by_section?.map(section => (
                                            <div key={section.id} className="flex items-center justify-between">
                                                <div>
                                                <span className="text-sm font-medium text-gray-700">{section.name}</span>
                                                    <p className="text-xs text-gray-500">{section.department?.name} - {section.program?.name}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${section.attendance_rate}%`}}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{section.attendance_rate}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h3>
                                    <div className="space-y-3">
                                        {analytics?.attendance_by_day?.map(day => (
                                            <div key={day.day} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{day.day}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-blue-500 h-2 rounded-full" style={{width: `${day.attendance_rate}%`}}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{day.attendance_rate}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Absent Students</h3>
                                    <div className="space-y-3">
                                        {analytics?.top_absent_students?.map(student => (
                                            <div key={student.id} className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">{student.name}</span>
                                                    <p className="text-xs text-gray-500">{student.section} - {student.department}</p>
                            </div>
                                                <span className="text-sm font-medium text-red-600">{student.absent_count} absences</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervention Statistics</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Total Interventions</span>
                                            <span className="text-sm font-medium text-blue-600">{analytics?.intervention_stats?.total || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">In Progress</span>
                                            <span className="text-sm font-medium text-yellow-600">{analytics?.intervention_stats?.in_progress || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Completed</span>
                                            <span className="text-sm font-medium text-green-600">{analytics?.intervention_stats?.done || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">High Priority</span>
                                            <span className="text-sm font-medium text-red-600">{analytics?.intervention_stats?.high_priority || 0}</span>
                                        </div>
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

                            <div className="mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-blue-700">
                                            {selectedStudentRecords.length} students selected for bulk operations
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Operations</h3>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleBulkOperation('attendance_update')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Bulk Attendance Update</div>
                                            <div className="text-sm text-gray-500">Update attendance status for selected students</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('email_notification')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Mass Email Notifications</div>
                                            <div className="text-sm text-gray-500">Send emails to selected students</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('sms_notification')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">SMS Notifications</div>
                                            <div className="text-sm text-gray-500">Send SMS to selected students</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('create_intervention')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Create Interventions</div>
                                            <div className="text-sm text-gray-500">Create interventions for selected students</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Operations</h3>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleBulkOperation('export_data')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Export Student Data</div>
                                            <div className="text-sm text-gray-500">Download selected students' data</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('export_attendance')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Export Attendance Records</div>
                                            <div className="text-sm text-gray-500">Download attendance records for selected students</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('generate_report')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Generate Reports</div>
                                            <div className="text-sm text-gray-500">Generate detailed reports for selected students</div>
                                        </button>
                                        <button 
                                            onClick={() => handleBulkOperation('update_status')}
                                            className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">Update Student Status</div>
                                            <div className="text-sm text-gray-500">Update enrollment status for selected students</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Intervention Modal */}
            {showInterventionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Create Intervention</h2>
                                <button
                                    onClick={() => setShowInterventionModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleCreateIntervention({
                                    student_id: formData.get('student_id'),
                                    type: formData.get('type'),
                                    details: formData.get('details'),
                                    priority: formData.get('priority'),
                                    responsible_staff: formData.get('responsible_staff'),
                                    due_date: formData.get('due_date')
                                });
                            }}>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search Student</label>
                                    <input
                                        type="text"
                                        value={interventionStudentSearch}
                                        onChange={(e) => setInterventionStudentSearch(e.target.value)}
                                        placeholder="Search by name or student number..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    />
                                    {filteredInterventionStudents.length === 0 && interventionStudentSearch && (
                                        <p className="text-sm text-gray-500 mt-2">No students found matching your search.</p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student</label>
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredInterventionStudents.map(student => (
                                                    <tr key={student.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="radio"
                                                                name="student_id"
                                                                value={student.id}
                                                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">{student.student_number}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{student.section?.name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{student.section?.program?.department?.name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Intervention Type</label>
                                        <input
                                            type="text"
                                            name="type"
                                            required
                                            placeholder="e.g., Academic Support, Behavioral"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                        <select
                                            name="priority"
                                            required
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Details</label>
                                    <textarea
                                        name="details"
                                        required
                                        rows={4}
                                        placeholder="Describe the intervention details..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    />
                                </div>

                                <div className="flex justify-end space-x-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowInterventionModal(false)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Intervention'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Communication Modal */}
            {showCommunication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Send Communication</h2>
                                <button
                                    onClick={() => setShowCommunication(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const recipients = communicationType === 'students' 
                                    ? selectedStudents 
                                    : selectedTeachers.map(t => t.teacher_id).filter(Boolean);
                                handleSendCommunication({
                                    type: formData.get('type'),
                                    recipients: recipients,
                                    subject: formData.get('subject'),
                                    message: formData.get('message'),
                                    priority: formData.get('priority')
                                });
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Communication Type</label>
                                        <select
                                            name="type"
                                            required
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                        >
                                            <option value="email">Email</option>
                                            <option value="sms">SMS</option>
                                            <option value="notification">System Notification</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                        <select
                                            name="priority"
                                            required
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex space-x-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setCommunicationType('students')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                communicationType === 'students'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Students ({selectedStudents.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCommunicationType('teachers')}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                communicationType === 'teachers'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Teachers/Advisers ({selectedTeachers.length})
                                        </button>
                                    </div>

                                    {communicationType === 'students' ? (
                                        <div>
                                            <div className="mb-4">
                                                <input
                                                    type="text"
                                                    value={studentSearch}
                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                    placeholder="Search students by name or student number..."
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {filteredCommunicationStudents.map(student => (
                                                            <tr key={student.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedStudents.includes(student.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedStudents(prev => [...prev, student.id]);
                                                                            } else {
                                                                                setSelectedStudents(prev => prev.filter(id => id !== student.id));
                                                                            }
                                                                        }}
                                                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {student.first_name} {student.last_name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">{student.student_number}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{student.section?.name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{student.section?.program?.department?.name}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="mb-4">
                                                <input
                                                    type="text"
                                                    value={teacherSearch}
                                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                                    placeholder="Search teachers by name or subject..."
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {filteredTeachers.map(teacher => (
                                                            <tr key={teacher.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedTeachers.some(t => t.teacher_id === teacher.teacher_id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedTeachers(prev => [...prev, teacher]);
                                                                            } else {
                                                                                setSelectedTeachers(prev => prev.filter(t => t.teacher_id !== teacher.teacher_id));
                                                                            }
                                                                        }}
                                                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {teacher.teacher_name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{teacher.name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{teacher.department}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        placeholder="Enter message subject..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={4}
                                        placeholder="Enter your message..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    />
                                </div>

                                <div className="flex justify-end space-x-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowCommunication(false)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Sending...' : 'Send Communication'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Form Modal */}
            {showStudentForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
                                <button
                                    onClick={() => setShowStudentForm(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleStudentSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Personal Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={studentForm.first_name}
                                                onChange={(e) => handleStudentFormChange('first_name', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Enter first name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={studentForm.last_name}
                                                onChange={(e) => handleStudentFormChange('last_name', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Enter last name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Student Number</label>
                                            <input
                                                type="text"
                                                value={studentForm.student_number}
                                                onChange={(e) => handleStudentFormChange('student_number', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Enter student number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                            <select
                                                value={studentForm.gender}
                                                onChange={(e) => handleStudentFormChange('gender', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Birth Date</label>
                                            <input
                                                type="date"
                                                value={studentForm.birth_date}
                                                onChange={(e) => handleStudentFormChange('birth_date', e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                            <select
                                                value={studentForm.department_id}
                                                onChange={(e) => {
                                                    handleStudentFormChange('department_id', e.target.value);
                                                    handleStudentFormChange('program_id', '');
                                                    handleStudentFormChange('section_id', '');
                                                }}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">Select Department</option>
                                                {departments?.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Program</label>
                                            <select
                                                value={studentForm.program_id}
                                                onChange={(e) => {
                                                    handleStudentFormChange('program_id', e.target.value);
                                                    handleStudentFormChange('section_id', '');
                                                }}
                                                required
                                                disabled={!studentForm.department_id}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 disabled:bg-gray-100"
                                            >
                                                <option value="">Select Program</option>
                                                {programs?.filter(program => program.department_id == studentForm.department_id).map(program => (
                                                    <option key={program.id} value={program.id}>{program.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
                                            <select
                                                value={studentForm.year_level}
                                                onChange={(e) => handleStudentFormChange('year_level', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">Select Year Level</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                                            <select
                                                value={studentForm.section_id}
                                                onChange={(e) => handleStudentFormChange('section_id', e.target.value)}
                                                required
                                                disabled={!studentForm.program_id}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 disabled:bg-gray-100"
                                            >
                                                <option value="">Select Section</option>
                                                {sections?.filter(section => section.program_id == studentForm.program_id).map(section => (
                                                    <option key={section.id} value={section.id}>{section.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Guardian Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Guardian Information</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Name</label>
                                            <input
                                                type="text"
                                                value={studentForm.guardian_name}
                                                onChange={(e) => handleStudentFormChange('guardian_name', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Enter guardian name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Contact</label>
                                            <input
                                                type="tel"
                                                value={studentForm.guardian_contact}
                                                onChange={(e) => handleStudentFormChange('guardian_contact', e.target.value)}
                                                required
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                                placeholder="Enter guardian contact number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Schedule Assignment (Optional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {schedules?.filter(schedule => schedule.section_id == studentForm.section_id).map(schedule => (
                                            <label key={schedule.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={studentForm.schedule_ids.includes(schedule.id)}
                                                    onChange={(e) => {
                                                        const newScheduleIds = e.target.checked
                                                            ? [...studentForm.schedule_ids, schedule.id]
                                                            : studentForm.schedule_ids.filter(id => id !== schedule.id);
                                                        handleStudentFormChange('schedule_ids', newScheduleIds);
                                                    }}
                                                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{schedule.subject?.name}</div>
                                                    <div className="text-sm text-gray-500">{schedule.day} - {schedule.time_start} to {schedule.time_end}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowStudentForm(false)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Records Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {showStudentModal && selectedStudent ? 
                                        `Export ${selectedStudent.first_name} ${selectedStudent.last_name}'s Record` : 
                                        'Export Student Records'
                                    }
                                </h2>
                                <button 
                                    onClick={() => setShowExportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Export Format Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Export Format</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="exportFormat"
                                                value="csv"
                                                checked={exportFormat === 'csv'}
                                                onChange={(e) => setExportFormat(e.target.value)}
                                                className="text-brand-primary focus:ring-brand-primary"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">CSV Format</div>
                                                <div className="text-sm text-gray-500">Comma-separated values (Excel compatible)</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="exportFormat"
                                                value="xml"
                                                checked={exportFormat === 'xml'}
                                                onChange={(e) => setExportFormat(e.target.value)}
                                                className="text-brand-primary focus:ring-brand-primary"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">XML Format</div>
                                                <div className="text-sm text-gray-500">Extensible Markup Language</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Export Filters - Only show for bulk exports */}
                                {!(showStudentModal && selectedStudent) && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Records (Optional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                            <select
                                                value={exportFilters.department_id}
                                                onChange={(e) => handleExportFilterChange('department_id', e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">All Departments</option>
                                                {departments?.map(department => (
                                                    <option key={department.id} value={department.id}>{department.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Program</label>
                                            <select
                                                value={exportFilters.program_id}
                                                onChange={(e) => handleExportFilterChange('program_id', e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">All Programs</option>
                                                {programs?.filter(program => !exportFilters.department_id || program.department_id == exportFilters.department_id).map(program => (
                                                    <option key={program.id} value={program.id}>{program.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                                            <select
                                                value={exportFilters.section_id}
                                                onChange={(e) => handleExportFilterChange('section_id', e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">All Sections</option>
                                                {sections?.filter(section => !exportFilters.program_id || section.program_id == exportFilters.program_id).map(section => (
                                                    <option key={section.id} value={section.id}>{section.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
                                            <select
                                                value={exportFilters.year_level}
                                                onChange={(e) => handleExportFilterChange('year_level', e.target.value)}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition-all duration-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            >
                                                <option value="">All Year Levels</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* Export Preview */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Export Preview</h4>
                                    <div className="text-sm text-gray-600">
                                        <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
                                        {showStudentModal && selectedStudent ? (
                                            <div>
                                                <p><strong>Student:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</p>
                                                <p><strong>Student Number:</strong> {selectedStudent.student_number}</p>
                                                <p><strong>Section:</strong> {selectedStudent.section?.name || 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p><strong>Filters:</strong></p>
                                                <ul className="ml-4 space-y-1">
                                                    <li>• Department: {exportFilters.department_id ? departments?.find(d => d.id == exportFilters.department_id)?.name : 'All'}</li>
                                                    <li>• Program: {exportFilters.program_id ? programs?.find(p => p.id == exportFilters.program_id)?.name : 'All'}</li>
                                                    <li>• Section: {exportFilters.section_id ? sections?.find(s => s.id == exportFilters.section_id)?.name : 'All'}</li>
                                                    <li>• Year Level: {exportFilters.year_level || 'All'}</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-6">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExportRecords}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Exporting...' : (showStudentModal && selectedStudent ? 'Export Student Record' : 'Export Records')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
