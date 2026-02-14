import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Phone, Home, Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Download, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
// route is available globally

export default function SystemAdmin({ 
    users, 
    systemStats, 
    activityLogs, 
    recentUserActivities = [],
    integrations, 
    systemTools, 
    auditLogs,
    studentsNeedingCalls = [],
    recentTracking = [],
    stats = {},
    interventions,
    departments,
    programs,
    sections,
    students = [],
    teachers: teachersProp = [],
    attendanceStats,
    todayAttendance,
    trends,
    recentRecords,
    calendarData,
    departmentTrends,
    weeklyStatusProgress: weeklyStatusProgressProp = [],
    activeTab: initialActiveTab = 'dashboard',
    pageTitle = 'System Admin Control',
    availableMonths = []
}) {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showLogs, setShowLogs] = useState(false);
    const [systemLogs, setSystemLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [liveDepartmentTrends, setLiveDepartmentTrends] = useState(departmentTrends);
    const [liveWeeklyStatusProgress, setLiveWeeklyStatusProgress] = useState(weeklyStatusProgressProp);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [departmentRates, setDepartmentRates] = useState([]);
    // Local state for students to allow immediate updates
    const [localStudents, setLocalStudents] = useState(students);
    // Live attendance stats for real-time updates
    const [liveAttendanceStats, setLiveAttendanceStats] = useState(attendanceStats);
    // Ref to track previous students hash to prevent unnecessary updates
    const prevStudentsHashRef = useRef(null);
    
    // Pagination state for Students tab
    const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
    const studentsPerPage = 20;

    // Pagination state for "Students Needing Attention" table (Management tab)
    const attentionPerPage = 10;
    const [attentionCurrentPage, setAttentionCurrentPage] = useState(1);
    // Local state so we can instantly remove entries (e.g. after sending to CSDL)
    const [attentionStudents, setAttentionStudents] = useState(studentsNeedingCalls || []);

    useEffect(() => {
        // Reset to page 1 when the list changes (filtering/reloads)
        setAttentionCurrentPage(1);
    }, [attentionStudents?.length]);

    useEffect(() => {
        setAttentionStudents(studentsNeedingCalls || []);
    }, [studentsNeedingCalls]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            refreshDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const loadDepartmentRates = async () => {
        try {
            const response = await fetch(route('super.attendance.department-rates'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.departments) {
                    setDepartmentRates(data.departments);
                }
            }
        } catch (error) {
            console.error('Failed to load department rates:', error);
        }
    };

    useEffect(() => {
        // Load department attendance rates on mount
        loadDepartmentRates();
    }, []);

    // Fetch live attendance data when attendance tab is active
    const fetchAttendanceLiveData = useCallback(async () => {
        if (activeTab !== 'attendance') return;
        
        try {
            const response = await fetch(route('super.attendance.live-data'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.attendanceStats) {
                    setLiveAttendanceStats(data.attendanceStats);
                }
            }
        } catch (error) {
            console.error('Failed to fetch attendance live data:', error);
        }
    }, [activeTab]);

    // Poll for attendance data every 30 seconds when attendance tab is active
    useEffect(() => {
        if (activeTab === 'attendance') {
            // Fetch immediately
            fetchAttendanceLiveData();
            
            // Then poll every 30 seconds
            const interval = setInterval(fetchAttendanceLiveData, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchAttendanceLiveData]);

    const refreshDashboardData = async () => {
        try {
            const response = await fetch(route('super.dashboard.refresh'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLiveDepartmentTrends(data.departmentTrends);
                if (data.weeklyStatusProgress) {
                    setLiveWeeklyStatusProgress(data.weeklyStatusProgress);
                }
                setLastRefresh(new Date());
            }
            
            // Also refresh department rates
            loadDepartmentRates();
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    };
    
    // Student management 
    const [activeSettingsTab, setActiveSettingsTab] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Teacher/Adviser management 
    const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
    const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherForm, setTeacherForm] = useState({
        name: '',
        email: '',
        department_id: '',
        optional_department_id: ''
    });
    const [teacherFormErrors, setTeacherFormErrors] = useState({});
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importType, setImportType] = useState('csv');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editStudentForm, setEditStudentForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        guardian_name: '',
        guardian_contact: '',
        year_level: '',
        status: 'pending', // Tracking status: pending, processing, to_follow
        absence_count: 0,
        attendance_status: 'Normal', // Auto-calculated: Normal, SLIP, PNS
    });
    const [isSavingStudent, setIsSavingStudent] = useState(false);
    const [studentFormErrors, setStudentFormErrors] = useState({});
    const studentStatusOptions = ['Pending', 'Processing', 'To follow'];
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentForm, setStudentForm] = useState({
        first_name: '',
        last_name: '',
        student_number: '',
        email: '',
        phone: '',
        department_id: '',
        program_id: '',
        section_id: '',
        teacher_id: '',
        year_level: '',
        gender: '',
        birth_date: '',
        guardian_name: '',
        guardian_contact: ''
    });
    const normalizeEmail = (value) => (value ?? '').toString().trim().toLowerCase();
    const normalizeStudentNumber = (value) => (
        (value ?? '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[-\s]/g, '')
    );
    const duplicateStudentNumber = (localStudents || []).find((student) => (
        normalizeStudentNumber(student.student_number || student.student_id) === normalizeStudentNumber(studentForm.student_number)
    ));
    const duplicateStudentEmail = (localStudents || []).find((student) => (
        normalizeEmail(student.email) && normalizeEmail(student.email) === normalizeEmail(studentForm.email)
    ));
    const duplicateEditStudentEmail = (localStudents || []).find((student) => (
        normalizeEmail(student.email)
        && normalizeEmail(student.email) === normalizeEmail(editStudentForm.email)
        && student.id !== selectedStudent?.id
    ));
    const duplicateTeacherEmail = (teachersProp || []).find((teacher) => (
        normalizeEmail(teacher.email) && normalizeEmail(teacher.email) === normalizeEmail(teacherForm.email)
        && teacher.id !== selectedTeacher?.id
    ));
    const closeEditTeacherModal = () => {
        setShowEditTeacherModal(false);
        setSelectedTeacher(null);
        setTeacherFormErrors({});
        setTeacherForm({
            name: '',
            email: '',
            department_id: '',
            optional_department_id: '',
        });
    };
    const closeAddTeacherModal = () => {
        setShowAddTeacherModal(false);
        setTeacherForm({
            name: '',
            email: '',
            department_id: '',
            optional_department_id: '',
        });
        setTeacherFormErrors({});
    };
    const [studentFormFilteredPrograms, setStudentFormFilteredPrograms] = useState([]);
    const [studentFormFilteredSections, setStudentFormFilteredSections] = useState([]);
    const [sectionTeachers, setSectionTeachers] = useState([]);
    
    // Handle department change - filter programs
    useEffect(() => {
        if (studentForm.department_id) {
            const filtered = programs?.filter(p => p.department_id == studentForm.department_id) || [];
            setStudentFormFilteredPrograms(filtered);
            if (studentForm.program_id && !filtered.find(p => p.id == studentForm.program_id)) {
                setStudentForm(prev => ({ ...prev, program_id: '', section_id: '', teacher_id: '' }));
            }
        } else {
            setStudentFormFilteredPrograms([]);
            setStudentForm(prev => ({ ...prev, program_id: '', section_id: '', teacher_id: '' }));
        }
    }, [studentForm.department_id, programs]);

    useEffect(() => {
        if (studentForm.program_id) {
            const filtered = sections?.filter(s => s.program_id == studentForm.program_id) || [];
            setStudentFormFilteredSections(filtered);
            if (studentForm.section_id && !filtered.find(s => s.id == studentForm.section_id)) {
                setStudentForm(prev => ({ ...prev, section_id: '', teacher_id: '' }));
            }
        } else {
            setStudentFormFilteredSections([]);
            setStudentForm(prev => ({ ...prev, section_id: '', teacher_id: '' }));
        }
    }, [studentForm.program_id, sections]);

    useEffect(() => {
        if (studentForm.department_id) {
            fetch(route('super.departments.get-teachers', { id: studentForm.department_id }), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setSectionTeachers(data.teachers || []);
                }
            })
            .catch(error => {
                console.error('Error fetching teachers:', error);
                setSectionTeachers([]);
            });
        } else {
            setSectionTeachers([]);
            setStudentForm(prev => ({ ...prev, teacher_id: '' }));
        }
    }, [studentForm.department_id]);
    
    const [showSendToCSDLModal, setShowSendToCSDLModal] = useState(false);
    const [selectedStudentForCSDL, setSelectedStudentForCSDL] = useState(null);
    const [csdlForm, setCsdlForm] = useState({
        type: 'home_visit',
        notes: ''
    });

    // Student Tracking 
    const [selectedStudentForTracking, setSelectedStudentForTracking] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingForm, setTrackingForm] = useState({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        time: '',
        notes: '',
        status: 'pending',
        outcome: '',
        follow_up_required: '',
        follow_up_date: '',
    });
    const [editingTracking, setEditingTracking] = useState(null);
    const [viewingTracking, setViewingTracking] = useState(null);
    const [showViewTrackingModal, setShowViewTrackingModal] = useState(false);
    const [trackingTab, setTrackingTab] = useState('recent'); // 'recent', 'archived'
    const [archivedTracking, setArchivedTracking] = useState([]);
    const [deletedTracking, setDeletedTracking] = useState([]);
    const [recentTrackingData, setRecentTrackingData] = useState(recentTracking || []);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
    
    // Tracking filters and pagination
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
    
    // Interventions legacy 
    const [interventionsData, setInterventionsData] = useState(interventions?.data || []);
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [editingIntervention, setEditingIntervention] = useState(null);
    const [viewingIntervention, setViewingIntervention] = useState(null);
    const [interventionForm, setInterventionForm] = useState({
        student_id: '',
        type: '',
        details: '',
        priority: 'low',
        responsible_staff: '',
        due_date: '',
        status: 'in_progress'
    });

    // Sections management 
    const [sectionsData, setSectionsData] = useState(sections || []);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionForm, setSectionForm] = useState({
        name: '',
        year_level: '',
        academic_year: new Date().getFullYear().toString(),
        semester: '1st Semester',
        adviser_name: '',
        department_id: '',
        program_id: '',
        max_students: 50
    });
    const [sectionFilters, setSectionFilters] = useState({
        department: '',
        program: '',
        year_level: '',
        academic_year: ''
    });

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    // Filter programs by department
    const filteredPrograms = selectedDepartment 
        ? programs?.filter(p => p.department_id == selectedDepartment) || []
        : programs || [];

    // Update local students when props change
    // Update whenever students prop changes to reflect any edits (absence_count, status, etc.)
    useEffect(() => {
        if (students) {
            // Only update if the data actually changed to prevent infinite loops
            // Compare by creating a hash of student IDs and key fields
            const currentHash = students.map(s => `${s.id}-${s.absence_count}-${s.status}-${s.priority}`).join('|');
            const prevHash = prevStudentsHashRef.current;
            
            if (currentHash !== prevHash) {
                setLocalStudents(students);
                prevStudentsHashRef.current = currentHash;
            }
        }
    }, [students]);

    // Filter students
    const filteredStudents = (localStudents || []).filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesStatus = !selectedStatus || student.attendance_status == selectedStatus;
        const matchesSearch = !searchTerm || 
            student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesStatus && matchesSearch;
    });
    
    // Pagination for Students tab - Always calculate these values
    const studentsTotalPages = Math.ceil((filteredStudents?.length || 0) / studentsPerPage);
    const studentsStartIndex = (studentsCurrentPage - 1) * studentsPerPage;
    const studentsEndIndex = studentsStartIndex + studentsPerPage;
    const paginatedStudents = (filteredStudents || []).slice(studentsStartIndex, studentsEndIndex);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setStudentsCurrentPage(1);
    }, [selectedDepartment, selectedProgram, selectedYearLevel, selectedStatus, searchTerm]);

    // Set Students sub-tab as active when coming from Students navigation
    useEffect(() => {
        if (activeTab === 'settings' && window.location.hash === '#students') {
            setActiveSettingsTab('students');
        }
    }, [activeTab]);

    // Auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);


    // Intervention CRUD functions
    const handleCreateIntervention = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(interventionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setInterventionsData([...interventionsData, result.intervention]);
                setShowInterventionModal(false);
                setInterventionForm({
                    student_id: '',
                    type: '',
                    details: '',
                    priority: 'low',
                    responsible_staff: '',
                    due_date: '',
                    status: 'in_progress'
                });
                setNotification({ type: 'success', message: 'Intervention created successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create intervention');
            }
        } catch (error) {
            console.error('Error creating intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to create intervention. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIntervention = async () => {
        if (!editingIntervention) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.update', editingIntervention.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(interventionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setInterventionsData(interventionsData.map(i => i.id === editingIntervention.id ? result.intervention : i));
                setShowInterventionModal(false);
                setEditingIntervention(null);
                setInterventionForm({
                    student_id: '',
                    type: '',
                    details: '',
                    priority: 'low',
                    responsible_staff: '',
                    due_date: '',
                    status: 'in_progress'
                });
                setNotification({ type: 'success', message: 'Intervention updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update intervention');
            }
        } catch (error) {
            console.error('Error updating intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update intervention. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteIntervention = async (interventionId) => {
        if (!confirm('Are you sure you want to delete this intervention?')) return;
        
        setIsLoading(true);
        try {
            // Use Inertia router for better CSRF handling
            router.delete(route('super.interventions.destroy', interventionId), {
                onSuccess: (page) => {
                    // Remove the intervention from local state
                    setInterventionsData(interventionsData.filter(i => i.id !== interventionId));
                    // Show success message from session
                    if (page.props.flash?.success) {
                        setNotification({ type: 'success', message: page.props.flash.success });
                    }
                },
                onError: (errors) => {
                    console.error('Error deleting intervention:', errors);
                    setNotification({ type: 'error', message: 'Failed to delete intervention. Please try again.' });
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Error deleting intervention:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete intervention. Please try again.' });
            setIsLoading(false);
        }
    };

    const handleUpdateInterventionStatus = async (interventionId, newStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('super.interventions.update', interventionId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    // Include other required fields to avoid validation errors
                    student_id: viewingIntervention.student_id,
                    type: viewingIntervention.type,
                    details: viewingIntervention.details,
                    priority: viewingIntervention.priority,
                    responsible_staff: viewingIntervention.responsible_staff,
                    due_date: viewingIntervention.due_date
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Update the intervention in the local state
                setInterventionsData(interventionsData.map(i => i.id === interventionId ? result.intervention : i));
                // Update the viewing intervention with the new data
                setViewingIntervention(result.intervention);
                setNotification({ type: 'success', message: 'Intervention status updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update intervention status');
            }
        } catch (error) {
            console.error('Error updating intervention status:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update intervention status. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const openInterventionModal = (intervention = null, viewMode = false) => {
        console.log('Opening intervention modal:', { intervention, viewMode });
        if (intervention) {
            if (viewMode) {
                console.log('Setting viewing intervention:', intervention);
                setViewingIntervention(intervention);
                setEditingIntervention(null);
            } else {
                setEditingIntervention(intervention);
                setViewingIntervention(null);
                setInterventionForm({
                    student_id: intervention.student_id || '',
                    type: intervention.type || '',
                    details: intervention.details || '',
                    priority: intervention.priority || 'low',
                    responsible_staff: intervention.responsible_staff || '',
                    due_date: intervention.due_date || '',
                    status: intervention.status || 'in_progress'
                });
            }
        } else {
            setEditingIntervention(null);
            setViewingIntervention(null);
            setInterventionForm({
                student_id: '',
                type: '',
                details: '',
                priority: 'low',
                responsible_staff: '',
                due_date: '',
                status: 'in_progress'
            });
        }
        console.log('Setting showInterventionModal to true');
        setShowInterventionModal(true);
    };

    // Section Management Functions
    const handleCreateSection = async () => {
        // Validate required fields
        if (!sectionForm.name || !sectionForm.year_level || !sectionForm.academic_year || !sectionForm.semester) {
            setNotification({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }
        
        if (!sectionForm.department_id || !sectionForm.program_id) {
            setNotification({ type: 'error', message: 'Please select both Department and Program.' });
            return;
        }

        setIsLoading(true);
        try {
            // Convert year_level from "1" to "1st Year" format if needed
            let yearLevel = sectionForm.year_level;
            if (yearLevel && !yearLevel.includes('Year')) {
                const yearMap = {
                    '1': '1st Year',
                    '2': '2nd Year',
                    '3': '3rd Year',
                    '4': '4th Year',
                    '5': '5th Year'
                };
                yearLevel = yearMap[yearLevel] || yearLevel;
            }
            
            // Prepare payload with proper data types
            const payload = {
                name: sectionForm.name.trim(),
                year_level: yearLevel,
                academic_year: sectionForm.academic_year,
                semester: sectionForm.semester,
                adviser_name: sectionForm.adviser_name || null,
                department_id: parseInt(sectionForm.department_id),
                program_id: parseInt(sectionForm.program_id),
                max_students: sectionForm.max_students ? parseInt(sectionForm.max_students) : null
            };

            const response = await fetch(route('super.sections.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSectionsData([result.section, ...sectionsData]);
                setShowSectionModal(false);
                setSectionForm({
                    name: '',
                    year_level: '',
                    academic_year: new Date().getFullYear().toString(),
                    semester: '1st Semester',
                    adviser_name: '',
                    department_id: '',
                    program_id: '',
                    max_students: 50
                });
                setNotification({ type: 'success', message: result.message || 'Section created successfully!' });
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(result.message || 'Failed to create section');
            }
        } catch (error) {
            console.error('Error creating section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to create section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSection = async () => {
        if (!editingSection) return;
        
        // Validate required fields
        if (!sectionForm.name || !sectionForm.year_level || !sectionForm.academic_year || !sectionForm.semester) {
            setNotification({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }
        
        if (!sectionForm.department_id || !sectionForm.program_id) {
            setNotification({ type: 'error', message: 'Please select both Department and Program.' });
            return;
        }
        
        setIsLoading(true);
        try {
            // Prepare payload with proper data types
            const payload = {
                name: sectionForm.name.trim(),
                year_level: sectionForm.year_level,
                academic_year: sectionForm.academic_year,
                semester: sectionForm.semester,
                adviser_name: sectionForm.adviser_name || null,
                department_id: parseInt(sectionForm.department_id),
                program_id: parseInt(sectionForm.program_id),
                max_students: sectionForm.max_students ? parseInt(sectionForm.max_students) : null
            };

            const response = await fetch(route('super.sections.update', editingSection.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Reload the page to get updated data with proper relationships
                router.reload();
                setNotification({ type: 'success', message: result.message || 'Section updated successfully!' });
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(result.message || 'Failed to update section');
            }
        } catch (error) {
            console.error('Error updating section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to update section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(route('super.sections.destroy', sectionId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                setSectionsData(sectionsData.filter(s => s.id !== sectionId));
                setNotification({ type: 'success', message: 'Section deleted successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete section');
            }
        } catch (error) {
            console.error('Error deleting section:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete section. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const openSectionModal = (section = null) => {
        if (section) {
            setEditingSection(section);
            // Get department_id from program relationship or fallback to section's department_id
            const departmentId = section.program?.department_id || section.program?.department?.id || section.department_id || '';
            
            // Convert year_level from "1st Year" format to "1" format for dropdown
            let yearLevel = section.year_level || '';
            if (yearLevel && typeof yearLevel === 'string') {
                // Extract first digit from year_level (e.g., "1st Year" -> "1", "2nd Year" -> "2")
                const match = yearLevel.match(/^(\d)/);
                if (match) {
                    yearLevel = match[1];
                }
            }
            
            setSectionForm({
                name: section.name || '',
                year_level: yearLevel,
                academic_year: section.academic_year || new Date().getFullYear().toString(),
                semester: section.semester || '1st Semester',
                adviser_name: section.adviser_name || '',
                department_id: String(departmentId || ''),
                program_id: String(section.program_id || ''),
                max_students: section.max_students || 50
            });
        } else {
            setEditingSection(null);
            setSectionForm({
                name: '',
                year_level: '',
                academic_year: new Date().getFullYear().toString(),
                semester: '1st Semester',
                adviser_name: '',
                department_id: '',
                program_id: '',
                max_students: 50
            });
        }
        setShowSectionModal(true);
    };

    // Filter sections based on current filters
    const filteredSections = sectionsData.filter(section => {
        const matchesDepartment = !sectionFilters.department || 
            section.program?.department?.name?.toLowerCase().includes(sectionFilters.department.toLowerCase()) ||
            section.department?.toLowerCase().includes(sectionFilters.department.toLowerCase());
        
        const matchesProgram = !sectionFilters.program || 
            section.program?.name?.toLowerCase().includes(sectionFilters.program.toLowerCase()) ||
            section.program?.toLowerCase().includes(sectionFilters.program.toLowerCase());
        
        const matchesYearLevel = !sectionFilters.year_level || 
            section.year_level?.toString().includes(sectionFilters.year_level);
        
        const matchesAcademicYear = !sectionFilters.academic_year || 
            section.academic_year?.toString().includes(sectionFilters.academic_year);

        return matchesDepartment && matchesProgram && matchesYearLevel && matchesAcademicYear;
    });

    const handleToolAction = async (toolName, action) => {
        console.log('Tool action triggered:', action, toolName);
        setIsLoading(true);
        setSelectedTool(toolName);
        
        try {
            let response;
            let data;
            
            switch (action) {
                case 'clear-cache':
                    response = await fetch(route('super.system-admin.clear-cache'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'optimize':
                    response = await fetch(route('super.system-admin.optimize'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'backup':
                    response = await fetch(route('super.system-admin.backup'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: `${data.message} - File: ${data.filename} (${data.size})` });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'maintenance':
                    response = await fetch(route('super.system-admin.maintenance'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.success) {
                        setNotification({ type: 'success', message: data.message });
                    } else {
                        setNotification({ type: 'error', message: data.message });
                    }
                    break;
                    
                case 'view-logs':
                    response = await fetch(route('super.system-admin.logs'), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                    data = await response.json();
                    
                    if (data.logs) {
                        setSystemLogs(data.logs);
                        setShowLogs(true);
                        setNotification({ type: 'success', message: 'System logs loaded successfully' });
                    } else {
                        setNotification({ type: 'error', message: 'Failed to load system logs' });
                    }
                    break;
                    
                default:
                    setNotification({ type: 'error', message: `Unknown action: ${action}` });
            }
        } catch (error) {
            console.error('Tool action error:', error);
            setNotification({ type: 'error', message: `Failed to ${action} ${toolName}: ${error.message}` });
        } finally {
            setIsLoading(false);
            setSelectedTool(null);
        }
    };

    // Render functions for each tab
    const renderInterventions = () => {
        return (
            <div className="space-y-6">
                    {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white rounded-lg shadow p-6">
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
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.total || 0}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
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
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.done || 0}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
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
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.in_progress || 0}</p>
                            </div>
                            </div>
                        </div>

                    <div className="bg-white rounded-lg shadow p-6">
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
                                <p className="text-2xl font-semibold text-gray-900">{interventions?.stats?.no_response || 0}</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Interventions Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Interventions</h3>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => openInterventionModal()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Add New Intervention
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Test button clicked - opening modal with test data');
                                    openInterventionModal({
                                        id: 1,
                                        type: 'Test Intervention',
                                        details: 'This is a test intervention',
                                        status: 'in_progress',
                                        priority: 'medium',
                                        student: { first_name: 'Test', last_name: 'Student', student_number: 'TEST001' }
                                    }, true);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            >
                                Test Modal
                            </button>
                        </div>
                    </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'student',
                                    label: 'Student',
                                    render: (_, record) => (
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {record.student?.first_name} {record.student?.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{record.student?.student_number}</div>
                                            <div className="text-xs text-gray-400">
                                                {record.student?.section?.program?.department?.name || 'No Department'}
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'section',
                                    label: 'Section',
                                    render: (_, record) => (
                                        <div>
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                                            {record.student?.section?.name || 'N/A'}
                                        </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {record.student?.section?.program?.name || 'No Program'}
                                            </div>
                                        </div>
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
                                        const statusColors = {
                                            'done': 'bg-green-100 text-green-800',
                                            'in_progress': 'bg-yellow-100 text-yellow-800',
                                            'no_response': 'bg-red-100 text-red-800',
                                            'open': 'bg-blue-100 text-blue-800',
                                            'resolved': 'bg-green-100 text-green-800',
                                            'pending': 'bg-yellow-100 text-yellow-800',
                                            'escalated': 'bg-red-100 text-red-800'
                                        };
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                                {status}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'priority',
                                    label: 'Priority',
                                    render: (priority) => {
                                        const priorityColors = {
                                            'low': 'bg-gray-100 text-gray-800',
                                            'medium': 'bg-yellow-100 text-yellow-800',
                                            'high': 'bg-orange-100 text-orange-800',
                                            'urgent': 'bg-red-100 text-red-800'
                                        };
                                        return (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
                                                {priority}
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
                                    render: (_, record) => {
                                        if (record.responsible_staff) {
                                            return (
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {record.responsible_staff.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {record.responsible_staff.email}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <span className="text-gray-500 italic">Not Assigned</span>
                                        );
                                    }
                                },
                                {
                                    key: 'recorded_by',
                                    label: 'Recorded By',
                                    render: (_, record) => record.recorded_by?.name || 'System'
                                }
                            ]}
                            data={interventionsData}
                            actions={true}
                            onView={(record) => openInterventionModal(record, true)}
                            onDelete={(record) => handleDeleteIntervention(record.id)}
                        />
                </div>
            </div>
        );
    };

    const handleTrackStudent = (student) => {
        setSelectedStudentForTracking(student);
        setShowTrackingModal(true);
        setEditingTracking(null);
        setTrackingForm({
            type: 'call',
            date: new Date().toISOString().split('T')[0],
            time: '',
            notes: '',
            status: 'pending',
            follow_up_date: '',
        });
    };

    const handleEditTracking = (tracking) => {
        setEditingTracking(tracking);
        setSelectedStudentForTracking({
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

    const fetchTrackingRecords = (page = 1, filters = {}) => {
        setIsLoadingTracking(true);
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: '10',
            ...filters,
        });
        
        // Check if route exists before using it
        let routeName;
        try {
            routeName =
                trackingTab === 'archived'
                    ? 'super.management.archived-tracking'
                    : trackingTab === 'deleted'
                    ? 'super.management.deleted-tracking'
                    : 'super.management.get-tracking';
            
            // Test if route exists
            route(routeName);
        } catch (error) {
            console.error('Route not found:', routeName, error);
            setIsLoadingTracking(false);
            // Use existing data if route doesn't exist
            if (trackingTab === 'recent' && recentTracking) {
                setRecentTrackingData(recentTracking);
            }
            return;
        }
        
        fetch(`${route(routeName)}?${params.toString()}`, {
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
                    per_page: data.per_page || 10,
                });
            }
        })
        .catch(error => {
            console.error('Error fetching tracking records:', error);
            // Fallback to existing data
            if (trackingTab === 'recent' && recentTracking) {
                setRecentTrackingData(recentTracking);
            }
        })
        .finally(() => {
            setIsLoadingTracking(false);
        });
    };

    const fetchArchivedTracking = () => {
        fetchTrackingRecords(1, trackingFilters);
    };

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
        fetchTrackingRecords(page, trackingFilters);
    };

    // Initialize / fetch paginated tracking records (10 per page)
    useEffect(() => {
        if (activeTab !== 'management') return;
        fetchTrackingRecords(1, trackingFilters);
    }, [trackingTab]);


    const submitTracking = (e) => {
        e.preventDefault();
        const routeName = editingTracking 
            ? 'super.management.update-tracking' 
            : 'super.management.track-student';
        const method = editingTracking ? 'put' : 'post';
        const url = editingTracking 
            ? route(routeName, editingTracking.id)
            : route(routeName);
        
        const data = {
            student_id: selectedStudentForTracking.id,
            ...trackingForm,
        };

        router[method](url, data, {
            preserveScroll: true,
            onSuccess: () => {
                setShowTrackingModal(false);
                setSelectedStudentForTracking(null);
                setEditingTracking(null);
                setTrackingForm({
                    type: 'call',
                    date: new Date().toISOString().split('T')[0],
                    time: '',
                    notes: '',
                    status: 'pending',
                    follow_up_date: '',
                });
            },
        });
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
            router.put(route('super.management.update-tracking', trackingId), {
                status: newStatus,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['recentTracking', 'studentsNeedingCalls'] });
                },
            });
        } else {
            // Create new tracking record
            router.post(route('super.management.track-student'), {
                student_id: studentId,
                type: 'call',
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openStatusDropdown && !event.target.closest(`[data-dropdown-id="${openStatusDropdown}"]`)) {
                setOpenStatusDropdown(null);
            }
        };
        if (openStatusDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openStatusDropdown]);

    const handleExportTracking = () => {
        // Only export if on recent tab, not archived or deleted
        if (trackingTab !== 'recent') {
            alert('Only recent tracking records can be exported. Please switch to the Recent tab.');
            return;
        }

        // Print from a dedicated root (prevents duplicates caused by printing the live page).
        const printRootId = 'super-tracking-print-root';
        const styleId = 'super-tracking-print-style';

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
        title.textContent = 'Super Admin Tracking Records (Recent)';
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';

        const meta = document.createElement('div');
        meta.textContent = `Generated: ${new Date().toLocaleString()} • Records: ${recentTracking?.length || 0}`;
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
        (recentTracking || []).forEach((tracking) => {
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

    const renderManagement = () => {
        const attentionTotal = attentionStudents?.length || 0;
        const attentionLastPage = Math.max(1, Math.ceil(attentionTotal / attentionPerPage));
        const attentionStartIdx = (attentionCurrentPage - 1) * attentionPerPage;
        const attentionEndIdx = attentionStartIdx + attentionPerPage;
        const paginatedAttentionStudents = (attentionStudents || []).slice(attentionStartIdx, attentionEndIdx);

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Tracking</h1>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Need Calls</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.students_needing_calls || 0}</p>
                            </div>
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <Phone className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Need Visits</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.students_needing_visits || 0}</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <Home className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Tracked Today</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total_tracked_today || 0}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">This Week</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total_tracked_this_week || 0}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Needing Attention */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Students Needing Attention</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Program</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Absences</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedAttentionStudents.length > 0 ? (
                                    paginatedAttentionStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{student.student_number}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="relative" data-dropdown-id={student.id}>
                                                    <button
                                                        onClick={() => setOpenStatusDropdown(openStatusDropdown === student.id ? null : student.id)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                                            student.tracking_status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                                : student.tracking_status === 'to_follow'
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                : student.tracking_status === 'processing'
                                                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {student.tracking_status && student.tracking_status !== 'No Status' ? student.tracking_status.replace('_', ' ') : 'No Status'}
                                                        <ChevronDown className="h-3 w-3" />
                                                    </button>
                                                    {openStatusDropdown === student.id && (
                                                        <div className="absolute z-10 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-100">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        handleStatusUpdate(student.id, student.last_tracking?.id, 'pending');
                                                                        setOpenStatusDropdown(null);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                                                                        student.tracking_status === 'pending' ? 'bg-yellow-50 font-medium' : ''
                                                                    }`}
                                                                >
                                                                    Pending
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleStatusUpdate(student.id, student.last_tracking?.id, 'processing');
                                                                        setOpenStatusDropdown(null);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                                                                        student.tracking_status === 'processing' ? 'bg-purple-50 font-medium' : ''
                                                                    }`}
                                                                >
                                                                    Processing
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleStatusUpdate(student.id, student.last_tracking?.id, 'to_follow');
                                                                        setOpenStatusDropdown(null);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                                                                        student.tracking_status === 'to_follow' ? 'bg-blue-50 font-medium' : ''
                                                                    }`}
                                                                >
                                                                    To follow
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600">{student.department}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm text-gray-600">{student.program}</span>
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
                                                                router.post(route('super.management.archive-student-from-attention', student.id), {}, {
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

                    {/* Pagination (10 per page) */}
                    {attentionLastPage > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <div className="text-xs text-gray-600">
                                Showing {attentionStartIdx + 1} to {Math.min(attentionEndIdx, attentionTotal)} of {attentionTotal} students
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAttentionCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={attentionCurrentPage === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: attentionLastPage }, (_, i) => i + 1)
                                        .slice(
                                            Math.max(0, attentionCurrentPage - 3),
                                            Math.max(0, attentionCurrentPage - 3) + 5
                                        )
                                        .map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setAttentionCurrentPage(pageNum)}
                                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    attentionCurrentPage === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                </div>
                                <button
                                    onClick={() => setAttentionCurrentPage((p) => Math.min(attentionLastPage, p + 1))}
                                    disabled={attentionCurrentPage === attentionLastPage}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
                                    onClick={() => {
                                        setTrackingTab('recent');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        trackingTab === 'recent'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Recent
                                </button>
                                <button
                                    onClick={() => {
                                        setTrackingTab('archived');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
                    
                    {/* Filters Section - Inside the table */}
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
                                            <div className="flex items-center gap-2 no-print">
                                                <button
                                                    onClick={() => {
                                                        fetch(route('super.management.view-tracking', tracking.id), {
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
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors no-print"
                                                    title="View Details"
                                                >
                                                    View
                                                </button>
                                                {trackingTab === 'archived' && (
                                                        <button
                                                            onClick={() => {
                                                            if (confirm('Are you sure you want to unarchive this tracking record?')) {
                                                                router.post(route('super.management.unarchive-tracking', tracking.id), {}, {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => {
                                                                        fetchTrackingRecords(trackingPagination.current_page, trackingFilters);
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
                                                                router.post(route('super.management.restore-tracking', tracking.id), {}, {
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
                        
                        {/* Pagination */}
                        {trackingPagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
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
                {showTrackingModal && selectedStudentForTracking && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8 mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-semibold text-gray-900">{editingTracking ? 'Edit Tracking' : 'Track Student'}: {selectedStudentForTracking.name || selectedStudentForTracking.id}</h3>
                                <div className="flex items-center gap-3">
                                    {editingTracking && editingTracking.can_edit ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to archive this tracking record?')) {
                                                        router.post(route('super.management.archive-tracking', editingTracking.id), {}, {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                setShowTrackingModal(false);
                                                                setSelectedStudentForTracking(null);
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
                                        </>
                                    ) : null}
                                    <button
                                        onClick={() => {
                                            setShowTrackingModal(false);
                                            setSelectedStudentForTracking(null);
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
                                    <select
                                        value={trackingForm.type}
                                        onChange={(e) => setTrackingForm({ ...trackingForm, type: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="call">Call</option>
                                        <option value="home_visit">Home Visit</option>
                                    </select>
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
                                    <select
                                        value={trackingForm.status}
                                        onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="to_follow">To follow</option>
                                        <option value="processing">Processing</option>
                                    </select>
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
                                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                                    {/* Send to CSDL Button - Only show when not editing */}
                                    {!editingTracking && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Close tracking modal and open CSDL modal
                                                setShowTrackingModal(false);
                                                setSelectedStudentForCSDL(selectedStudentForTracking);
                                                setShowSendToCSDLModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Send to CSDL
                                        </button>
                                    )}
                                    {editingTracking && <div></div>}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTrackingModal(false);
                                                setSelectedStudentForTracking(null);
                                                setEditingTracking(null);
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
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Tracking Modal */}
                {showViewTrackingModal && viewingTracking && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowViewTrackingModal(false);
                                setViewingTracking(null);
                            }
                        }}
                    >
                        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Tracking Record Details</h3>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        {viewingTracking.student?.name} • {viewingTracking.student?.student_number}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowViewTrackingModal(false);
                                        setViewingTracking(null);
                                    }}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    aria-label="Close"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-5 sm:p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <div className="space-y-5">
                                        <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Student</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Section</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.student.section}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Department</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.student.department}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-gray-500">Program</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.student.program}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Tracking</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Type</p>
                                                    <p className="font-medium text-gray-900 capitalize">{viewingTracking.type.replace('_', ' ')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Status</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingTracking.status)}`}>
                                                        {viewingTracking.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Date</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.date}</p>
                                                </div>
                                                {viewingTracking.time ? (
                                                    <div>
                                                        <p className="text-gray-500">Time</p>
                                                        <p className="font-medium text-gray-900">{viewingTracking.time}</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-500">Time</p>
                                                        <p className="font-medium text-gray-400">—</p>
                                                    </div>
                                                )}
                                                <div className="sm:col-span-2">
                                                    <p className="text-gray-500">Tracked By</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.tracked_by}</p>
                                                </div>
                                                {viewingTracking.follow_up_date && (
                                                    <div className="sm:col-span-2">
                                                        <p className="text-gray-500">Follow-up Date</p>
                                                        <p className="font-medium text-gray-900">{viewingTracking.follow_up_date}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Record</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Created</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.created_at}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Updated</p>
                                                    <p className="font-medium text-gray-900">{viewingTracking.updated_at}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Notes</h4>
                                        {viewingTracking.notes ? (
                                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 whitespace-pre-wrap max-h-[320px] overflow-y-auto">
                                                {viewingTracking.notes}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-400">
                                                No notes added.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        onClick={() => {
                                            setShowViewTrackingModal(false);
                                            setViewingTracking(null);
                                        }}
                                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        Close
                                    </button>
                                    {viewingTracking.can_edit && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to archive this tracking record?')) {
                                                    router.post(route('super.management.archive-tracking', viewingTracking.id), {}, {
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
                                            className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/20"
                                        >
                                            Archive Record
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderAttendance = () => (
        <div className="space-y-6">
            {/* Attendance Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                            Attendance
                        </h2>
                        <p className="text-gray-600 mt-2 text-lg">
                            Monitor and manage student attendance records
                        </p>
                    </div>
                </div>
            </div>

                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Normal</h3>
                        <p className="text-3xl font-bold text-green-900">{liveAttendanceStats?.present_count || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-6 border-l-4 border-yellow-500">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">SLIP</h3>
                        <p className="text-3xl font-bold text-yellow-900">{liveAttendanceStats?.late_count || 0}</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-6 border-l-4 border-red-500">
                        <h3 className="text-sm font-medium text-red-600 mb-2">PNS</h3>
                        <p className="text-3xl font-bold text-red-900">{liveAttendanceStats?.absent_count || 0}</p>
                    </div>
                </div>

                {/* Real-time Attendance Trends */}
                <div className="bg-white rounded-3xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Real-time Attendance Trends</h3>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live Data</span>
                        </div>
                    </div>

                    {/* Weekly Status Progress Graph */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Student Status Distribution</h4>
                        <div className="bg-gray-50 rounded-2xl p-6">
                            {liveWeeklyStatusProgress && liveWeeklyStatusProgress.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {liveWeeklyStatusProgress.map((week, weekIndex) => (
                                        <div key={weekIndex} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                                            <div className="mb-4">
                                                <div className="text-sm font-semibold text-gray-900 mb-1">{week.week_label}</div>
                                                <div className="text-xs text-gray-500">{week.date_label}</div>
                                            </div>
                                            
                                            {/* Combined Progress Bar */}
                                            <div className="mb-4">
                                                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
                                                    {/* Normal Status Bar */}
                                                    {week.normal_percentage > 0 && (
                                                        <div 
                                                            className="bg-green-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.normal_percentage}%` }}
                                                            title={`Normal: ${week.normal_percentage}%`}
                                                        >
                                                            {week.normal_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.normal_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* SLIP Status Bar */}
                                                    {week.slip_percentage > 0 && (
                                                        <div 
                                                            className="bg-yellow-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.slip_percentage}%` }}
                                                            title={`SLIP: ${week.slip_percentage}%`}
                                                        >
                                                            {week.slip_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.slip_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* PNS Status Bar */}
                                                    {week.pns_percentage > 0 && (
                                                        <div 
                                                            className="bg-red-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.pns_percentage}%` }}
                                                            title={`PNS: ${week.pns_percentage}%`}
                                                        >
                                                            {week.pns_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.pns_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Status Breakdown */}
                                            <div className="space-y-2">
                                                {/* Normal Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">Normal</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.normal_count}</div>
                                                        <div className="text-xs text-gray-500">{week.normal_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                
                                                {/* SLIP Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">SLIP</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.slip_count}</div>
                                                        <div className="text-xs text-gray-500">{week.slip_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                
                                                {/* PNS Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">PNS</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.pns_count}</div>
                                                        <div className="text-xs text-gray-500">{week.pns_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Total Students</span>
                                                    <span className="text-sm font-bold text-gray-900">{week.total_students}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">No weekly status data available</p>
                                        <p className="text-gray-400 text-sm">Weekly summaries need to be generated to display this data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Department Attendance Rates */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Student Status Distribution</h4>
                        <div className="space-y-6">
                            {departmentRates.length > 0 ? (
                                departmentRates.map((dept) => (
                                    <div key={dept.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        {/* Department Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900">{dept.name}</h4>
                                                {dept.code && <p className="text-sm text-gray-500">{dept.code}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Total Students</p>
                                                <p className="text-2xl font-bold text-gray-900">{dept.total_students || 0}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Department Status Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Department Status Distribution</span>
                                            </div>
                                            <div className="w-full h-10 bg-gray-200 rounded-lg overflow-hidden flex">
                                                {/* Normal Status Bar */}
                                                {dept.normal_percentage > 0 && (
                                                    <div 
                                                        className="bg-green-500 h-full flex items-center justify-center transition-all duration-500"
                                                        style={{ width: `${dept.normal_percentage}%` }}
                                                        title={`Normal: ${dept.normal_percentage}%`}
                                                    >
                                                        {dept.normal_percentage >= 5 && (
                                                            <span className="text-xs font-semibold text-white px-1">{dept.normal_percentage.toFixed(1)}%</span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* SLIP Status Bar */}
                                                {dept.slip_percentage > 0 && (
                                                    <div 
                                                        className="bg-yellow-500 h-full flex items-center justify-center transition-all duration-500"
                                                        style={{ width: `${dept.slip_percentage}%` }}
                                                        title={`SLIP: ${dept.slip_percentage}%`}
                                                    >
                                                        {dept.slip_percentage >= 5 && (
                                                            <span className="text-xs font-semibold text-white px-1">{dept.slip_percentage.toFixed(1)}%</span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* PNS Status Bar */}
                                                {dept.pns_percentage > 0 && (
                                                    <div 
                                                        className="bg-red-500 h-full flex items-center justify-center transition-all duration-500"
                                                        style={{ width: `${dept.pns_percentage}%` }}
                                                        title={`PNS: ${dept.pns_percentage}%`}
                                                    >
                                                        {dept.pns_percentage >= 5 && (
                                                            <span className="text-xs font-semibold text-white px-1">{dept.pns_percentage.toFixed(1)}%</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Status Breakdown */}
                                            <div className="grid grid-cols-3 gap-4 mt-3">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Normal</span>
                                                    </div>
                                                    <p className="text-lg font-semibold text-gray-900">{dept.normal_count || 0}</p>
                                                    <p className="text-xs text-gray-500">{dept.normal_percentage?.toFixed(1) || 0}%</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">SLIP</span>
                                                    </div>
                                                    <p className="text-lg font-semibold text-gray-900">{dept.slip_count || 0}</p>
                                                    <p className="text-xs text-gray-500">{dept.slip_percentage?.toFixed(1) || 0}%</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">PNS</span>
                                                    </div>
                                                    <p className="text-lg font-semibold text-gray-900">{dept.pns_count || 0}</p>
                                                    <p className="text-xs text-gray-500">{dept.pns_percentage?.toFixed(1) || 0}%</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Programs within Department */}
                                        {dept.programs && dept.programs.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <h5 className="text-md font-semibold text-gray-900 mb-4">Programs ({dept.programs.length})</h5>
                                                <div className="space-y-4">
                                                    {dept.programs.map((program) => (
                                                        <div key={program.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h6 className="text-sm font-semibold text-gray-900">{program.name}</h6>
                                                                    {program.code && <p className="text-xs text-gray-500">{program.code}</p>}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-gray-500">Students</p>
                                                                    <p className="text-sm font-bold text-gray-900">{program.total_students || 0}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Program Status Progress Bar */}
                                                            <div className="mb-3">
                                                                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
                                                                    {/* Normal Status Bar */}
                                                                    {program.normal_percentage > 0 && (
                                                                        <div 
                                                                            className="bg-green-500 h-full flex items-center justify-center transition-all duration-500"
                                                                            style={{ width: `${program.normal_percentage}%` }}
                                                                            title={`Normal: ${program.normal_percentage}%`}
                                                                        >
                                                                            {program.normal_percentage >= 5 && (
                                                                                <span className="text-xs font-semibold text-white px-1">{program.normal_percentage.toFixed(1)}%</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {/* SLIP Status Bar */}
                                                                    {program.slip_percentage > 0 && (
                                                                        <div 
                                                                            className="bg-yellow-500 h-full flex items-center justify-center transition-all duration-500"
                                                                            style={{ width: `${program.slip_percentage}%` }}
                                                                            title={`SLIP: ${program.slip_percentage}%`}
                                                                        >
                                                                            {program.slip_percentage >= 5 && (
                                                                                <span className="text-xs font-semibold text-white px-1">{program.slip_percentage.toFixed(1)}%</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {/* PNS Status Bar */}
                                                                    {program.pns_percentage > 0 && (
                                                                        <div 
                                                                            className="bg-red-500 h-full flex items-center justify-center transition-all duration-500"
                                                                            style={{ width: `${program.pns_percentage}%` }}
                                                                            title={`PNS: ${program.pns_percentage}%`}
                                                                        >
                                                                            {program.pns_percentage >= 5 && (
                                                                                <span className="text-xs font-semibold text-white px-1">{program.pns_percentage.toFixed(1)}%</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Program Status Breakdown */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                        <span className="text-xs text-gray-600">Normal</span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold text-gray-900">{program.normal_count || 0}</p>
                                                                    <p className="text-xs text-gray-500">{program.normal_percentage?.toFixed(1) || 0}%</p>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                                        <span className="text-xs text-gray-600">SLIP</span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold text-gray-900">{program.slip_count || 0}</p>
                                                                    <p className="text-xs text-gray-500">{program.slip_percentage?.toFixed(1) || 0}%</p>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                                        <span className="text-xs text-gray-600">PNS</span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold text-gray-900">{program.pns_count || 0}</p>
                                                                    <p className="text-xs text-gray-500">{program.pns_percentage?.toFixed(1) || 0}%</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="border border-gray-200 rounded-lg p-8 bg-white text-center">
                                    <p className="text-gray-500">Loading department rates...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );


    const renderSections = () => (
        <div className="space-y-6">
            {/* Sections Header */}
            <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6"></div>

                {/* Sections Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Sections</h3>
                        <p className="text-3xl font-bold text-blue-900">{sections?.length || 0}</p>
                        </div>
                    <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Active Sections</h3>
                        <p className="text-3xl font-bold text-green-900">{sections?.filter(s => s.academic_year === new Date().getFullYear().toString()).length || 0}</p>
                        </div>
                    <div className="bg-purple-50 rounded-2xl p-6 border-l-4 border-purple-500">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">Departments</h3>
                        <p className="text-3xl font-bold text-purple-900">{departments?.length || 0}</p>
                        </div>
                    <div className="bg-orange-50 rounded-2xl p-6 border-l-4 border-orange-500">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">Programs</h3>
                        <p className="text-3xl font-bold text-orange-900">{programs?.length || 0}</p>
                    </div>
                </div>

                {/* Add New Section (match Schedules UI) */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Add New Section</h3>
                        <p className="mt-1 text-sm text-gray-600">Create a new section by selecting department, program, and details.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department *</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.department_id}
                                onChange={(e) => setSectionForm({...sectionForm, department_id: e.target.value, program_id: ''})}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments?.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Program *</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.program_id}
                                onChange={(e) => setSectionForm({...sectionForm, program_id: e.target.value})}
                                required
                                disabled={!sectionForm.department_id}
                            >
                                <option value="">Select Program</option>
                                {programs?.filter(p => String(p.department_id) === String(sectionForm.department_id)).map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Section Name *</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.name}
                                onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                                placeholder="e.g., A, B, C"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Year Level *</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.year_level}
                                onChange={(e) => setSectionForm({...sectionForm, year_level: e.target.value})}
                                required
                            >
                                <option value="">Select Year Level</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.academic_year}
                                onChange={(e) => setSectionForm({...sectionForm, academic_year: e.target.value})}
                                placeholder="2025"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Semester *</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.semester}
                                onChange={(e) => setSectionForm({...sectionForm, semester: e.target.value})}
                                required
                            >
                                <option value="1st Semester">1st Semester</option>
                                <option value="2nd Semester">2nd Semester</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Adviser Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.adviser_name}
                                onChange={(e) => setSectionForm({...sectionForm, adviser_name: e.target.value})}
                                placeholder="Enter adviser name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Students</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                value={sectionForm.max_students}
                                min="1"
                                max="100"
                                onChange={(e) => setSectionForm({...sectionForm, max_students: parseInt(e.target.value) || 50})}
                                placeholder="e.g., 50"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleCreateSection}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            Create Section
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input
                                type="text"
                                placeholder="Filter by department..."
                                value={sectionFilters.department}
                                onChange={(e) => setSectionFilters({...sectionFilters, department: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                            <input
                                type="text"
                                placeholder="Filter by program..."
                                value={sectionFilters.program}
                                onChange={(e) => setSectionFilters({...sectionFilters, program: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                            <input
                                type="text"
                                placeholder="Filter by year level..."
                                value={sectionFilters.year_level}
                                onChange={(e) => setSectionFilters({...sectionFilters, year_level: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <input
                                type="text"
                                placeholder="Filter by academic year..."
                                value={sectionFilters.academic_year}
                                onChange={(e) => setSectionFilters({...sectionFilters, academic_year: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                        <button 
                            onClick={() => setSectionFilters({department: '', program: '', year_level: '', academic_year: ''})}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Clear Filters
                        </button>
                        <span className="text-sm text-gray-500">
                            Showing {filteredSections.length} of {sectionsData.length} sections
                        </span>
                    </div>
                </div>

                {/* Sections Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 table-scroll" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Section Code</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Department</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Program</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Year Level</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Adviser</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Students</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredSections.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                        <p className="text-lg font-medium text-gray-900">No sections found</p>
                                                        <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSections.map((section) => {
                                                // Generate section code
                                                const programCode = section.program?.code || '';
                                                let yearLevelDigit = '';
                                                if (section.year_level) {
                                                    const yearLevelStr = String(section.year_level);
                                                    const match = yearLevelStr.match(/^(\d)/);
                                                    yearLevelDigit = match ? match[1] : yearLevelStr.charAt(0);
                                                }
                                                const sectionCode = programCode && yearLevelDigit && section.name
                                                    ? `${programCode}${yearLevelDigit}-${section.name}`
                                                    : section.name || 'N/A';
                                                
                                                // Get department name
                                                let departmentName = 'No Department';
                                                if (section.program?.department?.name) {
                                                    departmentName = section.program.department.name;
                                                } else if (section.program?.department_id && departments) {
                                                    const dept = departments.find(d => d.id == section.program.department_id);
                                                    departmentName = dept?.name || 'No Department';
                                                } else if (section.department?.name) {
                                                    departmentName = section.department.name;
                                                } else if (typeof section.department === 'string') {
                                                    departmentName = section.department;
                                                }
                                                
                                                const programName = section.program?.name || section.program || 'No Program';
                                                const cleanAdviserName = section.adviser_name?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || 'No Adviser';
                                                
                                                return (
                                                    <tr key={section.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <div className="font-medium text-gray-900">{sectionCode}</div>
                                                            <div className="text-xs text-gray-500">{section.academic_year} • {section.semester}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                                {departmentName}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{programName}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                                {section.year_level}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{cleanAdviserName}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                                {section.students_count || 0} students
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm sticky right-0 bg-white">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <button
                                                                    onClick={() => openSectionModal(section)}
                                                                    className="font-medium text-green-600 hover:text-green-800 transition-colors"
                                                                    title="Edit Section"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSection(section.id)}
                                                                    className="font-medium text-red-600 hover:text-red-800 transition-colors"
                                                                    title="Delete Section"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(route('super.students.store'), studentForm, {
            onSuccess: () => {
                setShowAddStudentModal(false);
                setStudentForm({
                    first_name: '',
                    last_name: '',
                    student_number: '',
                    email: '',
                    phone: '',
                    department_id: '',
                    program_id: '',
                    section_id: '',
                    teacher_id: '',
                    year_level: '',
                    gender: '',
                    birth_date: '',
                    guardian_name: '',
                    guardian_contact: ''
                });
                setStudentFormFilteredPrograms([]);
                setStudentFormFilteredSections([]);
                setSectionTeachers([]);
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
        
        router.post(route('super.students.import'), formData, {
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
        const studentsToExport = filteredStudents?.length ? filteredStudents : (localStudents || []);

        const printRootId = 'super-students-print-root';
        const styleId = 'super-students-print-style';

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
        title.textContent = 'Super Admin Students Export';
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

    const renderTeachers = () => {
        const teachers = teachersProp || [];
        
        return (
        <div className="space-y-6">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                Teachers/Advisers
                            </h2>
                            <p className="text-gray-600 mt-2 text-lg">
                                Manage teachers and section advisers
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setTeacherForm({
                                        name: '',
                                        email: '',
                                        department_id: '',
                                        optional_department_id: ''
                                    });
                                    setShowAddTeacherModal(true);
                                }}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium flex items-center"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Teacher/Adviser
                            </button>
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {teachers.length} Teachers/Advisers
                            </span>
                        </div>
                    </div>
                </div>

                {/* Teachers/Advisers Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">Teachers/Advisers List</h3>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 table-scroll" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Name</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Email</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Primary Department</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Optional Department</th>
                                            <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {teachers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className="text-lg font-medium text-gray-900">No teachers/advisers found</p>
                                                        <p className="text-sm text-gray-500 mt-1">Click "Add Teacher/Adviser" to create one</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            teachers.map((teacher) => (
                                                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {teacher.name}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {teacher.email}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {teacher.department?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {teacher.optional_department?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white hover:bg-gray-50">
                                                        <div className="flex items-center space-x-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTeacher(teacher);
                                                                    setTeacherForm({
                                                                        name: teacher.name,
                                                                        email: teacher.email,
                                                                        department_id: teacher.department_id || '',
                                                                        optional_department_id: teacher.optional_department_id || ''
                                                                    });
                                                                    setShowEditTeacherModal(true);
                                                                }}
                                                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                                                title="Edit Teacher/Adviser"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                                                                        router.delete(route('super.teachers.destroy', teacher.id), {
                                                                            onSuccess: () => {
                                                                                router.reload();
                                                                            },
                                                                            onError: (errors) => {
                                                                                alert('Failed to delete teacher: ' + (errors.message || 'Unknown error'));
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150"
                                                                title="Delete Teacher/Adviser"
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
                </div>
            </div>
        );
    };

    const renderSettings = () => {
        // Calculate pagination values inside renderSettings to ensure they're always available
        const studentsTotalPagesCalc = Math.ceil((filteredStudents?.length || 0) / studentsPerPage);
        const studentsStartIndexCalc = (studentsCurrentPage - 1) * studentsPerPage;
        const studentsEndIndexCalc = studentsStartIndexCalc + studentsPerPage;
        const paginatedStudentsCalc = (filteredStudents || []).slice(studentsStartIndexCalc, studentsEndIndexCalc);
        
        return (
        <div className="space-y-6">
            {/* Students Tab - Always show when settings tab is active */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
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
                                    onClick={handleExportStudents}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold flex items-center focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </button>
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {localStudents?.length || 0} Students
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
                                        {departments?.map(dept => (
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
                                onClick={() => {
                                    setSelectedDepartment('');
                                    setSelectedProgram('');
                                    setSelectedYearLevel('');
                                    setSelectedStatus('');
                                    setSearchTerm('');
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={!selectedDepartment && !selectedProgram && !selectedYearLevel && !selectedStatus && !searchTerm}
                            >
                                Clear Filters
                            </button>
                            <div className="text-sm text-gray-500">
                                Showing {studentsStartIndex + 1}-{Math.min(studentsEndIndex, filteredStudents.length)} of {filteredStudents.length} students
                            </div>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col print-section">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto flex-1 table-scroll" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                            <div className="inline-block min-w-full align-middle">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Name</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Email</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Department</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Year Level</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Status</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">Absences</th>
                                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50 no-print">Actions</th>
                                </tr>
                            </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                    {paginatedStudentsCalc.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-sm text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                    </svg>
                                                    <p className="text-lg font-medium text-gray-900">No students found</p>
                                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedStudentsCalc.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.student_id || student.student_number}
                                            </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="font-medium">{student.first_name} {student.last_name}</div>
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
                                                    {student.department?.name || student.section?.program?.department?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {student.year_level || 'N/A'}
                                                            </span>
                                            </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                {(() => {
                                                    // Prioritize manually set status, then use calculated attendance_status
                                                    const displayStatus = (student.status && ['Normal', 'SLIP', 'PNS'].includes(student.status)) 
                                                        ? student.status 
                                                        : (student.attendance_status || 'Normal');
                                                    return (
                                                        <span 
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                displayStatus === 'Normal'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : displayStatus === 'SLIP'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                            title={displayStatus === 'PNS' ? 'Probable No-Show: No attendance at all' : ''}
                                                        >
                                                            {displayStatus === 'PNS' ? 'Probable No-Show' : displayStatus}
                                                        </span>
                                                    );
                                                })()}
                                        </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    <span className="font-medium">{student.absence_count || 0}</span>
                                        </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white hover:bg-gray-50 no-print">
                                                    <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        
                                                        // Get the actual saved values from the student object
                                                        // Use the status field if it's Normal/SLIP/PNS, otherwise calculate from absence_count
                                                        const absCount = parseInt(student.absence_count) || 0;
                                                        let attendanceStatus = 'Normal';
                                                        
                                                        // Check if status is manually set (Normal, SLIP, PNS)
                                                        if (student.status && ['Normal', 'SLIP', 'PNS'].includes(student.status)) {
                                                            attendanceStatus = student.status;
                                                        } else {
                                                            // Calculate from absence_count if status is not manually set
                                                            if (absCount >= 8) {
                                                                attendanceStatus = 'PNS';
                                                            } else if (absCount >= 4) {
                                                                attendanceStatus = 'SLIP';
                                                            }
                                                        }
                                                        
                                                        setEditStudentForm({
                                                            first_name: student.first_name || '',
                                                            last_name: student.last_name || '',
                                                            email: student.email || '',
                                                            phone: student.phone || '',
                                                            guardian_name: student.guardian_name || '',
                                                            guardian_contact: student.guardian_contact || '',
                                                            year_level: student.year_level || '',
                                                            status: student.tracking_status || student.last_tracking?.status || 'pending',
                                                            absence_count: absCount, // Use the actual saved value
                                                            attendance_status: attendanceStatus, // Use saved status or calculated
                                                        });
                                                        setStudentFormErrors({});
                                                        setShowStudentModal(true);
                                                    }}
                                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150 no-print"
                                                            title="View Details"
                                                >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                        </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
                                                            router.delete(`/super/students/${student.id}`, {
                                                                onSuccess: () => {
                                                                    router.reload();
                                                                },
                                                                onError: (errors) => {
                                                                    alert('Failed to delete student: ' + (errors.message || 'Unknown error'));
                                                                }
                                                            });
                                                        }
                                                    }}
                                                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150 no-print"
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
                        
                        {/* Pagination Controls */}
                        {studentsTotalPagesCalc > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="text-xs text-gray-600">
                                    Showing {studentsStartIndexCalc + 1} to {Math.min(studentsEndIndexCalc, filteredStudents.length)} of {filteredStudents.length} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStudentsCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={studentsCurrentPage === 1}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, studentsTotalPagesCalc) }, (_, i) => {
                                            let pageNum;
                                            if (studentsTotalPagesCalc <= 5) {
                                                pageNum = i + 1;
                                            } else if (studentsCurrentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (studentsCurrentPage >= studentsTotalPagesCalc - 2) {
                                                pageNum = studentsTotalPagesCalc - 4 + i;
                                            } else {
                                                pageNum = studentsCurrentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setStudentsCurrentPage(pageNum)}
                                                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                        studentsCurrentPage === pageNum
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
                                        onClick={() => setStudentsCurrentPage(prev => Math.min(studentsTotalPagesCalc, prev + 1))}
                                        disabled={studentsCurrentPage === studentsTotalPagesCalc}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* System Tools Tab */}
            {activeSettingsTab === 'tools' && (
                <div className="bg-white rounded-lg shadow p-8">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                                    System Admin
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    System administration tools and utilities
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Cache Management */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Cache Management</h3>
                                    <p className="text-sm text-gray-600">Clear application cache</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('cache', 'clear-cache')}
                                disabled={isLoading && selectedTool === 'cache'}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'cache' ? 'Clearing...' : 'Clear Cache'}
                            </button>
                        </div>

                        {/* System Optimization */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Optimization</h3>
                                    <p className="text-sm text-gray-600">Optimize system performance</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('optimization', 'optimize')}
                                disabled={isLoading && selectedTool === 'optimization'}
                                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'optimization' ? 'Optimizing...' : 'Optimize System'}
                            </button>
                        </div>

                        {/* Database Backup */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                    </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Database Backup</h3>
                                    <p className="text-sm text-gray-600">Create system backup</p>
                </div>
            </div>
                            <button 
                                onClick={() => handleToolAction('backup', 'backup')}
                                disabled={isLoading && selectedTool === 'backup'}
                                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'backup' ? 'Creating...' : 'Create Backup'}
                            </button>
        </div>

                        {/* Maintenance Mode */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
            </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
                                    <p className="text-sm text-gray-600">Enable maintenance mode</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToolAction('maintenance', 'maintenance')}
                                disabled={isLoading && selectedTool === 'maintenance'}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'maintenance' ? 'Processing...' : 'Enable Maintenance'}
                            </button>
                        </div>

                        {/* System Logs */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                    </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                                    <p className="text-sm text-gray-600">View system logs</p>
                </div>
            </div>
                            <button 
                                onClick={() => handleToolAction('logs', 'view-logs')}
                                disabled={isLoading && selectedTool === 'logs'}
                                className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {isLoading && selectedTool === 'logs' ? 'Loading...' : 'View Logs'}
                            </button>
        </div>

                        {/* System Status */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
            </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                                    <p className="text-sm text-gray-600">Check system health</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setNotification({ type: 'info', message: 'System status: All systems operational' })}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Check Status
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Temporarily disabled - Sections Management Tab */}
            {/* {activeSettingsTab === 'sections' && (
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Sections Management</h2>
                        <button
                            onClick={() => router.get(route('super.sections'))}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Manage Sections
                        </button>
                    </div>
                    
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sections Management</h3>
                        <p className="text-gray-600 mb-6">Access the comprehensive sections management interface to create, edit, and manage all university sections.</p>
                        <button
                            onClick={() => router.get(route('super.sections'))}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Open Sections Management
                        </button>
                    </div>
                </div>
            )} */}

            {/* System Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
                                <button
                                    onClick={() => setShowLogs(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
            </div>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                                {systemLogs.length > 0 ? (
                                    systemLogs.map((log, index) => (
                                        <div key={index} className="mb-1">
                                            <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No logs available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Intervention Modal */}
            {console.log('Modal state:', { 
                showInterventionModal, 
                viewingIntervention: viewingIntervention ? 'has data' : 'null', 
                editingIntervention: editingIntervention ? 'has data' : 'null' 
            })}
            {showInterventionModal && (
                console.log('Rendering modal with data:', { viewingIntervention, editingIntervention })
            )}
            {showInterventionModal && (
                <div className="fixed inset-0 bg-red-500 bg-opacity-90 overflow-y-auto h-full w-full z-[9999]" style={{zIndex: 9999}}>
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" style={{backgroundColor: 'white', border: '2px solid red'}}>
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {viewingIntervention ? 'View Intervention' : editingIntervention ? 'Edit Intervention' : 'Add New Intervention'}
                                </h3>
                                <button
                                    onClick={() => {
                                        console.log('Closing intervention modal');
                                        setShowInterventionModal(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Test Content */}
                            <div className="p-4 bg-yellow-100 border-2 border-yellow-500">
                                <h4 className="text-lg font-bold text-red-600">MODAL IS WORKING!</h4>
                                <p>If you can see this, the modal is rendering correctly.</p>
                                <p>showInterventionModal: {showInterventionModal ? 'true' : 'false'}</p>
                                <p>viewingIntervention: {viewingIntervention ? 'has data' : 'null'}</p>
                                <p>editingIntervention: {editingIntervention ? 'has data' : 'null'}</p>
                            </div>
                            
                            {viewingIntervention ? (
                                // View Mode with Status Update
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Student</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {viewingIntervention.student?.first_name} {viewingIntervention.student?.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Student Number</label>
                                            <p className="mt-1 text-sm text-gray-900">{viewingIntervention.student?.student_number}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <p className="mt-1 text-sm text-gray-900">{viewingIntervention.type}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                viewingIntervention.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                viewingIntervention.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {viewingIntervention.priority}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Current Status</label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                viewingIntervention.status === 'done' ? 'bg-green-100 text-green-800' :
                                                viewingIntervention.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {viewingIntervention.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingIntervention.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Details</label>
                                        <p className="mt-1 text-sm text-gray-900">{viewingIntervention.details}</p>
                                    </div>
                                    {viewingIntervention.due_date && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingIntervention.due_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    
                                    {/* Status Update Section */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Update Status</h4>
                                        <div className="flex items-center space-x-4">
                                            <select
                                                value={viewingIntervention.status}
                                                onChange={(e) => {
                                                    const updatedIntervention = { ...viewingIntervention, status: e.target.value };
                                                    setViewingIntervention(updatedIntervention);
                                                }}
                                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                                <option value="no_response">No Response</option>
                                            </select>
                                            <button
                                                onClick={() => handleUpdateInterventionStatus(viewingIntervention.id, viewingIntervention.status)}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                            >
                                                {isLoading ? 'Updating...' : 'Update Status'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Edit/Create Mode
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Student</label>
                                        <select
                                            value={interventionForm.student_id}
                                            onChange={(e) => setInterventionForm({...interventionForm, student_id: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Student</option>
                                            {students?.map(student => (
                                                <option key={student.id} value={student.id}>
                                                    {student.first_name} {student.last_name} ({student.student_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <input
                                            type="text"
                                            value={interventionForm.type}
                                            onChange={(e) => setInterventionForm({...interventionForm, type: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Details</label>
                                        <textarea
                                            value={interventionForm.details}
                                            onChange={(e) => setInterventionForm({...interventionForm, details: e.target.value})}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                                            <select
                                                value={interventionForm.priority}
                                                onChange={(e) => setInterventionForm({...interventionForm, priority: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                value={interventionForm.status}
                                                onChange={(e) => setInterventionForm({...interventionForm, status: e.target.value})}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                                <option value="no_response">No Response</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                        <input
                                            type="date"
                                            value={interventionForm.due_date}
                                            onChange={(e) => setInterventionForm({...interventionForm, due_date: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowInterventionModal(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={editingIntervention ? handleUpdateIntervention : handleCreateIntervention}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                        >
                                            {isLoading ? 'Saving...' : (editingIntervention ? 'Update' : 'Create')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
        );
    };

    const renderDashboard = () => {
        return (
            <div className="space-y-8">
                {/* Main Dashboard Title */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                    <button
                        onClick={refreshDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
                
                {/* Dashboard Overview - Main Summary Panel */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Dashboard Overview</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* Total Students Monitored */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-600">Total Students</p>
                                    <p className="text-2xl font-bold text-blue-900">{systemStats?.totalStudents || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Average Attendance Rate */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-purple-600">Avg Attendance</p>
                                    <p className="text-2xl font-bold text-purple-900">{systemStats?.averageAttendanceRate || 0}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Departments */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-orange-600">Departments</p>
                                    <p className="text-2xl font-bold text-orange-900">{systemStats?.totalDepartments || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Programs */}
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-teal-600">Total Programs</p>
                                    <p className="text-2xl font-bold text-teal-900">{systemStats?.totalPrograms || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Analytics Graphs */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Attendance Analytics</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {/* Weekly Status Progress Graph */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Student Status Distribution</h4>
                            {liveWeeklyStatusProgress && liveWeeklyStatusProgress.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {liveWeeklyStatusProgress.map((week, weekIndex) => (
                                        <div key={weekIndex} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                                            <div className="mb-4">
                                                <div className="text-sm font-semibold text-gray-900 mb-1">{week.week_label}</div>
                                                <div className="text-xs text-gray-500">{week.date_label}</div>
                                            </div>
                                            
                                            {/* Combined Progress Bar */}
                                            <div className="mb-4">
                                                <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
                                                    {/* Normal Status Bar */}
                                                    {week.normal_percentage > 0 && (
                                                        <div 
                                                            className="bg-green-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.normal_percentage}%` }}
                                                            title={`Normal: ${week.normal_percentage}%`}
                                                        >
                                                            {week.normal_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.normal_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* SLIP Status Bar */}
                                                    {week.slip_percentage > 0 && (
                                                        <div 
                                                            className="bg-yellow-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.slip_percentage}%` }}
                                                            title={`SLIP: ${week.slip_percentage}%`}
                                                        >
                                                            {week.slip_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.slip_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* PNS Status Bar */}
                                                    {week.pns_percentage > 0 && (
                                                        <div 
                                                            className="bg-red-500 h-full flex items-center justify-center transition-all duration-500"
                                                            style={{ width: `${week.pns_percentage}%` }}
                                                            title={`PNS: ${week.pns_percentage}%`}
                                                        >
                                                            {week.pns_percentage >= 5 && (
                                                                <span className="text-xs font-semibold text-white">{week.pns_percentage.toFixed(1)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Status Breakdown */}
                                            <div className="space-y-2">
                                                {/* Normal Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">Normal</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.normal_count}</div>
                                                        <div className="text-xs text-gray-500">{week.normal_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                
                                                {/* SLIP Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">SLIP</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.slip_count}</div>
                                                        <div className="text-xs text-gray-500">{week.slip_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                
                                                {/* PNS Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                        <span className="text-sm text-gray-700">PNS</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{week.pns_count}</div>
                                                        <div className="text-xs text-gray-500">{week.pns_percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Total Students</span>
                                                    <span className="text-sm font-bold text-gray-900">{week.total_students}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">No weekly status data available</p>
                                        <p className="text-gray-400 text-sm">Weekly summaries need to be generated to display this data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Recent User Activities - Detailed List */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Recent User Activities</h3>
                        <p className="text-sm text-gray-500 mt-1">All activities from CSDL users and Admins</p>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {recentUserActivities && recentUserActivities.length > 0 ? (
                            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                                {recentUserActivities.map((activity, index) => {
                                    const getRoleColor = (role) => {
                                        if (role === 'CSDL') return 'bg-green-100 text-green-800';
                                        if (role === 'Admin') return 'bg-blue-100 text-blue-800';
                                        if (role === 'Super Admin') return 'bg-purple-100 text-purple-800';
                                        return 'bg-gray-100 text-gray-800';
                                    };

                                    const getStatusIcon = (status) => {
                                        if (status === 'success') return '✓';
                                        if (status === 'failed') return '✗';
                                        if (status === 'warning') return '⚠';
                                        return '•';
                                    };

                                    const getStatusColor = (status) => {
                                        if (status === 'success') return 'text-green-600';
                                        if (status === 'failed') return 'text-red-600';
                                        if (status === 'warning') return 'text-yellow-600';
                                        return 'text-gray-600';
                                    };

                                    return (
                                        <div key={activity.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                        {(activity.user_name || activity.user_email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {activity.user_name || activity.user_email || 'Unknown User'}
                                                        </p>
                                                        {activity.user_role && (
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(activity.user_role)}`}>
                                                                {activity.user_role}
                                                            </span>
                                                        )}
                                                        <span className={`text-sm ${getStatusColor(activity.status)}`}>
                                                            {getStatusIcon(activity.status)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        {activity.description || 'No description available'}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        {activity.date && (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {activity.date}
                                                            </span>
                                                        )}
                                                        {activity.time && (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {activity.time}
                                                            </span>
                                                        )}
                                                        {activity.time_ago && (
                                                            <span className="text-gray-400">
                                                                {activity.time_ago}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">No recent user activities found</p>
                                <p className="text-xs text-gray-400 mt-1">Activities from CSDL users and Admins will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={pageTitle} />
            
            <div className="py-8">
                <div className="w-full px-6">
                    {/* Notification */}
                    {notification && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            notification.type === 'success' ? 'bg-green-100 text-green-800' :
                            notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {notification.message}
                        </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'management' && renderManagement()}
                    {activeTab === 'attendance' && renderAttendance()}
                    {activeTab === 'sections' && renderSections()}
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'teachers' && renderTeachers()}
                </div>
            </div>

            {/* Section Modal */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingSection ? 'Edit Section' : 'Add New Section'}
                                </h2>
                                <button
                                    onClick={() => setShowSectionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                        <input
                                            type="text"
                                            value={sectionForm.name}
                                            onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., A, B, C"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                        <select
                                            value={sectionForm.year_level}
                                            onChange={(e) => setSectionForm({...sectionForm, year_level: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <select
                                            value={sectionForm.department_id}
                                            onChange={(e) => {
                                                setSectionForm({...sectionForm, department_id: e.target.value, program_id: ''});
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                        <select
                                            value={sectionForm.program_id}
                                            onChange={(e) => setSectionForm({...sectionForm, program_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={!sectionForm.department_id}
                                        >
                                            <option value="">Select Program</option>
                                            {programs?.filter(program => program.department_id == sectionForm.department_id).map(program => (
                                                <option key={program.id} value={program.id}>{program.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                        <input
                                            type="text"
                                            value={sectionForm.academic_year}
                                            onChange={(e) => setSectionForm({...sectionForm, academic_year: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                        <select
                                            value={sectionForm.semester}
                                            onChange={(e) => setSectionForm({...sectionForm, semester: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="1st Semester">1st Semester</option>
                                            <option value="2nd Semester">2nd Semester</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adviser Name</label>
                                        <input
                                            type="text"
                                            value={sectionForm.adviser_name}
                                            onChange={(e) => setSectionForm({...sectionForm, adviser_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter adviser name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                                        <input
                                            type="number"
                                            value={sectionForm.max_students}
                                            onChange={(e) => setSectionForm({...sectionForm, max_students: parseInt(e.target.value) || 50})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            max="100"
                                            placeholder="e.g., 50"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowSectionModal(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingSection ? handleUpdateSection : handleCreateSection}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : (editingSection ? 'Update Section' : 'Create Section')}
                                    </button>
                                </div>
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
                            <form onSubmit={handleAddStudent} className="space-y-6">
                                {(duplicateStudentNumber || duplicateStudentEmail) && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Duplicate entry detected. Please use a unique student number and email.
                                    </div>
                                )}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-600 flex items-center">
                                        <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 0 0118 0z" />
                                        </svg>
                                        Provide the student details below.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.first_name}
                                            onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.last_name}
                                            onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Student Number</label>
                                        <input
                                            type="text"
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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${studentFormErrors.student_number ? 'border-red-400' : 'border-gray-200'}`}
                                            placeholder="e.g., 2024-00001"
                                        />
                                        {studentFormErrors.student_number && (
                                            <p className="mt-1 text-sm text-red-600">{studentFormErrors.student_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${studentFormErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                                            placeholder="student@example.com"
                                        />
                                        {studentFormErrors.email && (
                                            <p className="mt-1 text-sm text-red-600">{studentFormErrors.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{11}"
                                        maxLength={11}
                                        value={studentForm.phone}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                            setStudentForm({...studentForm, phone: sanitized});
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="e.g. 09123456789"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                                        <select
                                            value={studentForm.department_id}
                                            onChange={(e) => setStudentForm({...studentForm, department_id: e.target.value, program_id: '', section_id: '', teacher_id: ''})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(department => (
                                                <option key={department.id} value={department.id}>{department.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                                        <select
                                            value={studentForm.program_id}
                                            onChange={(e) => setStudentForm({...studentForm, program_id: e.target.value, section_id: '', teacher_id: ''})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                            disabled={!studentForm.department_id}
                                        >
                                            <option value="">Select Program</option>
                                            {studentFormFilteredPrograms?.map(program => (
                                                <option key={program.id} value={program.id}>{program.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                                        <select
                                            value={studentForm.section_id}
                                            onChange={(e) => setStudentForm({...studentForm, section_id: e.target.value, teacher_id: ''})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            disabled={!studentForm.program_id}
                                        >
                                            <option value="">Select Section</option>
                                            {studentFormFilteredSections?.map(section => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                                        <select
                                            value={studentForm.teacher_id}
                                            onChange={(e) => setStudentForm({...studentForm, teacher_id: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            disabled={!studentForm.department_id}
                                        >
                                            <option value="">Select Teacher</option>
                                            {sectionTeachers?.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
                                        <select
                                            value={studentForm.year_level}
                                            onChange={(e) => setStudentForm({...studentForm, year_level: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                        <select
                                            value={studentForm.gender}
                                            onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                            onChange={(e) => setStudentForm({...studentForm, birth_date: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Name</label>
                                    <input
                                        type="text"
                                        value={studentForm.guardian_name}
                                        onChange={(e) => setStudentForm({...studentForm, guardian_name: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Guardian's full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Contact</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{11}"
                                        maxLength={11}
                                        value={studentForm.guardian_contact}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                            setStudentForm({...studentForm, guardian_contact: sanitized});
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="11-digit phone number"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddStudentModal(false);
                                            setStudentFormErrors({});
                                        }}
                                        className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || duplicateStudentNumber || duplicateStudentEmail}
                                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold shadow-lg transition-all flex items-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 4.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647A7.962 7.962 0 0112 20a7.962 7.962 0 01-8-8z"></path>
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Student
                                            </>
                                        )}
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
                            setCsdlForm({ type: 'home_visit', notes: '' });
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
                                        setCsdlForm({ type: 'home_visit', notes: '' });
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
                                    Student: <span className="font-semibold">
                                        {selectedStudentForCSDL.first_name && selectedStudentForCSDL.last_name 
                                            ? `${selectedStudentForCSDL.first_name} ${selectedStudentForCSDL.last_name}`
                                            : selectedStudentForCSDL.name || 'Unknown'}
                                    </span>
                                </p>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                router.post(route('super.students.send-to-csdl', selectedStudentForCSDL.id), {
                                    type: 'home_visit',
                                    notes: csdlForm.notes
                                }, {
                                    onSuccess: () => {
                                        const sentId = selectedStudentForCSDL.id;
                                        setAttentionStudents((prev) => (prev || []).filter((s) => s.id !== sentId));

                                        setShowSendToCSDLModal(false);
                                        setSelectedStudentForCSDL(null);
                                        setCsdlForm({ type: 'home_visit', notes: '' });
                                        router.reload({ only: ['studentsNeedingCalls', 'stats', 'recentTracking'] });
                                    },
                                    onError: () => {
                                        alert('Failed to send student to CSDL');
                                    }
                                });
                            }}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={csdlForm.notes}
                                        onChange={(e) => setCsdlForm({...csdlForm, notes: e.target.value})}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional notes for CSDL regarding this home visit..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSendToCSDLModal(false);
                                            setSelectedStudentForCSDL(null);
                                            setCsdlForm({ type: 'home_visit', notes: '' });
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
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
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
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
                                    <button
                                        type="button"
                                        onClick={() => setShowImportModal(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
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

            {/* Student View Modal */}
            {showStudentModal && selectedStudent && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowStudentModal(false);
                            setSelectedStudent(null);
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
                                        <p><span className="font-medium">Absence Count:</span> {selectedStudent.absence_count || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Student</h3>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
        setIsSavingStudent(true);
        // Ensure absence_count is an integer and calculate attendance_status
        const absCount = parseInt(editStudentForm.absence_count) || 0;
        let attendanceStatus = 'Normal';
        if (absCount >= 8) {
            attendanceStatus = 'PNS';
        } else if (absCount >= 4) {
            attendanceStatus = 'SLIP';
        }
        
        // Prepare form data - send attendance_status as 'status' for backend
        const formData = {
            first_name: editStudentForm.first_name,
            last_name: editStudentForm.last_name,
            email: editStudentForm.email,
            phone: editStudentForm.phone,
            guardian_name: editStudentForm.guardian_name,
            guardian_contact: editStudentForm.guardian_contact,
            year_level: editStudentForm.year_level,
            status: attendanceStatus, // Send attendance_status as 'status' to backend
            absence_count: absCount,
            tracking_status: editStudentForm.status, // Send tracking status separately
        };
        router.patch(route('super.students.update', selectedStudent.id), formData, {
            onSuccess: (page) => {
                setIsSavingStudent(false);
                setStudentFormErrors({});
                setShowStudentModal(false);
                
                // Reload students data to get updated status, priority, and absence_count from server
                router.reload({ 
                    only: ['students'],
                    preserveScroll: true,
                });
            },
            onError: (errors) => {
                setIsSavingStudent(false);
                console.error('Error updating student:', errors);
                
                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    // Set field-level errors
                    const fieldErrors = {};
                    Object.keys(errors).forEach(key => {
                        if (Array.isArray(errors[key]) && errors[key].length > 0) {
                            fieldErrors[key] = errors[key][0];
                        } else if (typeof errors[key] === 'string') {
                            fieldErrors[key] = errors[key];
                        }
                    });
                    setStudentFormErrors(fieldErrors);
                    
                    // Show alert with first error message
                    const firstError = Object.values(fieldErrors)[0] || 'Please check the form and try again.';
                    alert(`Failed to update student: ${firstError}`);
                } else {
                    // Generic error message
                    const errorMessage = errors?.message || errors?.error || 'Please check the form and try again.';
                    alert(`Failed to update student: ${errorMessage}`);
                    setStudentFormErrors({});
                }
            },
            onFinish: () => setIsSavingStudent(false),
        });
                                    }}
                                    className="space-y-4"
                                >
                                    {(duplicateEditStudentEmail || studentFormErrors.email) && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Email already exists. Please use a different email.
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                value={editStudentForm.first_name}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, first_name: e.target.value });
                                                    if (studentFormErrors.first_name) {
                                                        setStudentFormErrors({ ...studentFormErrors, first_name: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.first_name ? 'border-red-500' : ''}`}
                                            />
                                            {studentFormErrors.first_name && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.first_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={editStudentForm.last_name}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, last_name: e.target.value });
                                                    if (studentFormErrors.last_name) {
                                                        setStudentFormErrors({ ...studentFormErrors, last_name: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.last_name ? 'border-red-500' : ''}`}
                                            />
                                            {studentFormErrors.last_name && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.last_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editStudentForm.email}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, email: e.target.value });
                                                    if (studentFormErrors.email) {
                                                        setStudentFormErrors({ ...studentFormErrors, email: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.email ? 'border-red-500' : ''}`}
                                            />
                                            {studentFormErrors.email && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                value={editStudentForm.phone}
                                                onChange={(e) => {
                                                    const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                    setEditStudentForm({ ...editStudentForm, phone: sanitized });
                                                    if (studentFormErrors.phone) {
                                                        setStudentFormErrors({ ...studentFormErrors, phone: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.phone ? 'border-red-500' : ''}`}
                                                placeholder="11-digit phone"
                                            />
                                            {studentFormErrors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                                            <input
                                                type="text"
                                                value={editStudentForm.guardian_name}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, guardian_name: e.target.value });
                                                    if (studentFormErrors.guardian_name) {
                                                        setStudentFormErrors({ ...studentFormErrors, guardian_name: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.guardian_name ? 'border-red-500' : ''}`}
                                            />
                                            {studentFormErrors.guardian_name && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.guardian_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                value={editStudentForm.guardian_contact}
                                                onChange={(e) => {
                                                    const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                    setEditStudentForm({ ...editStudentForm, guardian_contact: sanitized });
                                                    if (studentFormErrors.guardian_contact) {
                                                        setStudentFormErrors({ ...studentFormErrors, guardian_contact: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.guardian_contact ? 'border-red-500' : ''}`}
                                                placeholder="11-digit phone"
                                            />
                                            {studentFormErrors.guardian_contact && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.guardian_contact}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                            <input
                                                type="text"
                                                value={editStudentForm.year_level}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, year_level: e.target.value });
                                                    if (studentFormErrors.year_level) {
                                                        setStudentFormErrors({ ...studentFormErrors, year_level: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.year_level ? 'border-red-500' : ''}`}
                                            />
                                            {studentFormErrors.year_level && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.year_level}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Status</label>
                                            <select
                                                value={editStudentForm.status}
                                                onChange={(e) => {
                                                    setEditStudentForm({ ...editStudentForm, status: e.target.value });
                                                    if (studentFormErrors.status) {
                                                        setStudentFormErrors({ ...studentFormErrors, status: null });
                                                    }
                                                }}
                                                className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.status ? 'border-red-500' : ''}`}
                                            >
                                                {studentStatusOptions.map((status) => {
                                                    const value = status.toLowerCase().replace(' ', '_');
                                                    return <option key={status} value={value}>{status}</option>;
                                                })}
                                            </select>
                                            {studentFormErrors.status && (
                                                <p className="mt-1 text-sm text-red-600">{studentFormErrors.status}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Status</label>
                                            <div className={`w-full border rounded-lg px-3 py-2 bg-gray-50 ${
                                                editStudentForm.attendance_status === 'Normal'
                                                    ? 'border-green-200 bg-green-50'
                                                    : editStudentForm.attendance_status === 'SLIP'
                                                    ? 'border-yellow-200 bg-yellow-50'
                                                    : 'border-red-200 bg-red-50'
                                            }`}>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    editStudentForm.attendance_status === 'Normal'
                                                        ? 'bg-green-100 text-green-800'
                                                        : editStudentForm.attendance_status === 'SLIP'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {editStudentForm.attendance_status}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">Auto-calculated from absences</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Absences</label>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={editStudentForm.absence_count}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                const absCount = value === '' ? 0 : Number(value);
                                                
                                                // Automatically calculate attendance_status based on absence_count
                                                let attendanceStatus = 'Normal';
                                                if (absCount >= 8) {
                                                    attendanceStatus = 'PNS';
                                                } else if (absCount >= 4) {
                                                    attendanceStatus = 'SLIP';
                                                }
                                                
                                                setEditStudentForm({ 
                                                    ...editStudentForm, 
                                                    absence_count: absCount,
                                                    attendance_status: attendanceStatus
                                                });
                                                if (studentFormErrors.absence_count) {
                                                    setStudentFormErrors({ ...studentFormErrors, absence_count: null });
                                                }
                                            }}
                                            className={`w-full border rounded-lg px-3 py-2 ${studentFormErrors.absence_count ? 'border-red-500' : ''}`}
                                        />
                                        {studentFormErrors.absence_count && (
                                            <p className="mt-1 text-sm text-red-600">{studentFormErrors.absence_count}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Get the actual saved values from the student object
                                                const absCount = parseInt(selectedStudent.absence_count) || 0;
                                                let attendanceStatus = 'Normal';
                                                
                                                // Check if status is manually set (Normal, SLIP, PNS)
                                                if (selectedStudent.status && ['Normal', 'SLIP', 'PNS'].includes(selectedStudent.status)) {
                                                    attendanceStatus = selectedStudent.status;
                                                } else {
                                                    // Calculate from absence_count if status is not manually set
                                                    if (absCount >= 8) {
                                                        attendanceStatus = 'PNS';
                                                    } else if (absCount >= 4) {
                                                        attendanceStatus = 'SLIP';
                                                    }
                                                }
                                                
                                                setEditStudentForm({
                                                    first_name: selectedStudent.first_name || '',
                                                    last_name: selectedStudent.last_name || '',
                                                    email: selectedStudent.email || '',
                                                    phone: selectedStudent.phone || '',
                                                    guardian_name: selectedStudent.guardian_name || '',
                                                    guardian_contact: selectedStudent.guardian_contact || '',
                                                    year_level: selectedStudent.year_level || '',
                                                    status: selectedStudent.tracking_status || selectedStudent.last_tracking?.status || 'pending',
                                                    absence_count: absCount, // Use the actual saved value
                                                    attendance_status: attendanceStatus, // Use saved status or calculated
                                                });
                                                setStudentFormErrors({});
                                                setShowStudentModal(false);
                                            }}
                                            className="px-4 py-2 rounded-lg border"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSavingStudent || !!duplicateEditStudentEmail}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSavingStudent ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Students Modal - Removed, using print instead */}
            {false && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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

            {/* Add Teacher/Adviser Modal */}
            {showAddTeacherModal && typeof window !== 'undefined' && createPortal((
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && closeAddTeacherModal()}
                >
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">Teacher Setup</p>
                                    <h2 className="text-2xl font-bold text-gray-900">Add New Teacher/Adviser</h2>
                                </div>
                                <button
                                    onClick={closeAddTeacherModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                router.post(route('super.teachers.store'), teacherForm, {
                                    onSuccess: () => {
                                        closeAddTeacherModal();
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
                                        setTeacherFormErrors(fieldErrors);
                                    }
                                });
                            }} className="space-y-6">
                                {(duplicateTeacherEmail || teacherFormErrors.email) && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Email already exists. Please use a different email.
                                    </div>
                                )}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-600 flex items-center">
                                        <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Please fill in all required fields marked with *
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={teacherForm.name}
                                            onChange={(e) => {
                                                if (teacherFormErrors.name) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, name: null });
                                                }
                                                setTeacherForm({...teacherForm, name: e.target.value});
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter full name"
                                        />
                                        {teacherFormErrors.name && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={teacherForm.email || ''}
                                            onChange={(e) => {
                                                if (teacherFormErrors.email) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, email: null });
                                                }
                                                setTeacherForm({...teacherForm, email: e.target.value});
                                            }}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${teacherFormErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                                            placeholder="Enter email address"
                                        />
                                        {teacherFormErrors.email && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                                        <select
                                            required
                                            value={teacherForm.department_id}
                                            onChange={(e) => {
                                                if (teacherFormErrors.department_id) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, department_id: null });
                                                }
                                                setTeacherForm({...teacherForm, department_id: e.target.value});
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {teacherFormErrors.department_id && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.department_id}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Optional Department</label>
                                        <select
                                            value={teacherForm.optional_department_id}
                                            onChange={(e) => setTeacherForm({...teacherForm, optional_department_id: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">None</option>
                                            {departments?.filter(d => d.id != teacherForm.department_id).map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeAddTeacherModal}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!!duplicateTeacherEmail}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        Add Teacher/Adviser
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ), document.body)}

            {/* Edit Teacher/Adviser Modal */}
            {showEditTeacherModal && selectedTeacher && typeof window !== 'undefined' && createPortal((
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && closeEditTeacherModal()}
                >
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Teacher Update</p>
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Teacher/Adviser</h2>
                                </div>
                                <button
                                    onClick={closeEditTeacherModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                router.put(route('super.teachers.update', selectedTeacher.id), teacherForm, {
                                    onSuccess: () => {
                                        setShowEditTeacherModal(false);
                                        setSelectedTeacher(null);
                                        setTeacherFormErrors({});
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
                                        setTeacherFormErrors(fieldErrors);
                                    }
                                });
                            }} className="space-y-6">
                                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                    <p className="flex items-center text-sm text-gray-600">
                                        <svg className="mr-2 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Update required fields marked with *.
                                    </p>
                                </div>
                                {(duplicateTeacherEmail || teacherFormErrors.email) && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Email already exists. Please use a different email.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={teacherForm.name}
                                            onChange={(e) => {
                                                if (teacherFormErrors.name) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, name: null });
                                                }
                                                setTeacherForm({...teacherForm, name: e.target.value});
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter full name"
                                        />
                                        {teacherFormErrors.name && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={teacherForm.email}
                                            onChange={(e) => {
                                                if (teacherFormErrors.email) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, email: null });
                                                }
                                                setTeacherForm({...teacherForm, email: e.target.value});
                                            }}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${teacherFormErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                                            placeholder="Enter email address"
                                        />
                                        {teacherFormErrors.email && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                                        <select
                                            required
                                            value={teacherForm.department_id}
                                            onChange={(e) => {
                                                if (teacherFormErrors.department_id) {
                                                    setTeacherFormErrors({ ...teacherFormErrors, department_id: null });
                                                }
                                                setTeacherForm({...teacherForm, department_id: e.target.value});
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {teacherFormErrors.department_id && (
                                            <p className="mt-1 text-sm text-red-600">{teacherFormErrors.department_id}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Optional Department</label>
                                        <select
                                            value={teacherForm.optional_department_id}
                                            onChange={(e) => setTeacherForm({...teacherForm, optional_department_id: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">None</option>
                                            {departments?.filter(d => d.id != teacherForm.department_id).map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeEditTeacherModal}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!!duplicateTeacherEmail}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Update Teacher/Adviser
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ), document.body)}
        </AuthenticatedLayout>
    );
};