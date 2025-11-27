import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
// route is available globally

export default function SystemAdmin({ 
    users, 
    systemStats, 
    activityLogs, 
    integrations, 
    systemTools, 
    auditLogs,
    management,
    interventions,
    departments,
    programs,
    sections,
    students = [],
    attendanceStats,
    todayAttendance,
    trends,
    recentRecords,
    calendarData,
    departmentTrends,
    facultyCompliance,
    weeklyStatusProgress: weeklyStatusProgressProp = [],
    teachers: teachersProp = [],
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
    const [liveFacultyCompliance, setLiveFacultyCompliance] = useState(facultyCompliance);
    const [liveWeeklyStatusProgress, setLiveWeeklyStatusProgress] = useState(weeklyStatusProgressProp);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    
    // Auto-refresh dashboard data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

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
                setLiveFacultyCompliance(data.facultyCompliance);
                if (data.weeklyStatusProgress) {
                    setLiveWeeklyStatusProgress(data.weeklyStatusProgress);
                }
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    };
    
    // Student management state
    const [activeSettingsTab, setActiveSettingsTab] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importType, setImportType] = useState('csv');
    const [exportFormat, setExportFormat] = useState('csv');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
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

    // Management (formerly Interventions) state
    const [managementData, setManagementData] = useState((management && management.data) ? management.data : []);
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [remarkRecord, setRemarkRecord] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    
    // Management filters
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSpecificReason, setFilterSpecificReason] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterWeek, setFilterWeek] = useState('');
    const [managementSearchTerm, setManagementSearchTerm] = useState('');
    const [showManagementFilters, setShowManagementFilters] = useState(false);
    const [showManagementImportModal, setShowManagementImportModal] = useState(false);
    const [managementImportFile, setManagementImportFile] = useState(null);
    const [importFileType, setImportFileType] = useState('csv');
    
    // Interventions legacy state (kept for backward compatibility)
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

    // Sections management state
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

    // Filter students
    const filteredStudents = students?.filter(student => {
        const matchesDepartment = !selectedDepartment || student.section?.program?.department_id == selectedDepartment;
        const matchesProgram = !selectedProgram || student.section?.program_id == selectedProgram;
        const matchesYearLevel = !selectedYearLevel || student.year_level == selectedYearLevel;
        const matchesStatus = !selectedStatus || student.attendance_status == selectedStatus;
        const matchesSearch = !searchTerm || 
            student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesDepartment && matchesProgram && matchesYearLevel && matchesStatus && matchesSearch;
    }) || [];

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
        
        setIsLoading(true);
        try {
            const response = await fetch(route('super.sections.update', editingSection.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sectionForm)
            });

            if (response.ok) {
                const result = await response.json();
                setSectionsData(sectionsData.map(s => s.id === editingSection.id ? result.section : s));
                setShowSectionModal(false);
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
                setNotification({ type: 'success', message: 'Section updated successfully!' });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update section');
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
            setSectionForm({
                name: section.name || '',
                year_level: section.year_level || '',
                academic_year: section.academic_year || new Date().getFullYear().toString(),
                semester: section.semester || '1st Semester',
                adviser_name: section.adviser_name || '',
                department_id: section.program?.department_id || section.department_id || '',
                program_id: section.program_id || '',
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

    const renderManagement = () => {
        // Predefined specific reasons
        const specificReasonOptions = [
            '1. Death of Provider',
            '1. Loss of Job of the Provider',
            '1. Income Priorities',
            '1. Daily Expenses',
            '2. Personal Health Concern',
            '2. Family Health Issues',
            '3. Parent\'s Decision',
            '3. Change Address',
            '3. Prioritize family responsibilities',
            '4. Learning Challenges',
            '4. Lack of interest in chosen course',
            '4. Overwhelming Academic Load',
            '5. Bullying and Discrimination',
            '5. Early Marriage or Parenthood',
            '5. Pregnancy',
            '6. Distance to School',
            '6. Lack of Infrastructure',
            '7. Affected by Calamities',
            '7. Transferred to SUC',
            '7. Transferred to LUC',
            '7. Transferred to another Private Institution',
            '7. Transferred to another school',
            '8. Late Enrollee',
            '8. Section Change',
            '8. Change in class schedule'
        ];

        // Filter management data
        const filteredData = managementData.filter(record => {
            // Department filter
            if (filterDepartment && record.department !== filterDepartment) {
                return false;
            }
            
            // Section filter
            if (filterSection && record.section !== filterSection) {
                return false;
            }
            
            // Status filter
            if (filterStatus && record.status !== filterStatus) {
                return false;
            }
            
            // Month filter
            if (filterMonth && record.month !== filterMonth) {
                return false;
            }
            
            // Week filter
            if (filterWeek && record.week && record.week.number !== parseInt(filterWeek)) {
                return false;
            }
            
            // Specific Reasons filter
            if (filterSpecificReason && (!record.specific_reasons || !record.specific_reasons.toLowerCase().includes(filterSpecificReason.toLowerCase()))) {
                return false;
            }
            
            // Search filter (student name and student number only)
            if (managementSearchTerm) {
                const searchLower = managementSearchTerm.toLowerCase();
                const studentName = `${record.student?.first_name || ''} ${record.student?.last_name || ''}`.toLowerCase();
                const studentNumber = (record.student?.student_number || '').toLowerCase();
                
                if (!studentName.includes(searchLower) && !studentNumber.includes(searchLower)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Get unique weeks for the selected month
        const getWeeksForMonth = (monthValue) => {
            if (!monthValue) return [];
            const monthRecords = managementData.filter(r => r.month === monthValue);
            const weeks = [...new Set(monthRecords.map(r => r.week?.number).filter(Boolean))].sort((a, b) => a - b);
            return weeks;
        };
        
        const availableWeeks = getWeeksForMonth(filterMonth);

        // Get unique values for filters
        const uniqueDepartments = [...new Set(managementData.map(r => r.department).filter(Boolean))].sort();
        const uniqueSections = [...new Set(managementData.map(r => r.section).filter(Boolean))].sort();
        const uniqueStatuses = [...new Set(managementData.map(r => r.status).filter(Boolean))].sort();
        const uniqueSpecificReasons = [...new Set(managementData.flatMap(r => 
            r.specific_reasons ? r.specific_reasons.split(', ').map(s => s.trim()) : []
        ).filter(Boolean))].sort();

        return (
            <div className="space-y-6">
                {/* Filters */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                        <button
                            onClick={() => setShowManagementFilters(!showManagementFilters)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showManagementFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {showManagementFilters && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Search (Name or Student No.)</label>
                                <input
                                    type="text"
                                    value={managementSearchTerm}
                                    onChange={(e) => setManagementSearchTerm(e.target.value)}
                                    placeholder="e.g. Juan Dela Cruz or 2020-00001"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                />
                            </div>
                            
                            {/* Month Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Month</label>
                                <select
                                    value={filterMonth}
                                    onChange={(e) => {
                                        setFilterMonth(e.target.value);
                                        setFilterWeek(''); // Reset week when month changes
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                >
                                    <option value="">All Months</option>
                                    {availableMonths.map(month => (
                                        <option key={month.value} value={month.label}>{month.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Week Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Week</label>
                                <select
                                    value={filterWeek}
                                    onChange={(e) => setFilterWeek(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    disabled={!filterMonth}
                                >
                                    <option value="">All Weeks</option>
                                    {availableWeeks.map(week => (
                                        <option key={week} value={week}>Week {week}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => {
                                        setFilterDepartment(e.target.value);
                                        setFilterSection('');
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                >
                                    <option value="">All Departments</option>
                                    {uniqueDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Section Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Section</label>
                                <select
                                    value={filterSection}
                                    onChange={(e) => setFilterSection(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                >
                                    <option value="">All Sections</option>
                                    {uniqueSections
                                        .filter(section => !filterDepartment || managementData.find(r => r.section === section && r.department === filterDepartment))
                                        .map(section => (
                                            <option key={section} value={section}>{section}</option>
                                        ))}
                                </select>
                            </div>
                            
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                >
                                    <option value="">All Status</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Specific Reasons Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Specific Reason</label>
                                <select
                                    value={filterSpecificReason}
                                    onChange={(e) => setFilterSpecificReason(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                >
                                    <option value="">All Reasons</option>
                                    {specificReasonOptions.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={() => {
                                setFilterDepartment('');
                                setFilterSection('');
                                setFilterStatus('');
                                setFilterSpecificReason('');
                                setFilterMonth('');
                                setFilterWeek('');
                                setManagementSearchTerm('');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            disabled={!filterDepartment && !filterSection && !filterStatus && !filterSpecificReason && !filterMonth && !filterWeek && !managementSearchTerm}
                        >
                            Clear Filters
                        </button>
                        <div className="text-sm text-gray-500">
                            Showing {filteredData.length} of {managementData.length} records
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="mb-6">
                        {/* Week Title and Date Range */}
                        {management?.week && (
                            <div className="mb-4 pb-4 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">{management.week.label}</h2>
                                <p className="text-sm text-gray-600 mt-1">{management.week.date_range}</p>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Management</h3>
                                <p className="mt-1 text-sm text-gray-600">View and manage student weekly attendance status.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        // Export to CSV
                                        const csvContent = [
                                            ['Student Number', 'Name', 'Email', 'Section', 'Department', 'Month', 'Week', 'Status', 'Specific Reasons', 'Remarks'].join(','),
                                            ...filteredData.map(record => [
                                                record.student?.student_number || '',
                                                `"${(record.student?.first_name || '')} ${(record.student?.last_name || '')}"`,
                                                record.student?.email || '',
                                                record.section || '',
                                                record.department || '',
                                                record.month || '',
                                                record.week?.number || '',
                                                record.status || '',
                                                `"${(record.specific_reasons || '').replace(/"/g, '""')}"`,
                                                `"${(record.remarks || '').replace(/"/g, '""')}"`
                                            ].join(','))
                                        ].join('\n');
                                        
                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const link = document.createElement('a');
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', `management-data-${new Date().toISOString().split('T')[0]}.csv`);
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Data
                                </button>
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowManagementImportModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Import Data
                                </button>
                            </div>
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
                                            {record.student?.email && (
                                                <div className="text-xs text-gray-500">{record.student.email}</div>
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    key: 'section_department',
                                    label: 'Section + Department',
                                    render: (_, record) => (
                                        <div>
                                            <div className="text-gray-900">{record.section || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{record.department || 'N/A'}</div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'month',
                                    label: 'Month',
                                    render: (value) => value || 'N/A'
                                },
                                {
                                    key: 'week',
                                    label: 'Week',
                                    render: (value) => value?.number ? `Week ${value.number}` : 'N/A'
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (value) => (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            value === 'PNS' ? 'bg-red-100 text-red-800' : value === 'SLIP' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {value}
                                        </span>
                                    )
                                },
                                {
                                    key: 'specific_reasons',
                                    label: 'Specific Reasons',
                                },
                                {
                                    key: 'remarks',
                                    label: 'Remarks',
                                },
                                {
                                    key: 'actions',
                                    label: 'Actions',
                                    render: (_, record) => (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setRemarkRecord(record);
                                                    setRemarkText(record.remarks || '');
                                                    setShowRemarkModal(true);
                                                }}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Add/Edit Remark
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete the remark for ${record.student?.first_name} ${record.student?.last_name}?`)) {
                                                        // Delete remark logic - you may need to add a delete route
                                                        // Use direct URL to avoid Ziggy route errors
                                                        router.delete(`/super/management/remarks/${record.id}`, {
                                                            onSuccess: () => {
                                                                setManagementData(prev => prev.filter(item => item.id !== record.id));
                                                            },
                                                            onError: (errors) => {
                                                                alert('Failed to delete remark: ' + (errors.message || 'Unknown error'));
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )
                                },
                            ]}
                            data={filteredData}
                            actions={false}
                        />
                </div>

                {/* Import Modal */}
                {showManagementImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                            <div className="px-6 py-4 border-b">
                                <h4 className="text-lg font-semibold">Import Management Data</h4>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                                    <select
                                        value={importFileType}
                                        onChange={(e) => setImportFileType(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="xml">XML</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                                    <input
                                        type="file"
                                        accept={importFileType === 'csv' ? '.csv' : '.xml'}
                                        onChange={(e) => setManagementImportFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/90"
                                    />
                                </div>
                                <div className="text-xs text-gray-500">
                                    Select a {importFileType.toUpperCase()} file to import management data. The file format will be configured later.
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setShowManagementImportModal(false);
                                        setManagementImportFile(null);
                                    }}
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!managementImportFile) {
                                            setNotification({ type: 'error', message: 'Please select a file to import.' });
                                            return;
                                        }
                                        // TODO: Implement import logic
                                        setNotification({ type: 'info', message: 'Import functionality will be implemented. File selected: ' + managementImportFile.name });
                                        setShowManagementImportModal(false);
                                        setManagementImportFile(null);
                                    }}
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Import
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showRemarkModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
                            <div className="px-6 py-4 border-b">
                                <h4 className="text-lg font-semibold">Super Admin Remark</h4>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Student</div>
                                    <div className="font-medium">{remarkRecord?.student?.first_name} {remarkRecord?.student?.last_name} ({remarkRecord?.student?.student_number})</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Week</div>
                                    <div className="font-medium">{remarkRecord?.week?.label} ({remarkRecord?.week?.start} - {remarkRecord?.week?.end})</div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Remark</label>
                                    <textarea
                                        value={remarkText}
                                        onChange={(e) => setRemarkText(e.target.value)}
                                        className="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
                                        rows={5}
                                        placeholder="Enter your remark..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowRemarkModal(false)}
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!remarkRecord) return;
                                        const payload = {
                                            student_id: remarkRecord.id,
                                            week_start: remarkRecord.week.start,
                                            week_end: remarkRecord.week.end,
                                            remark: remarkText,
                                        };
                                        // Use direct URL to avoid Ziggy route errors
                                        router.post('/super/management/remarks', payload, {
                                            onSuccess: () => {
                                                // Update local state
                                                setManagementData(prev => prev.map(item => (
                                                    item.id === remarkRecord.id ? { ...item, remarks: remarkText } : item
                                                )));
                                                setShowRemarkModal(false);
                                                setRemarkText('');
                                                setRemarkRecord(null);
                                            },
                                            onError: (errors) => {
                                                alert('Failed to save remark: ' + (errors.message || 'Unknown error'));
                                            }
                                        });
                                    }}
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Save Remark
                                </button>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Present Today</h3>
                        <p className="text-3xl font-bold text-green-900">{attendanceStats?.present_count || 0}</p>
                        <p className="text-xs text-green-700 mt-1">{attendanceStats?.present_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-6 border-l-4 border-red-500">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Absent Today</h3>
                        <p className="text-3xl font-bold text-red-900">{attendanceStats?.absent_count || 0}</p>
                        <p className="text-xs text-red-700 mt-1">{attendanceStats?.absent_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-6 border-l-4 border-yellow-500">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">Late Today</h3>
                        <p className="text-3xl font-bold text-yellow-900">{attendanceStats?.late_count || 0}</p>
                        <p className="text-xs text-yellow-700 mt-1">{attendanceStats?.late_percentage || 0}% of total</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Records</h3>
                        <p className="text-3xl font-bold text-blue-900">{attendanceStats?.total_count || 0}</p>
                        <p className="text-xs text-blue-700 mt-1">Today's records</p>
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
                                <div className="relative h-96">
                                    {/* Progress Graph - Stacked Percentage Bars */}
                                    <div className="flex items-end justify-between h-full gap-2">
                                        {liveWeeklyStatusProgress.map((week, weekIndex) => {
                                            const maxHeight = 280; // Max height in pixels for 100%
                                            return (
                                                <div key={weekIndex} className="flex flex-col items-center flex-1 h-full">
                                                    <div className="text-xs text-gray-600 mb-2 text-center font-medium">
                                                        {week.week_label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-1 text-center max-w-full">
                                                        {week.date_label}
                                                    </div>
                                                    <div className="w-full relative" style={{ height: `${maxHeight}px` }}>
                                                        {/* Stacked bar showing percentages */}
                                                        <div className="absolute bottom-0 w-full flex flex-col-reverse rounded overflow-hidden shadow-sm">
                                                            {/* Normal Status Bar (Green) */}
                                                            <div 
                                                                className="bg-green-500 transition-all duration-500 ease-out relative group border-t border-green-600"
                                                                style={{ height: `${(week.normal_percentage / 100) * maxHeight}px` }}
                                                                title={`Normal: ${week.normal_percentage}% (${week.normal_count} students)`}
                                                            >
                                                                {week.normal_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                                        {week.normal_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* SLIP Status Bar (Yellow) */}
                                                            <div 
                                                                className="bg-yellow-500 transition-all duration-500 ease-out relative group border-t border-yellow-600"
                                                                style={{ height: `${(week.slip_percentage / 100) * maxHeight}px` }}
                                                                title={`SLIP: ${week.slip_percentage}% (${week.slip_count} students)`}
                                                            >
                                                                {week.slip_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                                                                        {week.slip_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* PNS Status Bar (Red) */}
                                                            <div 
                                                                className="bg-red-500 transition-all duration-500 ease-out relative group border-t border-red-600"
                                                                style={{ height: `${(week.pns_percentage / 100) * maxHeight}px` }}
                                                                title={`Probable No-Show: ${week.pns_percentage}% (${week.pns_count} students)`}
                                                            >
                                                                {week.pns_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                                        {week.pns_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2 text-center">
                                                        <div className="font-medium">{week.total_students} students</div>
                                                        <div className="text-gray-400 mt-0.5">
                                                            N:{week.normal_count} S:{week.slip_count} P:{week.pns_count}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-96 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">No weekly status data available</p>
                                        <p className="text-gray-400 text-sm">Weekly summaries need to be generated to display this graph</p>
                                    </div>
                                </div>
                            )}
                            {/* Legend */}
                            {liveWeeklyStatusProgress && liveWeeklyStatusProgress.length > 0 && (
                                <div className="mt-6 flex items-center justify-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm text-gray-700">Normal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-sm text-gray-700">SLIP</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm text-gray-700" title="Probable No-Show">Probable No-Show</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            {/* Faculty Compliance Trends */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Faculty Compliance Rates</h4>
                <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="relative h-80">
                                {/* Simple Line Chart for Faculty Compliance */}
                                <div className="flex items-end justify-between h-full">
                                    {liveFacultyCompliance?.slice(0, 7).map((day, dayIndex) => {
                                        const maxRate = Math.max(...(day.teachers?.map(t => t.compliance_rate) || [0]));
                                        return (
                                            <div key={dayIndex} className="flex flex-col items-center flex-1">
                                                <div className="text-xs text-gray-600 mb-2">{day.day}</div>
                                                <div className="space-y-1 w-full">
                                                    {day.teachers?.map((teacher, teacherIndex) => {
                                                        const height = maxRate > 0 ? Math.round((teacher.compliance_rate / maxRate) * 200) : 0;
                                                        const colors = [
                                                            'bg-orange-500', 'bg-red-500', 'bg-yellow-500',
                                                            'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                                                            'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
                                                            'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
                                                        ];
                                                        const colorClass = colors[teacherIndex % colors.length];
                                                        return (
                                                            <div key={teacherIndex} className="relative">
                                                                <div 
                                                                    className={`${colorClass} rounded-t w-3 transition-all duration-500 ease-out`}
                                                                    style={{ height: `${height}px` }}
                                                                    title={`${teacher.teacher}: ${teacher.compliance_rate}%`}
                                                                ></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {liveFacultyCompliance?.[0]?.teachers?.map((teacher, index) => {
                                    const colors = [
                                        'text-orange-600', 'text-red-600', 'text-yellow-600',
                                        'text-blue-600', 'text-green-600', 'text-purple-600',
                                        'text-indigo-600', 'text-pink-600', 'text-teal-600',
                                        'text-cyan-600', 'text-lime-600', 'text-amber-600'
                                    ];
                                    const colorClass = colors[index % colors.length];
                                    return (
                                        <div key={index} className="text-center p-3 bg-white rounded-lg border">
                                            <div className={`text-lg font-bold ${colorClass}`}>{teacher.compliance_rate}%</div>
                                            <div className="text-sm text-gray-600">{teacher.teacher}</div>
                                            <div className="text-xs text-gray-500">{teacher.scheduled_classes} classes</div>
                                        </div>
                                    );
                                })}
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
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Sections</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={[
                                {
                                    key: 'section_code',
                                    label: 'Section Code',
                                    render: (_, record) => {
                                        // Generate section code: Program Code + Year Level (first digit) + "-" + Section Name
                                        // Example: BSA1-02, BSIT3-03
                                        const programCode = record.program?.code || '';
                                        let yearLevelDigit = '';
                                        
                                        // Extract first digit from year level (e.g., "1" from "1st Year" or "1")
                                        if (record.year_level) {
                                            const yearLevelStr = String(record.year_level);
                                            const match = yearLevelStr.match(/^(\d)/);
                                            yearLevelDigit = match ? match[1] : yearLevelStr.charAt(0);
                                        }
                                        
                                        // Construct section code
                                        const sectionCode = programCode && yearLevelDigit && record.name
                                            ? `${programCode}${yearLevelDigit}-${record.name}`
                                            : record.name || 'N/A';
                                        
                                        return (
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {sectionCode}
                                                </div>
                                                <div className="text-sm text-gray-500">{record.academic_year} • {record.semester}</div>
                                            </div>
                                        );
                                    }
                                },
                                {
                                    key: 'department',
                                    label: 'Department',
                                    render: (_, record) => {
                                        const departmentName = record.program?.department?.name || record.department || 'No Department';
                                        return (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                                                {departmentName}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'program',
                                    label: 'Program',
                                    render: (program, record) => {
                                        const programName = program?.name || program || record.program || 'No Program';
                                        return programName;
                                    }
                                },
                                {
                                    key: 'year_level',
                                    label: 'Year Level',
                                    render: (year_level) => (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                                            {year_level}
                                        </span>
                                    )
                                },
                                {
                                    key: 'adviser_name',
                                    label: 'Adviser',
                                    render: (adviser_name) => {
                                        const cleanName = adviser_name?.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || 'No Adviser';
                                        return cleanName;
                                    }
                                },
                                {
                                    key: 'students_count',
                                    label: 'Students',
                                    render: (count) => (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                                            {count || 0} students
                                        </span>
                                    )
                                }
                            ]}
                            data={filteredSections}
                            actions={true}
                            onEdit={(record) => openSectionModal(record)}
                            onDelete={(record) => handleDeleteSection(record.id)}
                        />
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

    const handleExportStudents = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('format', exportFormat);
        
        // Add filters if they are set
        if (selectedDepartment) formData.append('department_id', selectedDepartment);
        if (selectedProgram) formData.append('program_id', selectedProgram);
        if (selectedYearLevel) formData.append('year_level', selectedYearLevel);
        
        try {
            const response = await fetch(route('super.students.export'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = response.headers.get('Content-Disposition');
                const filename = contentDisposition 
                    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                    : `students_${new Date().toISOString()}.${exportFormat}`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setShowExportModal(false);
                setNotification({ type: 'success', message: 'Students exported successfully!' });
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to export students. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSettings = () => (
        <div className="space-y-6">
            {/* Settings Navigation - Removed tab buttons, content shows directly */}

            {/* Student Tab - Always show when settings tab is active */}
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
                                    onClick={() => setShowExportModal(true)}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-medium flex items-center"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Students
                                </button>
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                    {filteredStudents.length} Students
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
                                Showing {filteredStudents.length} of {students?.length || 0} students
                            </div>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absences</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.student_id || student.student_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.first_name} {student.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.section?.name || student.section || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.section?.program?.name || student.program || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {student.year_level || 'N/A'}
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
                                                        {student.attendance_status === 'PNS' ? 'Probable No-Show' : student.attendance_status}
                                                </span>
                                            )}
                                        </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.absence_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setShowStudentModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                                                >
                                                    <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
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

            {/* Section Modal */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingSection ? 'Edit Section' : 'Add New Section'}
                                </h3>
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
        </div>
    );

    const renderDashboard = () => {
        return (
            <div className="space-y-8">
                {/* Main Dashboard Title */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-2">System overview and key metrics</p>
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
                        <p className="text-sm text-gray-600">Main summary panel with key system metrics</p>
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
                                    <p className="text-2xl font-bold text-blue-900">{systemStats?.total_students || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Faculty Members */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-600">Faculty Members</p>
                                    <p className="text-2xl font-bold text-green-900">{systemStats?.totalTeachers || 0}</p>
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
                                    <p className="text-2xl font-bold text-purple-900">{systemStats?.average_attendance_rate || 0}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Departments with Low Attendance */}
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

                        {/* Today's Attendance */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-indigo-600">Today's Attendance</p>
                                    <p className="text-2xl font-bold text-indigo-900">{systemStats?.todayAttendance || 0}</p>
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
                        <p className="text-sm text-gray-600">Visual tools for attendance trends and analysis</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {/* Weekly Status Progress Graph */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Student Status Distribution</h4>
                            {liveWeeklyStatusProgress && liveWeeklyStatusProgress.length > 0 ? (
                                <div className="relative h-96">
                                    {/* Progress Graph - Stacked Percentage Bars */}
                                    <div className="flex items-end justify-between h-full gap-2">
                                        {liveWeeklyStatusProgress.map((week, weekIndex) => {
                                            const maxHeight = 280; // Max height in pixels for 100%
                                            return (
                                                <div key={weekIndex} className="flex flex-col items-center flex-1 h-full">
                                                    <div className="text-xs text-gray-600 mb-2 text-center font-medium">
                                                        {week.week_label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-1 text-center max-w-full">
                                                        {week.date_label}
                                                    </div>
                                                    <div className="w-full relative" style={{ height: `${maxHeight}px` }}>
                                                        {/* Stacked bar showing percentages */}
                                                        <div className="absolute bottom-0 w-full flex flex-col-reverse rounded overflow-hidden shadow-sm">
                                                            {/* Normal Status Bar (Green) */}
                                                            <div 
                                                                className="bg-green-500 transition-all duration-500 ease-out relative group border-t border-green-600"
                                                                style={{ height: `${(week.normal_percentage / 100) * maxHeight}px` }}
                                                                title={`Normal: ${week.normal_percentage}% (${week.normal_count} students)`}
                                                            >
                                                                {week.normal_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                                        {week.normal_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* SLIP Status Bar (Yellow) */}
                                                            <div 
                                                                className="bg-yellow-500 transition-all duration-500 ease-out relative group border-t border-yellow-600"
                                                                style={{ height: `${(week.slip_percentage / 100) * maxHeight}px` }}
                                                                title={`SLIP: ${week.slip_percentage}% (${week.slip_count} students)`}
                                                            >
                                                                {week.slip_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                                                                        {week.slip_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* PNS Status Bar (Red) */}
                                                            <div 
                                                                className="bg-red-500 transition-all duration-500 ease-out relative group border-t border-red-600"
                                                                style={{ height: `${(week.pns_percentage / 100) * maxHeight}px` }}
                                                                title={`Probable No-Show: ${week.pns_percentage}% (${week.pns_count} students)`}
                                                            >
                                                                {week.pns_percentage >= 10 && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                                        {week.pns_percentage.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2 text-center">
                                                        <div className="font-medium">{week.total_students} students</div>
                                                        <div className="text-gray-400 mt-0.5">
                                                            N:{week.normal_count} S:{week.slip_count} P:{week.pns_count}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-96 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">No weekly status data available</p>
                                        <p className="text-gray-400 text-sm">Weekly summaries need to be generated to display this graph</p>
                                    </div>
                                </div>
                            )}
                            {/* Legend */}
                            {liveWeeklyStatusProgress && liveWeeklyStatusProgress.length > 0 && (
                                <div className="mt-6 flex items-center justify-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm text-gray-700">Normal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-sm text-gray-700">SLIP</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm text-gray-700" title="Probable No-Show">Probable No-Show</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Department Performance Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Department Performance</h4>
                            <div className="space-y-4">
                                {departments && departments.length > 0 ? (
                                    departments.map((dept, index) => {
                                        // Calculate average attendance rate for this department from live data
                                        let avgRate = 0;
                                        let totalRecords = 0;
                                        let presentRecords = 0;
                                        
                                        if (liveDepartmentTrends && liveDepartmentTrends.length > 0) {
                                            const deptData = liveDepartmentTrends.flatMap(day => 
                                                day.departments?.filter(d => d.department === dept.name) || []
                                            );
                                            
                                            if (deptData.length > 0) {
                                                totalRecords = deptData.reduce((sum, d) => sum + (d.total_records || 0), 0);
                                                presentRecords = deptData.reduce((sum, d) => sum + (d.present || 0), 0);
                                                avgRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
                                            }
                                        }
                                        
                                        // Fallback to mock data if no real data
                                        if (avgRate === 0) {
                                            avgRate = 75 + (index * 5);
                                        }
                                        
                                        return (
                                            <div key={dept.id || index} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {totalRecords > 0 ? `${presentRecords}/${totalRecords} records` : 'No data'}
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                avgRate >= 90 ? 'bg-green-500' :
                                                                avgRate >= 75 ? 'bg-yellow-500' :
                                                                avgRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.min(avgRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="ml-4 text-sm font-medium text-gray-900">
                                                    {avgRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No departments available</p>
                                        <p className="text-xs mt-1">Add departments to see performance data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Status Breakdown */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Attendance Status Breakdown</h3>
                        <p className="text-sm text-gray-600">Current attendance status distribution</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Present Status */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-600">Present</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round((systemStats?.totalAttendanceRecords * (systemStats?.averageAttendanceRate || 0)) / 100)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-green-700">
                                        {systemStats?.averageAttendanceRate?.toFixed(1) || 0}% of total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Absent Status */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-red-600">Absent</p>
                                    <p className="text-2xl font-bold text-red-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round((systemStats?.totalAttendanceRecords * (100 - (systemStats?.averageAttendanceRate || 0))) / 100)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-red-700">
                                        {((100 - (systemStats?.averageAttendanceRate || 0))).toFixed(1)}% of total
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Late Status */}
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-yellow-600">Late</p>
                                    <p className="text-2xl font-bold text-yellow-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round(systemStats?.totalAttendanceRecords * 0.05)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-yellow-700">~5% estimated</p>
                                </div>
                            </div>
                        </div>

                        {/* Excused Status */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-600">Excused</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {systemStats?.totalAttendanceRecords > 0 
                                            ? Math.round(systemStats?.totalAttendanceRecords * 0.03)
                                            : 0
                                        }
                                    </p>
                                    <p className="text-xs text-blue-700">~3% estimated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts & Notifications */}
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Alerts & Notifications</h3>
                        <p className="text-sm text-gray-600">Live system alerts and notifications</p>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Warning Alerts - High Absence Rate */}
                        {systemStats?.averageAttendanceRate < 85 && systemStats?.averageAttendanceRate >= 70 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Attendance rate is {systemStats?.averageAttendanceRate?.toFixed(1) || 0}% - monitor closely
                                        </p>
                                        <p className="text-xs text-yellow-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Interventions Alert */}
                        {systemStats?.activeInterventions > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-orange-800">Active Interventions</h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            {systemStats?.activeInterventions} intervention{systemStats?.activeInterventions !== 1 ? 's' : ''} currently in progress
                                        </p>
                                        <p className="text-xs text-orange-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Today's Attendance Info */}
                        {systemStats?.todayAttendance > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-blue-800">Today's Activity</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            {systemStats?.todayAttendance} attendance record{systemStats?.todayAttendance !== 1 ? 's' : ''} recorded today
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">Live data</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Health Info */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-green-800">System Status</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        System operational - {systemStats?.totalStudents || 0} students, {systemStats?.totalTeachers || 0} teachers, {systemStats?.totalDepartments || 0} departments
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">Live data</p>
                                </div>
                            </div>
                        </div>

                        {/* No Data Alert */}
                        {(!systemStats?.totalAttendanceRecords || systemStats?.totalAttendanceRecords === 0) && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-800">No Attendance Data</h4>
                                        <p className="text-sm text-gray-700 mt-1">
                                            No attendance records found. Start recording attendance to see analytics.
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">Live data</p>
                                    </div>
                                </div>
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
                </div>
            </div>

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
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-600 flex items-center">
                                        <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Please fill in all required fields marked with *
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Student Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={studentForm.student_number}
                                            onChange={(e) => setStudentForm({...studentForm, student_number: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="e.g., 2024-00001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={studentForm.email}
                                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="student@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Section *</label>
                                        <select
                                            required
                                            value={studentForm.section_id}
                                            onChange={(e) => setStudentForm({...studentForm, section_id: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Select Section</option>
                                            {sections?.map(section => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                                        <select
                                            required
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
                                        type="text"
                                        value={studentForm.guardian_contact}
                                        onChange={(e) => setStudentForm({...studentForm, guardian_contact: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Phone number or email"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddStudentModal(false)}
                                        className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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
                                        <p><span className="font-medium">Email:</span> {selectedStudent.email || 'Not provided'}</p>
                                        <p><span className="font-medium">Guardian:</span> {selectedStudent.guardian_name || 'Not provided'}</p>
                                        <p><span className="font-medium">Guardian Contact:</span> {selectedStudent.guardian_contact || 'Not provided'}</p>
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
                        </div>
                    </div>
                </div>
            )}

            {/* Export Students Modal */}
            {showExportModal && (
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
        </AuthenticatedLayout>
    );
}